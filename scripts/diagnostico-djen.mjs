#!/usr/bin/env node
/**
 * Diagnóstico da consulta ao DJEN (comunicaapi.pje.jus.br): faz a mesma
 * consulta do sistema para a OAB configurada (ou a informada) nos últimos
 * 7 dias e mostra a resposta crua — status, campos e as publicações
 * encontradas — para conferir se a integração está lendo o formato certo.
 *
 * Uso:
 *   npm run diagnostico-djen
 *   npm run diagnostico-djen -- 12345 PA          (OAB e UF manualmente)
 *   npm run diagnostico-djen -- processo NUMERO   (todas as comunicações do
 *                                                  processo, sem filtro de OAB)
 */
import "dotenv/config";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const argumentos = process.argv.slice(2);
const numeroProcesso = argumentos[0] === "processo" ? (argumentos[1] ?? "").replace(/\D/g, "") : null;
if (argumentos[0] === "processo" && !numeroProcesso) {
  console.log("Informe o número: npm run diagnostico-djen -- processo 0800000-00.2026.8.14.0301");
  process.exit(1);
}
let [oab, uf] = numeroProcesso ? [] : argumentos;
if (!numeroProcesso && (!oab || !uf)) {
  const Database = require("better-sqlite3");
  const db = new Database(path.join(raiz, "dev.db"), { readonly: true });
  const config = db
    .prepare("SELECT numeroOab, seccionalOab, ultimaExecucao, ultimoErro FROM ConfiguracaoPublicacoes WHERE id = 1")
    .get();
  if (!config?.numeroOab || !config?.seccionalOab) {
    console.log("OAB não configurada em Configurações → Publicações (DJEN).");
    console.log("Rode informando: npm run diagnostico-djen -- NUMERO UF");
    process.exit(1);
  }
  oab = config.numeroOab;
  uf = config.seccionalOab;
  console.log("Configuração salva no sistema:");
  console.log(`  OAB: "${config.numeroOab}"  UF: "${config.seccionalOab}"`);
  console.log(`  Última busca: ${config.ultimaExecucao ? new Date(config.ultimaExecucao).toLocaleString("pt-BR") : "nunca"}`);
  if (config.ultimoErro) console.log(`  Último erro: ${config.ultimoErro}`);
}

const fim = new Date();
fim.setDate(fim.getDate() + 1); // margem: inclui o dia de amanhã, caso a API trate o fim como exclusivo
const inicio = new Date();
inicio.setDate(inicio.getDate() - (numeroProcesso ? 30 : 7));
const iso = (d) => d.toISOString().slice(0, 10);

const params = new URLSearchParams({
  ...(numeroProcesso
    ? { numeroProcesso }
    : { numeroOab: oab.replace(/[.\s]/g, ""), ufOab: uf.toUpperCase() }),
  dataDisponibilizacaoInicio: iso(inicio),
  dataDisponibilizacaoFim: iso(fim),
  pagina: "1",
  itensPorPagina: "100",
});
const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${params}`;
console.log(`\nConsultando: ${url}\n`);

try {
  const resposta = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    },
  });
  const texto = await resposta.text();
  console.log(`HTTP ${resposta.status}`);

  let corpo;
  try {
    corpo = JSON.parse(texto);
  } catch {
    console.log("Resposta não é JSON. Início da resposta:\n" + texto.slice(0, 800));
    process.exit(1);
  }

  console.log(`Campos da resposta: ${Object.keys(corpo).join(", ")}`);
  if ("count" in corpo) console.log(`count: ${corpo.count}`);
  const itens = [corpo.items, corpo.data, corpo.content, corpo.comunicacoes].find(Array.isArray) ?? [];
  console.log(`Publicações na lista: ${itens.length}`);

  if (itens.length > 0) {
    console.log(`\nCampos de cada publicação: ${Object.keys(itens[0]).join(", ")}\n`);
    for (const item of itens.slice(0, 30)) {
      const data = item.data_disponibilizacao ?? item.dataDisponibilizacao ?? "?";
      const processo = item.numero_processo ?? item.numeroprocessocommascara ?? item.numeroProcesso ?? "?";
      const orgao = item.nomeOrgao ?? item.siglaTribunal ?? "?";
      const textoItem = String(item.texto ?? item.conteudo ?? "").replace(/\s+/g, " ").slice(0, 90);
      const advogados = Array.isArray(item.destinatarioadvogados)
        ? item.destinatarioadvogados
            .map((d) => {
              const adv = d.advogado ?? d;
              return `${adv.nome ?? "?"} (OAB ${adv.numero_oab ?? adv.numeroOab ?? "?"}/${adv.uf_oab ?? adv.ufOab ?? "?"})`;
            })
            .join("; ")
        : "—";
      console.log(`• ${data} | ${processo} | ${orgao} | ${item.tipoComunicacao ?? "?"} | meio ${item.meio ?? "?"}`);
      console.log(`    Advogados: ${advogados}`);
      console.log(`    ${textoItem}…`);
    }
  } else {
    console.log(`\nNenhuma publicação encontrada${numeroProcesso ? " para esse processo nos últimos 30 dias" : " nos últimos 7 dias para essa OAB/UF"}. Início da resposta:`);
    console.log(texto.slice(0, 800));
  }
} catch (erro) {
  console.log(`Falha de conexão com o DJEN: ${erro.message}${erro.cause ? ` (${erro.cause.code ?? erro.cause.message})` : ""}`);
  process.exit(1);
}
