-- CreateTable
CREATE TABLE "ProcessoAdministrativo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "processoJudicialId" TEXT,
    "orgao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numeroProtocolo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_ANALISE',
    "dataAbertura" DATETIME NOT NULL,
    "dataDecisao" DATETIME,
    "resumo" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessoAdministrativo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessoAdministrativo_processoJudicialId_fkey" FOREIGN KEY ("processoJudicialId") REFERENCES "Processo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecursoAdministrativo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoAdministrativoId" TEXT NOT NULL,
    "orgaoRecursal" TEXT NOT NULL,
    "dataInterposicao" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_ANALISE',
    "resultado" TEXT,
    "dataJulgamento" DATETIME,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecursoAdministrativo_processoAdministrativoId_fkey" FOREIGN KEY ("processoAdministrativoId") REFERENCES "ProcessoAdministrativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Andamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT,
    "processoAdministrativoId" TEXT,
    "data" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "arquivoNome" TEXT,
    "arquivoCaminho" TEXT,
    "arquivoTipo" TEXT,
    "recursoId" TEXT,
    "recursoAdministrativoId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Andamento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Andamento_processoAdministrativoId_fkey" FOREIGN KEY ("processoAdministrativoId") REFERENCES "ProcessoAdministrativo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Andamento_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Andamento_recursoAdministrativoId_fkey" FOREIGN KEY ("recursoAdministrativoId") REFERENCES "RecursoAdministrativo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Andamento" ("arquivoCaminho", "arquivoNome", "arquivoTipo", "criadoEm", "data", "descricao", "id", "processoId", "recursoId", "tipo") SELECT "arquivoCaminho", "arquivoNome", "arquivoTipo", "criadoEm", "data", "descricao", "id", "processoId", "recursoId", "tipo" FROM "Andamento";
DROP TABLE "Andamento";
ALTER TABLE "new_Andamento" RENAME TO "Andamento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
