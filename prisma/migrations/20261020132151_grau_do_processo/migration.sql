-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Processo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "numeroProcesso" TEXT,
    "area" TEXT NOT NULL,
    "areaOutraDescricao" TEXT,
    "jurisdicao" TEXT,
    "rito" TEXT,
    "tribunal" TEXT,
    "vara" TEXT,
    "comarca" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "grau" TEXT NOT NULL DEFAULT 'PRIMEIRO_GRAU',
    "resumo" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Processo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Processo" ("area", "areaOutraDescricao", "clienteId", "comarca", "criadoEm", "id", "jurisdicao", "numeroProcesso", "resumo", "rito", "status", "tribunal", "vara") SELECT "area", "areaOutraDescricao", "clienteId", "comarca", "criadoEm", "id", "jurisdicao", "numeroProcesso", "resumo", "rito", "status", "tribunal", "vara" FROM "Processo";
DROP TABLE "Processo";
ALTER TABLE "new_Processo" RENAME TO "Processo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
