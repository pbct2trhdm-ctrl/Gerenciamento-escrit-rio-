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

## Fora de escopo (v1)

- Módulo financeiro (honorários, contas a receber)
- Módulo de documentos/modelos de petições
- Multiusuário/autenticação
- Notificações por email/push

O modelo de dados não possui campos de usuário/autenticação, mas foi desenhado para permitir adicionar isso depois sem reestruturação (basta incluir uma tabela de usuários e um `usuarioId` opcional nas entidades).
