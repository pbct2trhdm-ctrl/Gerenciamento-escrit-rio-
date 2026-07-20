/*
  Warnings:

  - You are about to drop the column `varaTribunal` on the `Processo` table. All the data in the column will be lost.

*/
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
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prazo_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Prazo" ("contagem", "criadoEm", "dataBase", "dataFinal", "dias", "id", "observacoes", "processoId", "status", "tipo") SELECT "contagem", "criadoEm", "dataBase", "dataFinal", "dias", "id", "observacoes", "processoId", "status", "tipo" FROM "Prazo";
DROP TABLE "Prazo";
ALTER TABLE "new_Prazo" RENAME TO "Prazo";
CREATE TABLE "new_Processo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "numeroProcesso" TEXT,
    "area" TEXT NOT NULL,
    "vara" TEXT,
    "comarca" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "resumo" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Processo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Processo" ("area", "clienteId", "criadoEm", "id", "numeroProcesso", "resumo", "status", "vara") SELECT "area", "clienteId", "criadoEm", "id", "numeroProcesso", "resumo", "status", "varaTribunal" FROM "Processo";
DROP TABLE "Processo";
ALTER TABLE "new_Processo" RENAME TO "Processo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
