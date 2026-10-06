#!/bin/bash
#
# Faz o sistema ligar sozinho no macOS (launchd), sem Terminal aberto:
# compila a versão de produção (next build) e instala o agendamento
# com.pastanamota.app, que inicia `next start` na porta 3000 ao fazer login
# e o religa automaticamente se ele parar.
#
# Uso:
#   bash scripts/instalar-servico.sh            instala/atualiza
#   bash scripts/instalar-servico.sh --remover  remove (volta ao npm run dev)
#
# Depois de instalado, NÃO use mais `npm run dev` (a porta 3000 já estará
# ocupada pelo serviço). Para aplicar atualizações: npm run atualizar.

set -euo pipefail

PROJETO="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$HOME/Library/LaunchAgents/com.pastanamota.app.plist"
LOG="$HOME/Library/Logs/pastana-mota-app.log"
ALVO="gui/$(id -u)/com.pastanamota.app"

if [[ "${1:-}" == "--remover" ]]; then
  launchctl bootout "$ALVO" 2>/dev/null || true
  rm -f "$PLIST"
  echo "Serviço removido. Para usar o sistema, volte a rodar: npm run dev"
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

# Libera a porta 3000 se houver um `npm run dev` ou serviço antigo rodando.
launchctl bootout "$ALVO" 2>/dev/null || true
if lsof -ti tcp:3000 >/dev/null 2>&1; then
  echo "• A porta 3000 está em uso (provavelmente um 'npm run dev' aberto)."
  echo "  Feche-o com Ctrl+C na janela do Terminal dele e rode este script de novo."
  exit 1
fi

echo "• Compilando a versão de produção (leva 1 a 3 minutos)…"
npm run build >/dev/null 2>&1 || {
  echo "Falha ao compilar. Rode 'npm run build' para ver o erro e me envie o texto." >&2
  exit 1
}

mkdir -p "$(dirname "$PLIST")" "$(dirname "$LOG")"
cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.pastanamota.app</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE</string>
        <string>node_modules/next/dist/bin/next</string>
        <string>start</string>
        <string>-p</string>
        <string>3000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJETO</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>$(dirname "$NODE"):/usr/local/bin:/usr/bin:/bin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>$LOG</string>
    <key>StandardErrorPath</key>
    <string>$LOG</string>
</dict>
</plist>
PLIST

launchctl bootstrap "gui/$(id -u)" "$PLIST"

echo "• Iniciando o sistema…"
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null http://localhost:3000; then
    cat <<FIM

Pronto! O sistema está no ar em http://localhost:3000
e vai ligar sozinho sempre que você entrar no Mac.

• Não use mais 'npm run dev'.
• Para aplicar atualizações: npm run atualizar
• Log do sistema: $LOG
FIM
    exit 0
  fi
  sleep 2
done

echo
echo "ATENÇÃO: o sistema não respondeu em 60 segundos. Últimas linhas do log:"
tail -n 20 "$LOG" 2>/dev/null || true
exit 1
