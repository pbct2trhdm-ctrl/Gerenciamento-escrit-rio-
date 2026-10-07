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
    "diasAntecedenciaNotificacao" INTEGER,
    "observacoes" TEXT,
    "aConferir" BOOLEAN NOT NULL DEFAULT false,
    "origemPublicacaoId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Prazo_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prazo_origemAndamentoId_fkey" FOREIGN KEY ("origemAndamentoId") REFERENCES "Andamento" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prazo_origemPublicacaoId_fkey" FOREIGN KEY ("origemPublicacaoId") REFERENCES "Publicacao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Prazo" ("contagem", "contatoVaraAudiencia", "criadoEm", "dataBase", "dataFinal", "dias", "diasAntecedenciaNotificacao", "id", "linkAudiencia", "modalidadeAudiencia", "observacoes", "origemAndamentoId", "processoId", "status", "tipo") SELECT "contagem", "contatoVaraAudiencia", "criadoEm", "dataBase", "dataFinal", "dias", "diasAntecedenciaNotificacao", "id", "linkAudiencia", "modalidadeAudiencia", "observacoes", "origemAndamentoId", "processoId", "status", "tipo" FROM "Prazo";
DROP TABLE "Prazo";
ALTER TABLE "new_Prazo" RENAME TO "Prazo";
CREATE TABLE "new_Publicacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroProcessoIdentificado" TEXT,
    "processoId" TEXT,
    "dataPublicacao" DATETIME NOT NULL,
    "tribunalOrgao" TEXT NOT NULL,
    "textoPublicacao" TEXT NOT NULL,
    "statusVinculo" TEXT NOT NULL DEFAULT 'ORFA',
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "idExternoDjen" TEXT NOT NULL,
    "prazoADefinir" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Publicacao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Publicacao" ("criadoEm", "dataPublicacao", "id", "idExternoDjen", "lida", "numeroProcessoIdentificado", "processoId", "statusVinculo", "textoPublicacao", "tribunalOrgao") SELECT "criadoEm", "dataPublicacao", "id", "idExternoDjen", "lida", "numeroProcessoIdentificado", "processoId", "statusVinculo", "textoPublicacao", "tribunalOrgao" FROM "Publicacao";
DROP TABLE "Publicacao";
ALTER TABLE "new_Publicacao" RENAME TO "Publicacao";
CREATE UNIQUE INDEX "Publicacao_idExternoDjen_key" ON "Publicacao"("idExternoDjen");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
