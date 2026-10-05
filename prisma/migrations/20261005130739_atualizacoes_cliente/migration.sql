-- CreateTable
CREATE TABLE "AtualizacaoCliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "arquivoCaminho" TEXT NOT NULL,
    "arquivoTipo" TEXT NOT NULL,
    "orientacoes" TEXT,
    "resumoInterno" TEXT,
    "mensagemWhatsapp" TEXT NOT NULL DEFAULT '',
    "assuntoEmail" TEXT NOT NULL DEFAULT '',
    "corpoEmail" TEXT NOT NULL DEFAULT '',
    "erroGeracao" TEXT,
    "whatsappEnviadoEm" DATETIME,
    "whatsappErro" TEXT,
    "emailEnviadoEm" DATETIME,
    "emailErro" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "AtualizacaoCliente_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
