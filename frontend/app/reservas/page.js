"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, Search } from "lucide-react";
import PainelLayout from "../components/PainelLayout";
import {
  API,
  lerResposta,
  obterTokenCsrf,
} from "../components/api";

const tiposDados = [
  "usuarios",
  "laboratorios",
  "salas",
  "status",
  "reservas",
];

const nomes = {
  usuarios: "Usuários",
  laboratorios: "Laboratórios",
  salas: "Salas",
  status: "Status",
  reservas: "Reservas",
};

const traducoes = {
  id_reserva: "ID da reserva",
  id_usuario: "ID do usuário",
  id_laboratorio: "ID do laboratório",
  id_sala: "ID da sala",
  id_status: "ID do status",
  data_inicio: "Data de início",
  data_fim: "Data de término",
  hora_inicio: "Hora de início",
  hora_fim: "Hora de término",
  nome_usuario: "Usuário",
  nome_laboratorio: "Laboratório",
  nome_sala: "Sala",
};

function nomeColuna(coluna) {
  return (
    traducoes[coluna] ||
    coluna
      .replaceAll("_", " ")
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}

function formatarData(valor) {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return valor;
  }

  const [ano, mes, dia] = valor.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function ReservasPage() {
  return (
    <PainelLayout>
      <ConteudoReservas />
    </PainelLayout>
  );
}

function ConteudoReservas() {
  const router = useRouter();

  const [dados, setDados] = useState({
    usuarios: [],
    laboratorios: [],
    salas: [],
    status: [],
    reservas: [],
  });

  const [formulario, setFormulario] = useState({});
  const [tipoRecurso, setTipoRecurso] = useState("laboratorio");
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarTudo(opcoes = {}) {
    setCarregando(true);

    try {
      const novo = {};

      // Faz as consultas em sequência para evitar excesso de requisições.
      for (const tipo of tiposDados) {
        const resposta = await fetch(`${API}/${tipo}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const resultado = await lerResposta(resposta);

        if (
          resposta.status === 401 ||
          resposta.status === 403
        ) {
          router.replace("/login");
          return;
        }

        if (!resposta.ok) {
          throw new Error(
            resultado.mensagem ||
              `Erro ao carregar ${nomes[tipo].toLowerCase()}.`
          );
        }

        if (!Array.isArray(resultado)) {
          throw new Error(
            resultado.mensagem ||
              `Dados inválidos para ${nomes[tipo].toLowerCase()}.`
          );
        }

        novo[tipo] = resultado;
      }

      setDados(novo);

      if (!opcoes.manterMensagem) {
        setMensagem("");
      }
    } catch (erro) {
      console.error("Erro ao carregar reservas:", erro);

      setMensagem(
        erro.message || "Não foi possível carregar os dados."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTudo();

    // Carrega a listagem ao abrir a página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(
    () =>
      dados.reservas.filter((item) =>
        Object.values(item).some((valor) =>
          String(valor ?? "")
            .toLowerCase()
            .includes(busca.toLowerCase())
        )
      ),
    [dados.reservas, busca]
  );

  function atualizarCampo(nome, valor) {
    setFormulario((anterior) => ({
      ...anterior,
      [nome]: valor,
    }));
  }

  async function cadastrar(evento) {
    evento.preventDefault();
    setMensagem("");

    try {
      const token = await obterTokenCsrf();

      const resposta = await fetch(`${API}/reservas`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify(formulario),
      });

      const resultado = await lerResposta(resposta);

      if (
        resposta.status === 401 ||
        resposta.status === 403
      ) {
        router.replace("/login");
        return;
      }

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            "Erro ao cadastrar reserva. Confira os dados."
        );
      }

      setFormulario({});
      setMensagem(
        resultado.mensagem || "Reserva cadastrada com sucesso!"
      );

      await carregarTudo({ manterMensagem: true });
    } catch (erro) {
      setMensagem(
        erro.message || "Erro ao cadastrar reserva."
      );
    }
  }

  async function excluir(id) {
    if (!id) {
      setMensagem(
        "Não foi possível identificar a reserva para excluir."
      );
      return;
    }

    if (
      !window.confirm(
        "Tem certeza que deseja excluir esta reserva?"
      )
    ) {
      return;
    }

    try {
      const token = await obterTokenCsrf();

      const resposta = await fetch(`${API}/reservas/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-csrf-token": token,
        },
      });

      const resultado = await lerResposta(resposta);

      if (
        resposta.status === 401 ||
        resposta.status === 403
      ) {
        router.replace("/login");
        return;
      }

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível excluir a reserva."
        );
      }

      setMensagem(
        resultado.mensagem || "Reserva excluída com sucesso!"
      );

      await carregarTudo({ manterMensagem: true });
    } catch (erro) {
      setMensagem(
        erro.message || "Erro ao excluir reserva."
      );
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-gray-100 p-3">
            <CalendarDays size={21} />
          </div>

          <div>
            <h3 className="font-bold">Cadastrar reserva</h3>

            <p className="text-sm text-gray-500">
              Preencha as informações da reserva.
            </p>
          </div>
        </div>

        <form onSubmit={cadastrar}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Usuário

              <select
                required
                value={formulario.id_usuario || ""}
                onChange={(e) =>
                  atualizarCampo("id_usuario", e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
              >
                <option value="">Selecione um usuário</option>

                {dados.usuarios.map((usuario) => (
                  <option
                    key={usuario.id_usuario}
                    value={usuario.id_usuario}
                  >
                    {usuario.nome} (ID {usuario.id_usuario})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Status

              <select
                required
                value={formulario.id_status || ""}
                onChange={(e) =>
                  atualizarCampo("id_status", e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
              >
                <option value="">Selecione um status</option>

                {dados.status.map((status) => (
                  <option
                    key={status.id_status}
                    value={status.id_status}
                  >
                    {status.nome ||
                      status.descricao ||
                      `Status ${status.id_status}`}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Tipo de local

              <select
                required
                value={tipoRecurso}
                onChange={(e) => {
                  const novoTipo = e.target.value;

                  setTipoRecurso(novoTipo);

                  setFormulario((anterior) => ({
                    ...anterior,
                    id_laboratorio:
                      novoTipo === "laboratorio"
                        ? anterior.id_laboratorio || ""
                        : "",
                    id_sala:
                      novoTipo === "sala"
                        ? anterior.id_sala || ""
                        : "",
                  }));
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
              >
                <option value="laboratorio">Laboratório</option>
                <option value="sala">Sala de aula</option>
              </select>
            </label>

            {tipoRecurso === "laboratorio" ? (
              <label className="block text-sm font-medium">
                Laboratório

                <select
                  required
                  value={formulario.id_laboratorio || ""}
                  onChange={(e) => {
                    atualizarCampo("id_laboratorio", e.target.value);
                    atualizarCampo("id_sala", "");
                  }}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                >
                  <option value="">Selecione um laboratório</option>

                  {dados.laboratorios.map((lab) => (
                    <option
                      key={lab.id_laboratorio}
                      value={lab.id_laboratorio}
                    >
                      {lab.nome} (ID {lab.id_laboratorio})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block text-sm font-medium">
                Sala de aula

                <select
                  required
                  value={formulario.id_sala || ""}
                  onChange={(e) => {
                    atualizarCampo("id_sala", e.target.value);
                    atualizarCampo("id_laboratorio", "");
                  }}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                >
                  <option value="">Selecione uma sala</option>

                  {dados.salas.map((sala) => (
                    <option
                      key={sala.id_sala}
                      value={sala.id_sala}
                    >
                      {sala.nome} (ID {sala.id_sala})
                    </option>
                  ))}
                </select>
              </label>
            )}

            {[
              {
                nome: "data_inicio",
                rotulo: "Data de início",
                tipo: "date",
              },
              {
                nome: "data_fim",
                rotulo: "Data de término",
                tipo: "date",
              },
              {
                nome: "hora_inicio",
                rotulo: "Hora de início",
                tipo: "time",
              },
              {
                nome: "hora_fim",
                rotulo: "Hora de término",
                tipo: "time",
              },
            ].map((campo) => (
              <label
                key={campo.nome}
                className="block text-sm font-medium"
              >
                {campo.rotulo}

                <input
                  required
                  type={campo.tipo}
                  value={formulario[campo.nome] || ""}
                  onChange={(e) =>
                    atualizarCampo(campo.nome, e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="mt-6 flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
          >
            <Plus size={17} />
            Cadastrar reserva
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold">Lista de reservas</h3>

            <p className="mt-1 text-sm text-gray-500">
              {dados.reservas.length} registro(s) encontrado(s)
            </p>
          </div>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-black sm:w-64"
            />
          </div>
        </div>

        {mensagem && (
          <p
            role="status"
            className="border-b border-gray-100 px-5 py-3 text-sm"
          >
            {mensagem}
          </p>
        )}

        {carregando ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Carregando...
          </p>
        ) : filtrados.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Nenhuma reserva encontrada.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {Object.keys(filtrados[0]).map((coluna) => (
                    <th
                      key={coluna}
                      className="whitespace-nowrap px-5 py-4 font-semibold"
                    >
                      {nomeColuna(coluna)}
                    </th>
                  ))}

                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtrados.map((item, indice) => (
                  <tr
                    key={item.id_reserva ?? indice}
                    className="hover:bg-gray-50"
                  >
                    {Object.entries(item).map(([coluna, valor]) => (
                      <td
                        key={coluna}
                        className="whitespace-nowrap px-5 py-4"
                      >
                        {valor == null
                          ? "—"
                          : ["data_inicio", "data_fim"].includes(coluna)
                            ? formatarData(valor)
                            : String(valor)}
                      </td>
                    ))}

                    <td className="whitespace-nowrap px-5 py-4">
                      <button
                        type="button"
                        onClick={() => excluir(item.id_reserva)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}