#!/usr/bin/env node
import "dotenv/config";
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { ZipArchive } = require("archiver");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

const DB_PATH = path.join(PROJECT_ROOT, "dev.db");
const ANEXOS_DIR = path.join(PROJECT_ROOT, "storage", "anexos");
const LOCAL_BACKUP_DIR = process.env.BACKUP_LOCAL_DIR
  ? path.resolve(process.env.BACKUP_LOCAL_DIR)
  : path.join(PROJECT_ROOT, "backups");
const ONEDRIVE_DIR = process.env.BACKUP_ONEDRIVE_DIR
  ? path.resolve(process.env.BACKUP_ONEDRIVE_DIR)
  : null;
const RETENCAO_DIAS = Number(process.env.BACKUP_RETENCAO_DIAS ?? 30);

function timestamp() {
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}_${pad(agora.getHours())}${pad(agora.getMinutes())}`;
}

function criarZip(destino) {
  return new Promise((resolve, reject) => {
    const saida = createWriteStream(destino);
    const arquivo = new ZipArchive({ zlib: { level: 9 } });

    saida.on("close", resolve);
    arquivo.on("error", reject);
    arquivo.pipe(saida);

    if (existsSync(DB_PATH)) {
      arquivo.file(DB_PATH, { name: "dev.db" });
    } else {
      console.warn(`Aviso: banco de dados não encontrado em ${DB_PATH} — backup seguirá sem ele.`);
    }

    if (existsSync(ANEXOS_DIR)) {
      arquivo.directory(ANEXOS_DIR, "anexos");
    }

    arquivo.finalize();
  });
}

/** Remove backups com mais de RETENCAO_DIAS dias, mantendo a pasta enxuta. */
function removerBackupsAntigos(diretorio) {
  if (!existsSync(diretorio)) return;
  const limite = Date.now() - RETENCAO_DIAS * 24 * 60 * 60 * 1000;
  for (const nome of readdirSync(diretorio)) {
    if (!nome.startsWith("pastana-mota-backup-") || !nome.endsWith(".zip")) continue;
    const caminho = path.join(diretorio, nome);
    if (statSync(caminho).mtimeMs < limite) {
      unlinkSync(caminho);
      console.log(`Backup antigo removido: ${nome}`);
    }
  }
}

async function main() {
  mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
  const nomeArquivo = `pastana-mota-backup-${timestamp()}.zip`;
  const caminhoLocal = path.join(LOCAL_BACKUP_DIR, nomeArquivo);

  console.log("Gerando backup do banco de dados e dos anexos...");
  await criarZip(caminhoLocal);
  console.log(`Backup local criado em: ${caminhoLocal}`);

  if (ONEDRIVE_DIR) {
    mkdirSync(ONEDRIVE_DIR, { recursive: true });
    const caminhoOneDrive = path.join(ONEDRIVE_DIR, nomeArquivo);
    copyFileSync(caminhoLocal, caminhoOneDrive);
    console.log(`Backup copiado para a pasta sincronizada do OneDrive: ${caminhoOneDrive}`);
    console.log("O aplicativo do OneDrive cuida do envio para a nuvem a partir daqui.");
  } else {
    console.warn(
      "BACKUP_ONEDRIVE_DIR não configurado no .env — o backup ficou só local, sem cópia na nuvem. " +
        "Defina essa variável apontando para uma pasta sincronizada pelo OneDrive para ativar o backup em nuvem."
    );
  }

  removerBackupsAntigos(LOCAL_BACKUP_DIR);
  if (ONEDRIVE_DIR) removerBackupsAntigos(ONEDRIVE_DIR);

  console.log("Backup concluído.");
}

main().catch((erro) => {
  console.error("Falha ao gerar backup:", erro);
  process.exit(1);
});
