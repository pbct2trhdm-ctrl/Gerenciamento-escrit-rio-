-- CreateTable
CREATE TABLE "Publicacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroProcessoIdentificado" TEXT,
    "processoId" TEXT,
    "dataPublicacao" DATETIME NOT NULL,
    "tribunalOrgao" TEXT NOT NULL,
    "textoPublicacao" TEXT NOT NULL,
    "statusVinculo" TEXT NOT NULL DEFAULT 'ORFA',
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "idExternoDjen" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Publicacao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfiguracaoPublicacoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "numeroOab" TEXT,
    "seccionalOab" TEXT,
    "horarioConsulta" TEXT NOT NULL DEFAULT '07:00',
    "ultimaExecucao" DATETIME,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Publicacao_idExternoDjen_key" ON "Publicacao"("idExternoDjen");
