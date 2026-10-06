#!/bin/bash
#
# Instala (ou remove) as rotinas automáticas do sistema no macOS (launchd):
#   - com.pastanamota.backup        backup diário às 20h (npm run backup)
#   - com.pastanamota.notificacoes  verificação de prazos a cada 15 min
#   - com.pastanamota.publicacoes   busca no DJEN a cada 15 min
#
# As duas últimas só chamam o app em http://localhost:3000 — elas dependem
# do sistema estar rodando. As rotas só agem a partir do horário definido em
# Configurações e uma vez por dia, então rodar a cada 15 min é seguro.
#
# Uso:
#   bash scripts/instalar-rotinas.sh            instala/atualiza
#   bash scripts/instalar-rotinas.sh --remover  remove as três rotinas
#
# Pode ser executado de novo quantas vezes quiser (ex.: depois de mover a
# pasta do projeto ou reinstalar o Node): ele refaz os agendamentos.

set -euo pipefail

PROJETO="$(cd "$(dirname "$0")/.." && pwd)"
AGENTES="$HOME/Library/LaunchAgents"
LOGS="$HOME/Library/Logs"
UID_ATUAL="$(id -u)"
ROTINAS=(backup notificacoes publicacoes)

descarregar() {
  launchctl bootout "gui/$UID_ATUAL/com.pastanamota.$1" 2>/dev/null || true
}

if [[ "${1:-}" == "--remover" ]]; then
  for rotina in "${ROTINAS[@]}"; do
    descarregar "$rotina"
    rm -f "$AGENTES/com.pastanamota.$rotina.plist"
  done
  echo "Rotinas removidas."
  exit 0
fi

if [[ "$(uname)" != "Darwin" ]]; then
  echo "Este script é para macOS." >&2
  exit 1
fi

NODE="$(command -v node || true)"
if [[ -z "$NODE" ]]; then
  echo "Node.js não encontrado. Instale pelo nodejs.org e rode de novo." >&2
  exit 1
fi

cd "$PROJETO"
[[ -f .env ]] || cp .env.example .env

# Lê VAR do .env (linha não comentada), sem aspas.
ler_env() {
  grep -E "^$1=" .env | tail -n 1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true
}

# Gera o segredo da rota se ainda não existir no .env.
garantir_segredo() {
  if [[ -z "$(ler_env "$1")" ]]; then
    printf '\n%s=%s\n' "$1" "$(openssl rand -hex 32)" >> .env
    echo "• $1 criado no .env"
  fi
}

garantir_segredo NOTIFICACOES_CRON_SECRET
garantir_segredo PUBLICACOES_CRON_SECRET
SEGREDO_NOTIFICACOES="$(ler_env NOTIFICACOES_CRON_SECRET)"
SEGREDO_PUBLICACOES="$(ler_env PUBLICACOES_CRON_SECRET)"

# OneDrive: se ainda não configurado e houver uma pasta do OneDrive no Mac, oferece usar.
if [[ -z "$(ler_env BACKUP_ONEDRIVE_DIR)" ]]; then
  ONEDRIVE_RAIZ="$(ls -d "$HOME"/Library/CloudStorage/OneDrive* 2>/dev/null | head -n 1 || true)"
  if [[ -n "$ONEDRIVE_RAIZ" ]]; then
    DESTINO_ONEDRIVE="$ONEDRIVE_RAIZ/Backups/PastanaMota"
    read -r -p "Guardar cópia dos backups no OneDrive ($DESTINO_ONEDRIVE)? [s/n] " resposta
    if [[ "$resposta" =~ ^[sS] ]]; then
      mkdir -p "$DESTINO_ONEDRIVE"
      printf '\nBACKUP_ONEDRIVE_DIR="%s"\n' "$DESTINO_ONEDRIVE" >> .env
      echo "• Backups também irão para o OneDrive"
    fi
  else
    echo "• OneDrive não encontrado neste Mac — backups ficarão só na pasta backups/ do projeto."
  fi
fi

mkdir -p "$AGENTES" "$LOGS"

escrever_rotina_http() {
  local nome="$1" rota="$2" segredo="$3"
  cat > "$AGENTES/com.pastanamota.$nome.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pastanamota.$nome</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/curl</string>
        <string>-fsS</string>
        <string>-H</string>
        <string>Authorization: Bearer $segredo</string>
        <string>http://localhost:3000$rota</string>
    </array>
    <key>StartInterval</key>
    <integer>900</integer>
    <key>StandardOutPath</key>
    <string>$LOGS/pastana-mota-$nome.log</string>
    <key>StandardErrorPath</key>
    <string>$LOGS/pastana-mota-$nome.log</string>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
PLIST
}

cat > "$AGENTES/com.pastanamota.backup.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pastanamota.backup</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE</string>
        <string>scripts/backup.mjs</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJETO</string>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>20</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>$LOGS/pastana-mota-backup.log</string>
    <key>StandardErrorPath</key>
    <string>$LOGS/pastana-mota-backup.log</string>
    <key>RunAtLoad</key>
    <false/>
</dict>
</plist>
PLIST

escrever_rotina_http notificacoes /api/notificacoes/verificar "$SEGREDO_NOTIFICACOES"
escrever_rotina_http publicacoes /api/publicacoes-djen/verificar "$SEGREDO_PUBLICACOES"

for rotina in "${ROTINAS[@]}"; do
  descarregar "$rotina"
  launchctl bootstrap "gui/$UID_ATUAL" "$AGENTES/com.pastanamota.$rotina.plist"
done
echo "• Rotinas instaladas: backup (20h), prazos e publicações (a cada 15 min)"

# Testa o backup agora, pelo próprio agendador, para revelar já um bloqueio
# de permissão do macOS (pasta Documentos) em vez de só descobrir às 20h.
echo "• Testando o backup agendado…"
LOG_BACKUP="$LOGS/pastana-mota-backup.log"
LINHAS_ANTES=$(wc -l 2>/dev/null < "$LOG_BACKUP" || echo 0)
launchctl kickstart -k "gui/$UID_ATUAL/com.pastanamota.backup"
sleep 15
NOVO_LOG="$(tail -n +"$((LINHAS_ANTES + 1))" "$LOG_BACKUP" 2>/dev/null || true)"
echo "$NOVO_LOG"
if echo "$NOVO_LOG" | grep -qiE "operation not permitted|EPERM|EACCES"; then
  cat <<AVISO

ATENÇÃO: o macOS bloqueou o acesso do backup à pasta do projeto.
Libere assim:
  1. Ajustes do Sistema → Privacidade e Segurança → Acesso Total ao Disco
  2. Clique em +, aperte Cmd+Shift+G, digite $NODE e clique em Abrir
  3. Deixe a chave ligada e rode este script de novo.
AVISO
  exit 1
fi
if echo "$NOVO_LOG" | grep -q "Falha ao copiar o backup para o OneDrive"; then
  cat <<AVISO

ATENÇÃO: o backup local foi criado, mas a cópia para o OneDrive falhou.
  1. Confira se o app do OneDrive está aberto (ícone de nuvem na barra de menus)
     e sincronizando.
  2. Ajustes do Sistema → Privacidade e Segurança → Acesso Total ao Disco:
     adicione $NODE (Cmd+Shift+G para digitar o caminho) e ligue a chave.
  3. Rode este script de novo para testar.
AVISO
  exit 1
fi
if ! echo "$NOVO_LOG" | grep -q "Backup concluído"; then
  echo
  echo "ATENÇÃO: o teste do backup não terminou como esperado. Veja a mensagem acima"
  echo "ou o log em $LOG_BACKUP e me envie o texto."
  exit 1
fi

cat <<FIM

Pronto! Reinicie o sistema para ele ler os segredos novos do .env:
  no Terminal do sistema, Ctrl+C e depois: npm run dev

Logs das rotinas: $LOGS/pastana-mota-*.log
FIM
