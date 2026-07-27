-- CreateTable
CREATE TABLE "Recurso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "tipoRecurso" TEXT NOT NULL,
    "dataInterposicao" DATETIME NOT NULL,
    "tribunal2Grau" TEXT,
    "orgaoJulgador" TEXT,
    "relator" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_REMESSA',
    "resultado" TEXT,
    "dataJulgamento" DATETIME,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recurso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Andamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "arquivoNome" TEXT,
    "arquivoCaminho" TEXT,
    "arquivoTipo" TEXT,
    "recursoId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Andamento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Andamento_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Andamento" ("arquivoCaminho", "arquivoNome", "arquivoTipo", "criadoEm", "data", "descricao", "id", "processoId", "tipo") SELECT "arquivoCaminho", "arquivoNome", "arquivoTipo", "criadoEm", "data", "descricao", "id", "processoId", "tipo" FROM "Andamento";
DROP TABLE "Andamento";
ALTER TABLE "new_Andamento" RENAME TO "Andamento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
