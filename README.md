# Gestão de Escritório — Pastana Mota Sociedade Individual de Advocacia

Aplicativo web para gestão individual do escritório: clientes, processos e controle de prazos processuais com cálculo automático (dias úteis com feriados nacionais, ou dias corridos).

## Stack

- Next.js (App Router) + TypeScript
- Prisma ORM + SQLite (driver adapter `@prisma/adapter-better-sqlite3`)
- Tailwind CSS

## Como rodar

```bash
npm install
cp .env.example .env
npx prisma migrate deploy   # cria o banco SQLite com o schema
npm run dev
```

Acesse http://localhost:3000.

## Modelo de dados

- **Cliente**: nome/razão social, tipo (PF/PJ), CPF/CNPJ, telefone, email, observações.
- **Processo**: vinculado a um cliente, número (opcional), área, vara/tribunal, status, resumo.
- **Prazo**: vinculado a um processo, tipo, data base, dias, tipo de contagem (dias úteis/corridos), data final (calculada automaticamente), status.

O cálculo de dias úteis considera fins de semana e feriados nacionais brasileiros (fixos e móveis: Carnaval, Sexta-feira Santa, Corpus Christi) — ver `lib/prazos.ts`.

## Telas

- **Dashboard**: prazos pendentes mais próximos de vencer, com destaque para os que vencem em até 7 dias.
- **Clientes**: listagem com busca/filtro, cadastro/edição, processos vinculados.
- **Processos**: listagem com busca/filtro, cadastro/edição, prazos vinculados.
- **Prazos/Agenda**: listagem geral com filtros, cadastro/edição com cálculo automático da data final, ação rápida "marcar como cumprido".
- **Financeiro**: honorários contratuais e parcelas, honorários de sucumbência, alvarás/repasses, despesas e obrigações societárias (pró-labore, DAS, INSS, CPP, retiradas de lucro). Ver detalhes abaixo.

### Módulo Financeiro

Sub-abas: Visão Geral | Honorários | Sucumbência | Alvarás | Despesas | Obrigações do Sócio.

- **Honorários**: contrato por processo (fixo/parcelado/êxito/mensalidade) com parcelas; cada parcela tem status pendente/pago (atrasado é calculado em tempo de leitura comparando o vencimento com a data atual — não é um valor persistido) e controle de nota fiscal emitida.
- **Sucumbência**: valor estimado/definido, percentual, status (aguardando decisão → definido → em execução → recebido), forma de recebimento e nota fiscal.
- **Alvarás**: valor total, valor retido (honorários) e valor repassado ao cliente (calculado automaticamente como total − retido, editável), dados bancários de destino, com alerta para os que aguardam repasse há mais de 7 dias.
- **Despesas**: descrição, categoria, valor, data, com vínculo opcional a um processo (ex.: custas).
- **Obrigações do Sócio**: fechamento mensal navegável por competência (pró-labore, DAS, INSS sócio 11%, CPP patronal 20% — sugeridos automaticamente a partir do pró-labore) e retiradas de lucro livres no mês.

Regras de composição do dashboard financeiro (ver `lib/financeiro.ts` e `app/financeiro/page.tsx`):
- Sucumbência "aguardando decisão" não entra em "a receber"; só "definido"/"em execução" compõem o bloco de sucumbência a receber, separado dos honorários a receber.
- "Recebido no mês" soma parcelas pagas, sucumbências recebidas e o valor retido de alvarás recebidos no mês.
- "Saldo do mês" desconta despesas operacionais, obrigações societárias pagas e retiradas de lucro do total recebido.
- Alertas: pagamentos (parcelas/sucumbência) sem nota fiscal emitida, e alvarás aguardando repasse há mais de 7 dias.

## Fora de escopo (v1)

- Módulo de documentos/modelos de petições
- Multiusuário/autenticação
- Notificações por email/push

O modelo de dados não possui campos de usuário/autenticação, mas foi desenhado para permitir adicionar isso depois sem reestruturação (basta incluir uma tabela de usuários e um `usuarioId` opcional nas entidades).
