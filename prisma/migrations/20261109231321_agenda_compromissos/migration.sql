-- AlterTable
ALTER TABLE "ConfiguracaoNotificacao" ADD COLUMN "agendaEnviadaEm" DATETIME;

-- CreateTable
CREATE TABLE "Compromisso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "inicio" DATETIME NOT NULL,
    "fim" DATETIME,
    "local" TEXT,
    "link" TEXT,
    "clienteId" TEXT,
    "processoId" TEXT,
    "observacoes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Compromisso_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Compromisso_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "Processo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Compromisso_inicio_idx" ON "Compromisso"("inicio");
