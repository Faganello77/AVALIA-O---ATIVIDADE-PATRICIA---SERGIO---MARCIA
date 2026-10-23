"use client";

import { useEffect, useRef, useState } from "react";
import {
  Users,
  FlaskConical,
  DoorOpen,
  ClipboardList,
  LayoutDashboard,
  RefreshCw,
  Plus,
  Search,
  Menu,
  X,
  CalendarDays,
  LogOut,
} from "lucide-react";

const API = "http://localhost:3000";

// Lê respostas JSON ou texto sem gerar SyntaxError.
async function lerResposta(resposta) {
  const texto = await resposta.text();

  if (!texto) return {};

  try {
    return JSON.parse(texto);
  } catch {
    return { mensagem: texto };
  }
}

const secoes = [
  { id: "inicio", nome: "Visão geral", Icone: LayoutDashboard },
  { id: "usuarios", nome: "Usuários", Icone: Users },
  { id: "laboratorios", nome: "Laboratórios", Icone: FlaskConical },
  { id: "salas", nome: "Salas", Icone: DoorOpen },
  { id: "status", nome: "Status", Icone: ClipboardList },
  { id: "reservas", nome: "Reservas", Icone: CalendarDays },
];

const campos = {
  usuarios: [
    { nome: "cpf", rotulo: "CPF", tipo: "text" },
    { nome: "nome", rotulo: "Nome completo", tipo: "text" },
    { nome: "data_nascimento", rotulo: "Data de nascimento", tipo: "date" },
    { nome: "celular", rotulo: "Celular", tipo: "text" },
    { nome: "email", rotulo: "E-mail", tipo: "email" },
    { nome: "login", rotulo: "Login", tipo: "text" },
    { nome: "senha", rotulo: "Senha", tipo: "password" },
  ],

  laboratorios: [
    { nome: "codigo", rotulo: "Código", tipo: "text" },
    { nome: "nome", rotulo: "Nome do laboratório", tipo: "text" },
    { nome: "capacidade", rotulo: "Capacidade", tipo: "number" },
    { nome: "localizacao", rotulo: "Localização", tipo: "text" },
  ],

  salas: [
    { nome: "codigo", rotulo: "Código", tipo: "text" },
    { nome: "nome", rotulo: "Nome da sala", tipo: "text" },
    { nome: "capacidade", rotulo: "Capacidade", tipo: "number" },
    { nome: "localizacao", rotulo: "Localização", tipo: "text" },
  ],
};

const endpoints = {
  usuarios: "/usuarios",
  laboratorios: "/laboratorios",
  salas: "/salas",
  status: "/status",
  reservas: "/reservas",
};

const nomes = {
  usuarios: "Usuários",
  laboratorios: "Laboratórios",
  salas: "Salas",
  status: "Status",
  reservas: "Reservas",
};

export default function Home() {
  const [secao, setSecao] = useState("inicio");

  const [dados, setDados] = useState({
    usuarios: [],
    laboratorios: [],
    salas: [],
    status: [],
    reservas: [],
  });

  const [formulario, setFormulario] = useState({});
  const [busca, setBusca] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [tipoRecurso, setTipoRecurso] = useState("laboratorio");

  // Evita repetir uma mesma requisição enquanto ela está em andamento.
  const requisicoesAtivas = useRef(new Map());

  // Nome da conta conectada.
  const nomeConta =
    usuarioLogado?.nome ||
    usuarioLogado?.login ||
    usuarioLogado?.username ||
    usuarioLogado?.usuario ||
    usuarioLogado?.email ||
    usuarioLogado?.name ||
    "";

  // Carrega os registros de uma seção.
  async function carregarDados(tipo, opcoes = {}) {
    if (!endpoints[tipo]) return "erro";

    // Reutiliza uma chamada que já estiver em andamento.
    if (requisicoesAtivas.current.has(tipo)) {
      return requisicoesAtivas.current.get(tipo);
    }

    const requisicao = (async () => {
      setCarregando(true);

      if (opcoes.limparMensagem !== false) {
        setMensagem("");
      }

      try {
        const resposta = await fetch(`${API}${endpoints[tipo]}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        // A resposta pode ser JSON ou texto simples.
        const resultado = await lerResposta(resposta);

        if (!resposta.ok) {
          if (resposta.status === 429) {
            setMensagem(
              "A API recebeu muitas requisições. Aguarde um pouco antes de tentar novamente."
            );

            return "limite";
          }

          throw new Error(
            resultado.mensagem ||
              `Erro ao carregar ${nomes[tipo]}.`
          );
        }

        if (!Array.isArray(resultado)) {
          throw new Error(
            resultado.mensagem ||
              `A API retornou dados inválidos para ${nomes[tipo]}.`
          );
        }

        setDados((anterior) => ({
          ...anterior,
          [tipo]: resultado,
        }));

        return "ok";
      } catch (erro) {
        console.error(`Erro ao carregar ${tipo}:`, erro);

        setMensagem(
          erro.message ||
            "Não foi possível carregar os dados. Confira se a API está ligada."
        );

        return "erro";
      } finally {
        requisicoesAtivas.current.delete(tipo);
        setCarregando(false);
      }
    })();

    requisicoesAtivas.current.set(tipo, requisicao);

    return requisicao;
  }

  // Na Visão Geral, carrega um endpoint por vez.
  useEffect(() => {
    let ativo = true;

    async function carregarSecao() {
      setMensagem("");

      const tipos =
        secao === "inicio"
          ? [
              "usuarios",
              "laboratorios",
              "salas",
              "status",
              "reservas",
            ]
          : endpoints[secao]
            ? [secao]
            : [];

      for (const tipo of tipos) {
        if (!ativo) return;

        const resultado = await carregarDados(tipo, {
          limparMensagem: false,
        });

        // Ao receber HTTP 429, interrompe as chamadas seguintes.
        if (resultado === "limite") {
          return;
        }
      }
    }

    carregarSecao();

    return () => {
      ativo = false;
    };
  }, [secao]);

  // Busca a conta autenticada pela sessão do backend.
  useEffect(() => {
    let ativo = true;

    async function carregarUsuarioLogado() {
      try {
        const resposta = await fetch(`${API}/auth/sessao`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const resultado = await lerResposta(resposta);

        if (!resposta.ok) return;

        const conta =
          resultado.usuario ??
          resultado.user ??
          resultado.conta ??
          resultado.sessao?.user ??
          resultado.dados?.usuario ??
          resultado;

        if (ativo && conta && typeof conta === "object") {
          setUsuarioLogado(conta);
        }
      } catch (erro) {
        console.error(
          "Não foi possível carregar a conta:",
          erro
        );
      }
    }

    carregarUsuarioLogado();

    return () => {
      ativo = false;
    };
  }, []);

  // Encerra a sessão e retorna ao login.
  async function sair() {
    if (saindo) return;

    setSaindo(true);
    setMensagem("");

    try {
      const tokenResposta = await fetch(`${API}/csrf-token`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const token = await lerResposta(tokenResposta);

      if (!tokenResposta.ok || !token.csrfToken) {
        throw new Error(
          "Não foi possível validar a saída. Atualize a página e tente novamente."
        );
      }

      const resposta = await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "x-csrf-token": token.csrfToken,
        },
      });

      const resultado = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível encerrar a sessão. Confira a rota /auth/logout da API."
        );
      }

      window.location.replace("/login");
    } catch (erro) {
      console.error("Erro ao sair:", erro);

      setMensagem(
        erro.message ||
          "Ocorreu um erro ao encerrar a sessão."
      );

      setSaindo(false);
    }
  }

  // Cadastra usuários, laboratórios, salas ou reservas.
  async function cadastrar(evento) {
    evento.preventDefault();
    setMensagem("");

    try {
      const tokenResposta = await fetch(`${API}/csrf-token`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const token = await lerResposta(tokenResposta);

      if (!tokenResposta.ok || !token.csrfToken) {
        throw new Error(
          token.mensagem ||
            "Não foi possível obter o token de segurança."
        );
      }

      const resposta = await fetch(API + endpoints[secao], {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": token.csrfToken,
        },
        body: JSON.stringify(formulario),
      });

      const resultado = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            "Erro ao cadastrar. Confira os dados."
        );
      }

      setMensagem(
        resultado.mensagem ||
          "Cadastro realizado com sucesso!"
      );

      setFormulario({});
      evento.target.reset();

      await carregarDados(secao, {
        limparMensagem: false,
      });
    } catch (erro) {
      setMensagem(
        erro.message || "Erro ao cadastrar."
      );
    }
  }

  // Exclui um registro.
  async function excluir(tipo, id) {
    if (!id) {
      setMensagem(
        "Não foi possível identificar o registro para excluir."
      );

      return;
    }

    const confirmado = window.confirm(
      `Tem certeza que deseja excluir este registro de ${nomes[
        tipo
      ].toLowerCase()}?`
    );

    if (!confirmado) return;

    setMensagem("");

    try {
      const tokenResposta = await fetch(`${API}/csrf-token`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const token = await lerResposta(tokenResposta);

      if (!tokenResposta.ok || !token.csrfToken) {
        throw new Error(
          token.mensagem ||
            "Não foi possível obter o token de segurança."
        );
      }

      const resposta = await fetch(
        `${API}${endpoints[tipo]}/${id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "x-csrf-token": token.csrfToken,
          },
        }
      );

      const resultado = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível excluir o registro."
        );
      }

      await carregarDados(tipo, {
        limparMensagem: false,
      });

      setMensagem(
        resultado.mensagem ||
          "Registro excluído com sucesso!"
      );
    } catch (erro) {
      setMensagem(
        erro.message || "Erro ao excluir o registro."
      );
    }
  }

  // Troca de seção.
  function selecionar(id) {
    setSecao(id);
    setBusca("");
    setMensagem("");
    setFormulario({});
    setTipoRecurso("laboratorio");
    setMenuAberto(false);
  }

  const lista = dados[secao] || [];

  const filtrados = lista.filter((item) =>
    Object.values(item).some((valor) =>
      String(valor ?? "")
        .toLowerCase()
        .includes(busca.toLowerCase())
    )
  );

  // Traduz os nomes das colunas.
  function nomeColuna(coluna) {
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
      data_nascimento: "Nascimento",
      localizacao: "Localização",
      nome_usuario: "Usuário",
      nome_laboratorio: "Laboratório",
      nome_sala: "Sala",
    };

    return (
      traducoes[coluna] ||
      coluna
        .replaceAll("_", " ")
        .replace(/^./, (letra) => letra.toUpperCase())
    );
  }

  // Converte datas para o padrão brasileiro.
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

  // Identifica o ID de cada registro.
  function obterId(item, tipo) {
    if (tipo === "usuarios") return item.id_usuario;
    if (tipo === "salas") return item.id_sala;
    if (tipo === "laboratorios") return item.id_laboratorio;
    if (tipo === "reservas") return item.id_reserva;

    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* MENU LATERAL */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-white p-5 transition-transform md:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-black p-3 text-white">
              <DoorOpen size={23} />
            </div>

            <div>
              <h1 className="font-bold">Reserva de Salas</h1>

              <p className="text-xs text-gray-500">
                Painel administrativo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuAberto(false)}
            className="md:hidden"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Menu principal
        </p>

        <nav className="space-y-2">
          {secoes.map(({ id, nome, Icone }) => (
            <button
              type="button"
              key={id}
              onClick={() => selecionar(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${
                secao === id
                  ? "bg-gray-100 font-semibold text-black"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icone size={19} />
              {nome}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-gray-50 p-4">
          <p className="text-sm font-medium">
            Sistema de reservas
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Projeto acadêmico
          </p>
        </div>
      </aside>

      {/* FUNDO DO MENU NO CELULAR */}
      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="min-h-screen md:ml-64">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-sm text-gray-500">
                Sistema de gerenciamento
              </p>

              <h2 className="text-xl font-bold">
                {secoes.find((item) => item.id === secao)?.nome}
              </h2>
            </div>
          </div>

          {/* ATUALIZAR, CONTA E SAIR */}
          <div className="flex items-center gap-3">
            {endpoints[secao] && (
              <button
                type="button"
                onClick={() => carregarDados(secao)}
                disabled={saindo || carregando}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Atualizar
              </button>
            )}

            <div className="flex flex-col items-end gap-1">
              <div className="max-w-[180px] text-right leading-tight">
                <p className="text-[11px] text-gray-500">
                  Conta conectada
                </p>

                <p
                  className="truncate text-sm font-semibold"
                  title={nomeConta || "Conta conectada"}
                >
                  {nomeConta || "Carregando conta..."}
                </p>
              </div>

              <button
                type="button"
                onClick={sair}
                disabled={saindo}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut size={16} />
                {saindo ? "Saindo..." : "Sair"}
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 md:p-8">
          {/* VISÃO GERAL */}
          {secao === "inicio" ? (
            <>
              <div>
                <h3 className="text-2xl font-bold">
                  Bem-vindo
                  {nomeConta ? `, ${nomeConta}` : ""}!
                </h3>

                <p className="mt-1 text-gray-500">
                  Gerencie os cadastros e consulte as informações do sistema.
                </p>
              </div>

              {/* CARDS DA VISÃO GERAL */}
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { id: "usuarios", Icone: Users },
                  { id: "laboratorios", Icone: FlaskConical },
                  { id: "salas", Icone: DoorOpen },
                  { id: "status", Icone: ClipboardList },
                  { id: "reservas", Icone: CalendarDays },
                ].map(({ id, Icone }) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => selecionar(id)}
                    className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="mb-5 inline-flex rounded-xl bg-gray-100 p-3">
                      <Icone size={22} />
                    </div>

                    <p className="text-sm text-gray-500">
                      {nomes[id]}
                    </p>

                    <p className="mt-1 text-3xl font-bold">
                      {dados[id].length}
                    </p>

                    <p className="mt-3 text-xs text-gray-500">
                      Ver informações →
                    </p>
                  </button>
                ))}
              </div>

              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-bold">Acesso rápido</h3>

                <p className="mt-2 text-sm text-gray-500">
                  Escolha uma opção no menu lateral para cadastrar ou consultar
                  os dados.
                </p>
              </section>
            </>
          ) : (
            <>
              {/* FORMULÁRIO DE CADASTRO */}
              {campos[secao] && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-gray-100 p-3">
                      <Plus size={21} />
                    </div>

                    <div>
                      <h3 className="font-bold">
                        Cadastrar{" "}
                        {secao === "usuarios"
                          ? "usuário"
                          : secao === "salas"
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
                      {campos[secao].map((campo) => (
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

              {/* FORMULÁRIO DE RESERVAS */}
              {secao === "reservas" && (
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-gray-100 p-3">
                      <CalendarDays size={21} />
                    </div>

                    <div>
                      <h3 className="font-bold">
                        Cadastrar reserva
                      </h3>

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
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              id_usuario: evento.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                        >
                          <option value="">
                            Selecione um usuário
                          </option>

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
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              id_status: evento.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                        >
                          <option value="">
                            Selecione um status
                          </option>

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
                          onChange={(evento) => {
                            const novoTipo = evento.target.value;

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
                          <option value="laboratorio">
                            Laboratório
                          </option>

                          <option value="sala">
                            Sala de aula
                          </option>
                        </select>
                      </label>

                      {tipoRecurso === "laboratorio" ? (
                        <label className="block text-sm font-medium">
                          Laboratório

                          <select
                            required
                            value={formulario.id_laboratorio || ""}
                            onChange={(evento) =>
                              setFormulario((anterior) => ({
                                ...anterior,
                                id_laboratorio: evento.target.value,
                                id_sala: "",
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                          >
                            <option value="">
                              Selecione um laboratório
                            </option>

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
                            onChange={(evento) =>
                              setFormulario((anterior) => ({
                                ...anterior,
                                id_sala: evento.target.value,
                                id_laboratorio: "",
                              }))
                            }
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                          >
                            <option value="">
                              Selecione uma sala
                            </option>

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

                      <label className="block text-sm font-medium">
                        Data de início

                        <input
                          required
                          type="date"
                          value={formulario.data_inicio || ""}
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              data_inicio: evento.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                        />
                      </label>

                      <label className="block text-sm font-medium">
                        Data de término

                        <input
                          required
                          type="date"
                          value={formulario.data_fim || ""}
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              data_fim: evento.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                        />
                      </label>

                      <label className="block text-sm font-medium">
                        Hora de início

                        <input
                          required
                          type="time"
                          value={formulario.hora_inicio || ""}
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              hora_inicio: evento.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                        />
                      </label>

                      <label className="block text-sm font-medium">
                        Hora de término

                        <input
                          required
                          type="time"
                          value={formulario.hora_fim || ""}
                          onChange={(evento) =>
                            setFormulario((anterior) => ({
                              ...anterior,
                              hora_fim: evento.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-normal outline-none focus:border-black"
                        />
                      </label>
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
              )}

              {/* LISTAGEM DOS REGISTROS */}
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold">
                      Lista de {nomes[secao].toLowerCase()}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {lista.length} registro(s) encontrado(s)
                    </p>
                  </div>

                  <div className="relative">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      value={busca}
                      onChange={(evento) =>
                        setBusca(evento.target.value)
                      }
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
                          {Object.keys(filtrados[0]).map((coluna) => (
                            <th
                              key={coluna}
                              className="whitespace-nowrap px-5 py-4 font-semibold"
                            >
                              {nomeColuna(coluna)}
                            </th>
                          ))}

                          {[
                            "usuarios",
                            "salas",
                            "laboratorios",
                            "reservas",
                          ].includes(secao) && (
                            <th className="whitespace-nowrap px-5 py-4 font-semibold">
                              Ações
                            </th>
                          )}
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {filtrados.map((item, indice) => {
                          const id = obterId(item, secao);

                          return (
                            <tr
                              key={id ?? indice}
                              className="hover:bg-gray-50"
                            >
                              {Object.entries(item).map(([coluna, valor]) => (
                                <td
                                  key={coluna}
                                  className="whitespace-nowrap px-5 py-4"
                                >
                                  {valor == null
                                    ? "—"
                                    : [
                                        "data_inicio",
                                        "data_fim",
                                        "data_nascimento",
                                      ].includes(coluna)
                                      ? formatarData(valor)
                                      : String(valor)}
                                </td>
                              ))}

                              {[
                                "usuarios",
                                "salas",
                                "laboratorios",
                                "reservas",
                              ].includes(secao) && (
                                <td className="whitespace-nowrap px-5 py-4">
                                  <button
                                    type="button"
                                    onClick={() => excluir(secao, id)}
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
          )}

          {mensagem && secao === "inicio" && (
            <p className="text-sm text-gray-600">
              {mensagem}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}