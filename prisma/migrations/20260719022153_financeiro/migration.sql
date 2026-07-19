-- CreateTable
CREATE TABLE "Honorario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valorTotal" REAL,
    "percentualExito" REAL,
    "dataContrato" DATETIME NOT NULL,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Honorario_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "honorarioId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "vencimento" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" DATETIME,
    "notaFiscalEmitida" BOOLEAN NOT NULL DEFAULT false,
    "dataEmissaoNf" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Parcela_honorarioId_fkey" FOREIGN KEY ("honorarioId") REFERENCES "Honorario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HonorarioSucumbencial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "valorEstimado" REAL,
    "valorDefinido" REAL,
    "percentual" REAL,
    "status" TEXT NOT NULL DEFAULT 'AGUARDANDO_DECISAO',
    "formaRecebimento" TEXT,
    "dataTransitoJulgado" DATETIME,
    "dataRecebimento" DATETIME,
    "notaFiscalEmitida" BOOLEAN NOT NULL DEFAULT false,
    "dataEmissaoNf" DATETIME,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HonorarioSucumbencial_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alvara" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "processoId" TEXT NOT NULL,
    "honorarioSucumbencialId" TEXT,
    "valorTotal" REAL NOT NULL,
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

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "data" DATETIME NOT NULL,
    "processoId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Despesa_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObrigacaoSocietaria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competencia" DATETIME NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "dataPagamento" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RetiradaLucro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "valor" REAL NOT NULL,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ObrigacaoSocietaria_competencia_tipo_key" ON "ObrigacaoSocietaria"("competencia", "tipo");
