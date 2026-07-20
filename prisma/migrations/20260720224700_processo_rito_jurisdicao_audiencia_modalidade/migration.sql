-- AlterTable
ALTER TABLE "Prazo" ADD COLUMN "contatoVaraAudiencia" TEXT;
ALTER TABLE "Prazo" ADD COLUMN "linkAudiencia" TEXT;
ALTER TABLE "Prazo" ADD COLUMN "modalidadeAudiencia" TEXT;

-- AlterTable
ALTER TABLE "Processo" ADD COLUMN "jurisdicao" TEXT;
ALTER TABLE "Processo" ADD COLUMN "rito" TEXT;
