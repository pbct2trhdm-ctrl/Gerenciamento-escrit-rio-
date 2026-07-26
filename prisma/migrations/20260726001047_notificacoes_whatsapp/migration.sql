-- AlterTable
ALTER TABLE "Prazo" ADD COLUMN "diasAntecedenciaNotificacao" INTEGER;

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prazoId" TEXT NOT NULL,
    "dataEnvio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "mensagemEnviada" TEXT NOT NULL,
    CONSTRAINT "Notificacao_prazoId_fkey" FOREIGN KEY ("prazoId") REFERENCES "Prazo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfiguracaoNotificacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "numeroWhatsapp" TEXT,
    "antecedenciaPadraoDias" INTEGER NOT NULL DEFAULT 3,
    "horarioDisparo" TEXT NOT NULL DEFAULT '08:00',
    "provedor" TEXT,
    "urlBaseApi" TEXT,
    "instanciaId" TEXT,
    "credencialApi" TEXT,
    "atualizadoEm" DATETIME NOT NULL
);
