"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { API, lerResposta, obterTokenCsrf } from "./api";

const endpoints = {
  usuarios: "/usuarios",
  laboratorios: "/laboratorios",
  salas: "/salas",
  status: "/status",
};

const nomes = {
  usuarios: "usuários",
  laboratorios: "laboratórios",
  salas: "salas",
  status: "status",
};

const traducoes = {
  id_usuario: "ID do usuário",
  id_laboratorio: "ID do laboratório",
  id_sala: "ID da sala",
  id_status: "ID do status",
  data_nascimento: "Nascimento",
  localizacao: "Localização",
};

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

function nomeColuna(coluna) {
  if (
    ["senha", "password", "senha_hash"].includes(
      coluna.toLowerCase()
    )
  ) {
    return "Senha";
  }

  return (
    traducoes[coluna] ||
    coluna
      .replaceAll("_", " ")
      .replace(/^./, (letra) => letra.toUpperCase())
  );
}

function obterId(item, tipo) {
  if (tipo === "usuarios") return item.id_usuario;
  if (tipo === "salas") return item.id_sala;
  if (tipo === "laboratorios") return item.id_laboratorio;
  if (tipo === "status") return item.id_status;

  return null;
}

export default function CrudPage({
  tipo,
  titulo,
  campos = [],
  permitirCadastro = true,
  permitirExclusao = true,
}) {
  const router = useRouter();

  const [dados, setDados] = useState([]);
  const [formulario, setFormulario] = useState({});
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const endpoint = endpoints[tipo];

  async function carregar(opcoes = {}) {
    setCarregando(true);

    if (!opcoes.manterMensagem) {
      setMensagem("");
    }

    try {
      const resposta = await fetch(`${API}${endpoint}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const resultado = await lerResposta(resposta);

      if (resposta.status === 401 || resposta.status === 403) {
        router.replace("/login");
        return;
      }

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            `Erro ao carregar ${nomes[tipo]}.`
        );
      }

      if (!Array.isArray(resultado)) {
        throw new Error(
          resultado.mensagem ||
            "A API retornou dados inválidos."
        );
      }

      setDados(resultado);
    } catch (erro) {
      console.error(`Erro ao carregar ${tipo}:`, erro);

      setMensagem(
        erro.message || "Não foi possível carregar os dados."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();

    // Carrega os registros ao abrir a página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const filtrados = useMemo(
    () =>
      dados.filter((item) =>
        Object.entries(item).some(
          ([coluna, valor]) =>
            !["senha", "password", "senha_hash"].includes(
              coluna.toLowerCase()
            ) &&
            String(valor ?? "")
              .toLowerCase()
              .includes(busca.toLowerCase())
        )
      ),
    [dados, busca]
  );

  async function cadastrar(evento) {
    evento.preventDefault();
    setMensagem("");

    try {
      const token = await obterTokenCsrf();

      const resposta = await fetch(`${API}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token,
        },
        body: JSON.stringify(formulario),
      });

      const resultado = await lerResposta(resposta);

      if (resposta.status === 401 || resposta.status === 403) {
        router.replace("/login");
        return;
      }

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            "Erro ao cadastrar. Confira os dados."
        );
      }

      setFormulario({});
      setMensagem(
        resultado.mensagem || "Cadastro realizado com sucesso!"
      );

      await carregar({ manterMensagem: true });
    } catch (erro) {
      setMensagem(erro.message || "Erro ao cadastrar.");
    }
  }

  async function excluir(id) {
    if (!id) {
      setMensagem(
        "Não foi possível identificar o registro para excluir."
      );
      return;
    }

    if (
      !window.confirm(
        `Tem certeza que deseja excluir este registro de ${nomes[tipo]}?`
      )
    ) {
      return;
    }

    setMensagem("");

    try {
      const token = await obterTokenCsrf();

      const resposta = await fetch(`${API}${endpoint}/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "x-csrf-token": token,
        },
      });

      const resultado = await lerResposta(resposta);

      if (resposta.status === 401 || resposta.status === 403) {
        router.replace("/login");
        return;
      }

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível excluir o registro."
        );
      }

      setMensagem(
        resultado.mensagem || "Registro excluído com sucesso!"
      );

      await carregar({ manterMensagem: true });
    } catch (erro) {
      setMensagem(erro.message || "Erro ao excluir o registro.");
    }
  }

  return (
    <>
      {permitirCadastro && campos.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-gray-100 p-3">
              <Plus size={21} />
            </div>

            <div>
              <h3 className="font-bold">
                Cadastrar{" "}
                {tipo === "usuarios"
                  ? "usuário"
                  : tipo === "salas"
                    ? "sala"
                    : "laboratório"}
              </h3>

              <p className="text-sm text-gray-500">
                Preencha os campos abaixo.
              </p>
            </div>
          </div>

          <form onSubmit={cadastrar}>
            <div className="grid gap-5 sm:grid-cols-2">
              {campos.map((campo) => (
                <label
                  key={campo.nome}
                  className="block text-sm font-medium"
                >
                  {campo.rotulo}

                  <input
                    required
                    type={campo.tipo}
                    min={
                      campo.tipo === "number" ? "1" : undefined
                    }
                    value={formulario[campo.nome] || ""}
                    onChange={(evento) =>
                      setFormulario((anterior) => ({
                        ...anterior,
                        [campo.nome]: evento.target.value,
                      }))
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
              Cadastrar
            </button>
          </form>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold">
              Lista de {nomes[tipo]}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {dados.length} registro(s) encontrado(s)
            </p>
          </div>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Pesquisar..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-black sm:w-64"
            />
          </div>
        </div>

        {mensagem && (
          <p className="border-b border-gray-100 px-5 py-3 text-sm">
            {mensagem}
          </p>
        )}

        {carregando ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Carregando...
          </p>
        ) : filtrados.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Nenhum registro encontrado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {Object.keys(filtrados[0])
                    .filter(
                      (coluna) =>
                        ![
                          "senha",
                          "password",
                          "senha_hash",
                        ].includes(coluna.toLowerCase())
                    )
                    .map((coluna) => (
                      <th
                        key={coluna}
                        className="whitespace-nowrap px-5 py-4 font-semibold"
                      >
                        {nomeColuna(coluna)}
                      </th>
                    ))}

                  {permitirExclusao && (
                    <th className="whitespace-nowrap px-5 py-4 font-semibold">
                      Ações
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filtrados.map((item, indice) => {
                  const id = obterId(item, tipo);

                  return (
                    <tr
                      key={id ?? indice}
                      className="hover:bg-gray-50"
                    >
                      {Object.entries(item)
                        .filter(
                          ([coluna]) =>
                            ![
                              "senha",
                              "password",
                              "senha_hash",
                            ].includes(coluna.toLowerCase())
                        )
                        .map(([coluna, valor]) => (
                          <td
                            key={coluna}
                            className="whitespace-nowrap px-5 py-4"
                          >
                            {valor == null
                              ? "—"
                              : coluna.includes("data_")
                                ? formatarData(valor)
                                : String(valor)}
                          </td>
                        ))}

                      {permitirExclusao && (
                        <td className="whitespace-nowrap px-5 py-4">
                          <button
                            type="button"
                            onClick={() => excluir(id)}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Excluir
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}