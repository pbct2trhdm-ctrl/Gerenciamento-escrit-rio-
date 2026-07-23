-- CreateTable
CREATE TABLE "Andamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "arquivoNome" TEXT,
    "arquivoCaminho" TEXT,
    "arquivoTipo" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Andamento_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prazo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dataBase" DATETIME,
    "dias" INTEGER,
    "contagem" TEXT,
    "dataFinal" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "modalidadeAudiencia" TEXT,
    "linkAudiencia" TEXT,
    "contatoVaraAudiencia" TEXT,
    "origemAndamentoId" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prazo_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prazo_origemAndamentoId_fkey" FOREIGN KEY ("origemAndamentoId") REFERENCES "Andamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Prazo" ("contagem", "contatoVaraAudiencia", "criadoEm", "dataBase", "dataFinal", "dias", "id", "linkAudiencia", "modalidadeAudiencia", "observacoes", "processoId", "status", "tipo") SELECT "contagem", "contatoVaraAudiencia", "criadoEm", "dataBase", "dataFinal", "dias", "id", "linkAudiencia", "modalidadeAudiencia", "observacoes", "processoId", "status", "tipo" FROM "Prazo";
DROP TABLE "Prazo";
ALTER TABLE "new_Prazo" RENAME TO "Prazo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
