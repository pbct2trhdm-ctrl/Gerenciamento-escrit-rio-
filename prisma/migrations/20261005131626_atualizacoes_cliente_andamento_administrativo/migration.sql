-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AtualizacaoCliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT,
    "processoAdministrativoId" TEXT,
    "arquivoNome" TEXT NOT NULL,
    "arquivoCaminho" TEXT NOT NULL,
    "arquivoTipo" TEXT NOT NULL,
    "orientacoes" TEXT,
    "resumoInterno" TEXT,
    "tipoAndamento" TEXT,
    "dataMovimentacao" DATETIME,
    "mensagemWhatsapp" TEXT NOT NULL DEFAULT '',
    "assuntoEmail" TEXT NOT NULL DEFAULT '',
    "corpoEmail" TEXT NOT NULL DEFAULT '',
    "erroGeracao" TEXT,
    "whatsappEnviadoEm" DATETIME,
    "whatsappErro" TEXT,
    "emailEnviadoEm" DATETIME,
    "emailErro" TEXT,
    "andamentoId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "AtualizacaoCliente_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AtualizacaoCliente_processoAdministrativoId_fkey" FOREIGN KEY ("processoAdministrativoId") REFERENCES "ProcessoAdministrativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AtualizacaoCliente_andamentoId_fkey" FOREIGN KEY ("andamentoId") REFERENCES "Andamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AtualizacaoCliente" ("arquivoCaminho", "arquivoNome", "arquivoTipo", "assuntoEmail", "atualizadoEm", "corpoEmail", "criadoEm", "emailEnviadoEm", "emailErro", "erroGeracao", "id", "mensagemWhatsapp", "orientacoes", "processoId", "resumoInterno", "whatsappEnviadoEm", "whatsappErro") SELECT "arquivoCaminho", "arquivoNome", "arquivoTipo", "assuntoEmail", "atualizadoEm", "corpoEmail", "criadoEm", "emailEnviadoEm", "emailErro", "erroGeracao", "id", "mensagemWhatsapp", "orientacoes", "processoId", "resumoInterno", "whatsappEnviadoEm", "whatsappErro" FROM "AtualizacaoCliente";
DROP TABLE "AtualizacaoCliente";
ALTER TABLE "new_AtualizacaoCliente" RENAME TO "AtualizacaoCliente";
CREATE UNIQUE INDEX "AtualizacaoCliente_andamentoId_key" ON "AtualizacaoCliente"("andamentoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
