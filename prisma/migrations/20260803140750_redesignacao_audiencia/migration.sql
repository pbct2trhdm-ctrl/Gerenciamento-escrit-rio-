-- CreateTable
CREATE TABLE "Redesignacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prazoId" TEXT NOT NULL,
    "dataAnterior" DATETIME NOT NULL,
    "dataNova" DATETIME NOT NULL,
    "motivo" TEXT NOT NULL,
    "dataRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Redesignacao_prazoId_fkey" FOREIGN KEY ("prazoId") REFERENCES "Prazo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
