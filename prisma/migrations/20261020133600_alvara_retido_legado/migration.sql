-- Alvarás cadastrados antes do detalhamento: o valor retido (um número só)
-- passa a constar como honorários contratuais, mantendo os totais.
UPDATE "Alvara"
SET "honorariosContratuais" = "valorRetido"
WHERE "honorariosContratuais" = 0
  AND "honorariosSucumbencia" = 0
  AND "reembolsoDespesas" = 0
  AND "valorRetido" > 0;
