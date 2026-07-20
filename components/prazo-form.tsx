"use client";

import { useMemo, useState } from "react";
import type { Processo, Prazo } from "@/app/generated/prisma/client";
import { calcularDataFinal, type TipoContagem } from "@/lib/prazos";
import {
  formatarData,
  formatarDataHorario,
  LABEL_MODALIDADE_AUDIENCIA,
} from "@/lib/formatacao";
import { classeInput, classeLabel, classeBotaoPrimario } from "@/lib/estilos";

type TipoPrazo =
  | "PETICAO"
  | "RECURSO"
  | "AUDIENCIA"
  | "MANIFESTACAO"
  | "OUTRO";

function paraInputDate(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(0, 10);
}

function paraInputHora(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toISOString().slice(11, 16);
}

export function PrazoForm({
  prazo,
  processos,
  processoIdPadrao,
  action,
}: {
  prazo?: Prazo;
  processos: Pick<Processo, "id" | "numeroProcesso">[];
  processoIdPadrao?: string;
  action: (formData: FormData) => void;
}) {
  const [tipo, setTipo] = useState<TipoPrazo>(
    (prazo?.tipo as TipoPrazo) ?? "PETICAO"
  );
  const ehAudiencia = tipo === "AUDIENCIA";

  const [dataBase, setDataBase] = useState(
    prazo?.dataBase ? paraInputDate(prazo.dataBase) : ""
  );
  const [dias, setDias] = useState(prazo?.dias?.toString() ?? "");
  const [contagem, setContagem] = useState<TipoContagem>(
    (prazo?.contagem as TipoContagem) ?? "DIAS_UTEIS"
  );

  const [dataAudiencia, setDataAudiencia] = useState(
    prazo?.tipo === "AUDIENCIA" ? paraInputDate(prazo.dataFinal) : ""
  );
  const [horaAudiencia, setHoraAudiencia] = useState(
    prazo?.tipo === "AUDIENCIA" ? paraInputHora(prazo.dataFinal) : ""
  );
  const [modalidadeAudiencia, setModalidadeAudiencia] = useState(
    prazo?.modalidadeAudiencia ?? ""
  );
  const precisaDeLink = modalidadeAudiencia === "VIRTUAL" || modalidadeAudiencia === "HIBRIDA";

  const dataFinal = useMemo(() => {
    const diasNumero = Number(dias);
    if (!dataBase || !diasNumero || diasNumero <= 0) {
      return null;
    }
    const [ano, mes, dia] = dataBase.split("-").map(Number);
    const base = new Date(Date.UTC(ano, mes - 1, dia));
    return calcularDataFinal(base, diasNumero, contagem);
  }, [dataBase, dias, contagem]);

  const dataHoraAudiencia = useMemo(() => {
    if (!dataAudiencia || !horaAudiencia) return null;
    const [ano, mes, dia] = dataAudiencia.split("-").map(Number);
    const [hora, minuto] = horaAudiencia.split(":").map(Number);
    return new Date(Date.UTC(ano, mes - 1, dia, hora, minuto));
  }, [dataAudiencia, horaAudiencia]);

  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className={classeLabel} htmlFor="processoId">
          Processo
        </label>
        <select
          id="processoId"
          name="processoId"
          required
          defaultValue={prazo?.processoId ?? processoIdPadrao ?? ""}
          className={classeInput}
        >
          <option value="" disabled>
            Selecione um processo
          </option>
          {processos.map((processo) => (
            <option key={processo.id} value={processo.id}>
              {processo.numeroProcesso ?? `Processo ${processo.id.slice(0, 8)}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={classeLabel} htmlFor="tipo">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoPrazo)}
          className={classeInput}
        >
          <option value="PETICAO">Petição</option>
          <option value="RECURSO">Recurso</option>
          <option value="AUDIENCIA">Audiência</option>
          <option value="MANIFESTACAO">Manifestação</option>
          <option value="OUTRO">Outro</option>
        </select>
      </div>

      {ehAudiencia ? (
        <>
          <div className="rounded-md border border-audiencia/30 bg-audiencia/10 px-3 py-2 text-sm text-audiencia">
            Audiência não tem contagem em dias — informe diretamente a data e
            o horário marcados.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={classeLabel} htmlFor="dataAudiencia">
                Data da audiência
              </label>
              <input
                id="dataAudiencia"
                name="dataAudiencia"
                type="date"
                required
                value={dataAudiencia}
                onChange={(e) => setDataAudiencia(e.target.value)}
                className={classeInput}
              />
            </div>
            <div>
              <label className={classeLabel} htmlFor="horaAudiencia">
                Horário
              </label>
              <input
                id="horaAudiencia"
                name="horaAudiencia"
                type="time"
                required
                value={horaAudiencia}
                onChange={(e) => setHoraAudiencia(e.target.value)}
                className={classeInput}
              />
            </div>
          </div>

          <div className="rounded-md bg-fundo border border-slate-200 px-3 py-2 text-sm">
            <span className="text-texto-secundario">Audiência marcada para: </span>
            <span className="font-semibold tabular-nums">
              {dataHoraAudiencia ? formatarDataHorario(dataHoraAudiencia) : "—"}
            </span>
          </div>

          <div>
            <label className={classeLabel} htmlFor="modalidadeAudiencia">
              Modalidade
            </label>
            <select
              id="modalidadeAudiencia"
              name="modalidadeAudiencia"
              required
              value={modalidadeAudiencia}
              onChange={(e) => setModalidadeAudiencia(e.target.value)}
              className={classeInput}
            >
              <option value="" disabled>
                Selecione a modalidade
              </option>
              <option value="VIRTUAL">{LABEL_MODALIDADE_AUDIENCIA.VIRTUAL}</option>
              <option value="HIBRIDA">{LABEL_MODALIDADE_AUDIENCIA.HIBRIDA}</option>
              <option value="PRESENCIAL">{LABEL_MODALIDADE_AUDIENCIA.PRESENCIAL}</option>
            </select>
          </div>

          {precisaDeLink && (
            <>
              <div>
                <label className={classeLabel} htmlFor="linkAudiencia">
                  Link da audiência
                </label>
                <input
                  id="linkAudiencia"
                  name="linkAudiencia"
                  type="url"
                  defaultValue={prazo?.linkAudiencia ?? ""}
                  placeholder="https://..."
                  className={classeInput}
                />
              </div>
              <div>
                <label className={classeLabel} htmlFor="contatoVaraAudiencia">
                  Contato da vara para solicitar o link
                </label>
                <input
                  id="contatoVaraAudiencia"
                  name="contatoVaraAudiencia"
                  defaultValue={prazo?.contatoVaraAudiencia ?? ""}
                  placeholder="Telefone ou email — preencher caso o link ainda não tenha sido fornecido"
                  className={classeInput}
                />
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={classeLabel} htmlFor="dataBase">
                Data base
              </label>
              <input
                id="dataBase"
                name="dataBase"
                type="date"
                required
                value={dataBase}
                onChange={(e) => setDataBase(e.target.value)}
                className={classeInput}
              />
            </div>
            <div>
              <label className={classeLabel} htmlFor="dias">
                Dias
              </label>
              <input
                id="dias"
                name="dias"
                type="number"
                min={1}
                required
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                className={classeInput}
              />
            </div>
          </div>

          <div>
            <label className={classeLabel} htmlFor="contagem">
              Tipo de contagem
            </label>
            <select
              id="contagem"
              name="contagem"
              value={contagem}
              onChange={(e) => setContagem(e.target.value as TipoContagem)}
              className={classeInput}
            >
              <option value="DIAS_UTEIS">Dias úteis</option>
              <option value="DIAS_CORRIDOS">Dias corridos</option>
            </select>
          </div>

          <div className="rounded-md bg-fundo border border-slate-200 px-3 py-2 text-sm">
            <span className="text-texto-secundario">Data final calculada: </span>
            <span className="font-semibold tabular-nums">
              {dataFinal ? formatarData(dataFinal) : "—"}
            </span>
          </div>
        </>
      )}

      {prazo && (
        <div>
          <label className={classeLabel} htmlFor="status">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={prazo.status}
            className={classeInput}
          >
            <option value="PENDENTE">Pendente</option>
            <option value="CUMPRIDO">Cumprido</option>
            <option value="PERDIDO">Perdido</option>
          </select>
        </div>
      )}

      <div>
        <label className={classeLabel} htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          defaultValue={prazo?.observacoes ?? ""}
          rows={3}
          className={classeInput}
        />
      </div>

      <button
        type="submit"
        className={classeBotaoPrimario}
      >
        Salvar
      </button>
    </form>
  );
}
