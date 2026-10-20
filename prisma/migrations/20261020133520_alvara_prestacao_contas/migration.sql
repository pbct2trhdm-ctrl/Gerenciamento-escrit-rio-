-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Alvara" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "honorarioSucumbencialId" TEXT,
    "valorTotal" REAL NOT NULL,
    "impostoRetido" REAL NOT NULL DEFAULT 0,
    "tarifas" REAL NOT NULL DEFAULT 0,
    "honorariosContratuais" REAL NOT NULL DEFAULT 0,
    "honorariosSucumbencia" REAL NOT NULL DEFAULT 0,
    "reembolsoDespesas" REAL NOT NULL DEFAULT 0,
    "percentualContratual" REAL,
    "valorRetido" REAL NOT NULL,
    "valorRepassado" REAL NOT NULL,
    "dataRecebimento" DATETIME,
    "dataRepasse" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_REPASSE',
    "bancoDestino" TEXT,
    "agenciaDestino" TEXT,
    "contaDestino" TEXT,
    "chavePixDestino" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alvara_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Alvara_honorarioSucumbencialId_fkey" FOREIGN KEY ("honorarioSucumbencialId") REFERENCES "HonorarioSucumbencial" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Alvara" ("agenciaDestino", "bancoDestino", "chavePixDestino", "contaDestino", "criadoEm", "dataRecebimento", "dataRepasse", "honorarioSucumbencialId", "id", "observacoes", "processoId", "status", "valorRepassado", "valorRetido", "valorTotal") SELECT "agenciaDestino", "bancoDestino", "chavePixDestino", "contaDestino", "criadoEm", "dataRecebimento", "dataRepasse", "honorarioSucumbencialId", "id", "observacoes", "processoId", "status", "valorRepassado", "valorRetido", "valorTotal" FROM "Alvara";
DROP TABLE "Alvara";
ALTER TABLE "new_Alvara" RENAME TO "Alvara";
CREATE TABLE "new_Parcela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "honorarioId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" DATETIME,
    "notaFiscalEmitida" BOOLEAN NOT NULL DEFAULT false,
    "dataEmissaoNf" DATETIME,
    "quitadaPorAlvaraId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Parcela_honorarioId_fkey" FOREIGN KEY ("honorarioId") REFERENCES "Honorario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Parcela_quitadaPorAlvaraId_fkey" FOREIGN KEY ("quitadaPorAlvaraId") REFERENCES "Alvara" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Parcela" ("criadoEm", "dataEmissaoNf", "dataPagamento", "honorarioId", "id", "notaFiscalEmitida", "numero", "status", "valor", "vencimento") SELECT "criadoEm", "dataEmissaoNf", "dataPagamento", "honorarioId", "id", "notaFiscalEmitida", "numero", "status", "valor", "vencimento" FROM "Parcela";
DROP TABLE "Parcela";
ALTER TABLE "new_Parcela" RENAME TO "Parcela";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
