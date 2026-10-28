# Gestão de Escritório — Pastana Mota Sociedade Individual de Advocacia

Aplicativo web para gestão individual do escritório: clientes, processos e controle de prazos processuais com cálculo automático (dias úteis com feriados nacionais, ou dias corridos).

## Stack

- Next.js (App Router) + TypeScript
- Prisma ORM + SQLite (driver adapter `@prisma/adapter-better-sqlite3`)
- Tailwind CSS

## Como rodar

```bash
npm install                # também gera o Prisma Client (postinstall)
cp .env.example .env
npx prisma migrate deploy  # cria o banco SQLite com o schema
npm run dev
```

Acesse http://localhost:3000.

> Se aparecer o erro `Module not found: Can't resolve '@/app/generated/prisma/client'`,
> rode `npx prisma generate` manualmente e reinicie o `npm run dev`.

## Modelo de dados

- **Cliente**: nome/razão social, tipo (PF/PJ), CPF/CNPJ, telefone, email, observações.
- **Processo**: vinculado a um cliente, número (opcional), área, vara/tribunal, status, grau (1º grau, 2º grau/Turma Recursal ou tribunal superior — muda sozinho ao registrar a remessa de um recurso e volta ao 1º grau com o andamento "Baixa dos autos ao 1º grau" ou o botão de atalho na tela do processo), resumo.
- **Prazo**: vinculado a um processo, tipo, data base, dias, tipo de contagem (dias úteis/corridos), data final (calculada automaticamente), status.

O cálculo de dias úteis considera fins de semana e feriados nacionais brasileiros (fixos e móveis: Carnaval, Sexta-feira Santa, Corpus Christi) — ver `lib/prazos.ts`.

## Telas

- **Dashboard**: prazos pendentes mais próximos de vencer, com destaque para os que vencem em até 7 dias.
- **Clientes**: listagem com busca/filtro, cadastro/edição, processos vinculados.
- **Processos**: listagem com busca/filtros (status, grau, área, tribunal, comarca/vara), cadastro/edição, prazos vinculados.
- **Prazos/Agenda**: listagem geral com filtros, cadastro/edição com cálculo automático da data final, ação rápida "marcar como cumprido".
- **Financeiro**: honorários contratuais e parcelas, honorários de sucumbência, alvarás/repasses, despesas e obrigações societárias (pró-labore, DAS, INSS, CPP, retiradas de lucro). Ver detalhes abaixo.

### Módulo Financeiro

Sub-abas: Visão Geral | Honorários | Sucumbência | Alvarás | Despesas | Obrigações do Sócio.

- **Honorários**: contrato por processo (fixo/parcelado/êxito/mensalidade) com parcelas; cada parcela tem status pendente/pago (atrasado é calculado em tempo de leitura comparando o vencimento com a data atual — não é um valor persistido) e controle de nota fiscal emitida.
- **Sucumbência**: valor estimado/definido, percentual, status (aguardando decisão → definido → em execução → recebido), forma de recebimento e nota fiscal.
- **Alvarás**: valor bruto, descontos na fonte (IR retido, tarifas) e composição do que fica no escritório — honorários contratuais (com cálculo pelo % sobre o crédito do cliente, líquido − sucumbência), sucumbência e reembolso de despesas adiantadas; o repasse ao cliente é calculado (`lib/alvara.ts`). Gera a **prestação de contas em PDF** com a logo, o demonstrativo e a declaração de quitação para o cliente assinar; o PDF do alvará judicial e o comprovante do repasse (PDF, JPG ou PNG) anexados ao alvará são juntados ao final do mesmo arquivo (`lib/juntar-pdf.ts`). A parcela de honorários quitada pelo alvará e a sucumbência vinculada são marcadas como pagas/recebidas, mas entram no caixa só pelo alvará (sem contagem em dobro). O Financeiro mostra quanto há de dinheiro de clientes recebido e ainda não repassado, e alerta alvarás aguardando repasse há mais de 7 dias.
- **Despesas**: descrição, categoria, valor, data, com vínculo opcional a um processo (ex.: custas).
- **Obrigações do Sócio**: fechamento mensal navegável por competência (pró-labore, DAS, INSS sócio 11%, CPP patronal 20% — sugeridos automaticamente a partir do pró-labore) e retiradas de lucro livres no mês.

Regras de composição do dashboard financeiro (ver `lib/financeiro.ts` e `app/financeiro/page.tsx`):
- Sucumbência "aguardando decisão" não entra em "a receber"; só "definido"/"em execução" compõem o bloco de sucumbência a receber, separado dos honorários a receber.
- "Recebido no mês" soma parcelas pagas, sucumbências recebidas e o valor retido de alvarás recebidos no mês.
- "Saldo do mês" desconta despesas operacionais, obrigações societárias pagas e retiradas de lucro do total recebido.
- Alertas: pagamentos (parcelas/sucumbência) sem nota fiscal emitida, e alvarás aguardando repasse há mais de 7 dias.

### Publicações do DJEN → prazo automático

Publicação vinculada a um processo (pelo número CNJ, comparando só os dígitos) vira andamento e, se o texto informa o prazo ("no prazo de 15 (quinze) dias"), o prazo é cadastrado automaticamente com o selo **A conferir** — aparece no Dashboard e entra nos avisos de WhatsApp; um clique em "Confirmar prazo" (ou editar o prazo) remove o selo. Contagem: publicação no 1º dia útil após a disponibilização no DJEN e início no dia útil seguinte (Lei 11.419/2006, art. 4º); dias úteis, ou corridos se o texto disser ou o processo for penal. Considera só feriados nacionais (não locais nem recesso forense). Se o texto não traz um número de dias claro (ex.: "no prazo legal", ou prazos diferentes no mesmo texto), nenhum prazo é criado: a publicação fica em destaque no Dashboard como "sem prazo identificado" até a advogada informar os dias ou marcar "não abre prazo" — ver `lib/prazo-publicacao.ts`.

**Prazo da parte contrária:** o processo tem o campo "Seu cliente é" (polo ativo ou passivo), preenchido à mão ou descoberto pelo texto das publicações ("NOME (A)", "AUTOR: NOME", "REQUERIDO: NOME"). Antes de criar o prazo, o sistema lê a frase da ordem: se ela se dirige à parte contrária ("intime-se a parte ré…" com o cliente no polo ativo), o prazo não é criado e a publicação registra o motivo; se se dirige ao cliente (pelo polo ou pelo nome), a "as partes" ou não dá para saber, o prazo é criado "a conferir". Ao definir o polo, prazos "a conferir" já gerados que eram da parte contrária são removidos — ver `lib/polo.ts`.

### Publicações do DJEN → audiência na agenda

Ao vincular uma publicação a um processo, o sistema procura, perto da palavra "audiência", uma data futura com horário (numérica ou por extenso), a modalidade (virtual/videoconferência, híbrida, presencial) e o link da sala (Teams, Zoom, Meet…). A audiência entra em Prazos/Agenda vinculada ao processo, com o selo **A conferir** e os avisos de WhatsApp. Texto de redesignação ("redesigno… para o dia…") move a data da audiência pendente do processo, com histórico de redesignação e andamento. Datas passadas são ignoradas e, havendo mais de uma data futura possível, nada é criado. Não duplica (mesma data/hora, publicação já processada ou data já redesignada). A importação de histórico também cadastra audiências futuras, e o botão "Buscar audiências nas publicações já importadas" (em Publicações) reprocessa o que foi importado antes — ver `lib/audiencia-publicacao.ts`.

### Atualizações ao cliente (IA)

Na tela do processo (judicial ou administrativo), **Atualizar cliente**: anexe o PDF baixado do processo (até 22 MB / 600 páginas). A IA (Claude, da Anthropic) identifica a movimentação mais recente e redige, em linguagem simples, uma mensagem de WhatsApp e um e-mail para o cliente, além de um resumo técnico para conferência. Nada é enviado automaticamente: o texto fica editável e só sai ao clicar em **Enviar por WhatsApp** (provedor configurado em Configurações, para o telefone do cadastro do cliente) ou **Enviar por e-mail** (conta Gmail, para o e-mail do cadastro). O PDF fica guardado no processo e não é enviado ao cliente. No primeiro envio (ou pelo botão "Registrar andamento sem enviar"), a movimentação identificada — tipo, data e resumo técnico sugeridos pela IA e editáveis — é registrada nos andamentos do processo, com o PDF anexado e o selo "Cliente atualizado". Há também "Copiar texto" e "Abrir no WhatsApp Web" como alternativa sem provedor configurado.

Configuração no `.env` (ver `.env.example`): `ANTHROPIC_API_KEY` para a IA; `GMAIL_USUARIO` e `GMAIL_SENHA_APP` (senha de app do Google) para o e-mail. O conteúdo do PDF é enviado à API da Anthropic para gerar a mensagem.

## Diagnóstico do DJEN

```bash
npm run diagnostico-djen            # usa a OAB salva em Configurações
npm run diagnostico-djen -- 12345 PA
```

Faz a mesma consulta do sistema (últimos 7 dias) e mostra a resposta crua da API — útil quando publicações conhecidas não aparecem.

## Rotinas automáticas (macOS)

```bash
npm run rotinas
```

Instala três agendamentos do macOS (launchd): backup diário às 20h (`npm run backup`, com cópia opcional no OneDrive), verificação de prazos para aviso por WhatsApp e busca de publicações no DJEN (a cada 15 min; os avisos de prazo saem uma vez por dia a partir do horário definido em Configurações, e a busca no DJEN se repete de hora em hora a partir do horário configurado). Gera os segredos `NOTIFICACOES_CRON_SECRET` e `PUBLICACOES_CRON_SECRET` no `.env` se faltarem. As rotinas de prazos e publicações dependem do sistema rodando em http://localhost:3000. Para remover: `bash scripts/instalar-rotinas.sh --remover`.

## Ligar sozinho com o Mac (macOS)

```bash
npm run servico
```

Compila a versão de produção e instala o serviço `com.pastanamota.app` (launchd), que inicia o sistema em http://localhost:3000 ao fazer login no Mac e o religa se ele parar. Depois disso não use mais `npm run dev`. Log: `~/Library/Logs/pastana-mota-app.log`. Para remover: `bash scripts/instalar-servico.sh --remover`.

## Atualizar

Depois de puxar alterações do GitHub:

```bash
npm run atualizar
```

Instala dependências, aplica as migrações, regenera o Prisma Client e, se o serviço estiver instalado, recompila e o reinicia.

## Fora de escopo (v1)

- Módulo de documentos/modelos de petições
- Multiusuário/autenticação

O modelo de dados não possui campos de usuário/autenticação, mas foi desenhado para permitir adicionar isso depois sem reestruturação (basta incluir uma tabela de usuários e um `usuarioId` opcional nas entidades).
