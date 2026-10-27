"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DoorOpen,
  LockKeyhole,
  UserRound,
  ShieldCheck,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";

const API = "http://localhost:3000";

async function lerResposta(resposta) {
  const texto = await resposta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch {
    return { mensagem: texto };
  }
}

export default function Login() {
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  // Se já estiver autenticado, vai para a Visão Geral.
  useEffect(() => {
    let ativo = true;

    async function verificarSessao() {
      try {
        const resposta = await fetch(`${API}/auth/sessao`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const resultado = await lerResposta(resposta);

        const conta =
          resultado?.usuario ??
          resultado?.user ??
          resultado?.conta ??
          resultado?.sessao?.user ??
          resultado?.dados?.usuario ??
          resultado?.data?.usuario ??
          resultado?.data?.user ??
          (resultado &&
          typeof resultado === "object" &&
          [
            "id_usuario",
            "id",
            "login",
            "nome",
            "email",
            "username",
            "name",
          ].some((campo) => resultado[campo] != null)
            ? resultado
            : null);

        if (ativo && resposta.ok && conta) {
          router.replace("/");
        }
      } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);
      } finally {
        if (ativo) {
          setVerificandoSessao(false);
        }
      }
    }

    verificarSessao();

    return () => {
      ativo = false;
    };
  }, [router]);

  async function entrar(evento) {
    evento.preventDefault();

    if (carregando) {
      return;
    }

    setErro("");

    const loginLimpo = login.trim();

    if (!loginLimpo || !senha) {
      setErro("Preencha o login e a senha.");
      return;
    }

    setCarregando(true);

    try {
      // Solicita o token CSRF à API.
      const respostaToken = await fetch(`${API}/csrf-token`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const dadosToken = await lerResposta(respostaToken);

      if (
        !respostaToken.ok ||
        typeof dadosToken.csrfToken !== "string" ||
        !dadosToken.csrfToken
      ) {
        throw new Error(
          "Não foi possível iniciar a autenticação. Tente novamente."
        );
      }

      // Envia login e senha para o backend.
      const resposta = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": dadosToken.csrfToken,
        },
        body: JSON.stringify({
          login: loginLimpo,
          senha,
        }),
      });

      const resultado = await lerResposta(resposta);

      if (!resposta.ok) {
        if (resposta.status === 401) {
          throw new Error("Login ou senha incorretos.");
        }

        if (resposta.status === 403) {
          throw new Error(
            "A autenticação foi recusada. Atualize a página e tente novamente."
          );
        }

        if (resposta.status === 429) {
          throw new Error(
            "Muitas tentativas de login. Aguarde um pouco e tente novamente."
          );
        }

        throw new Error(
          resultado.mensagem ||
            `Não foi possível entrar. Erro HTTP ${resposta.status}.`
        );
      }

      // A API deve salvar a sessão antes de confirmar o login.
      setSenha("");
      router.replace("/");
      router.refresh();
    } catch (erroLogin) {
      console.error("Erro na autenticação:", erroLogin);

      if (erroLogin instanceof TypeError) {
        setErro(
          "Não foi possível conectar à API. Confira se ela está ligada na porta 3000."
        );
      } else {
        setErro(
          erroLogin.message || "Ocorreu um erro ao realizar o login."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  // Evita mostrar o formulário durante a verificação inicial.
  if (verificandoSessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
        <div className="flex items-center gap-2">
          <LoaderCircle size={20} className="animate-spin" />
          Verificando sessão...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 text-gray-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
            <DoorOpen size={32} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Reserva de Salas
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Entre na sua conta para continuar
          </p>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold">Fazer login</h2>

            <p className="mt-1 text-sm text-gray-500">
              Informe seus dados de acesso.
            </p>
          </div>

          {erro && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {erro}
            </div>
          )}

          <form onSubmit={entrar} className="space-y-5">
            <div>
              <label
                htmlFor="login"
                className="mb-2 block text-sm font-medium"
              >
                Login
              </label>

              <div className="relative">
                <UserRound
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="login"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={50}
                  required
                  disabled={carregando}
                  value={login}
                  onChange={(evento) => setLogin(evento.target.value)}
                  placeholder="Digite seu login"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-medium"
              >
                Senha
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="senha"
                  name="password"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={200}
                  required
                  disabled={carregando}
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-12 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100 disabled:bg-gray-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setMostrarSenha((anterior) => !anterior)
                  }
                  disabled={carregando}
                  aria-label={
                    mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-black disabled:opacity-50"
                >
                  {mostrarSenha ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Verificando...
                </>
              ) : (
                "Entrar na conta"
              )}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
            <ShieldCheck
              size={20}
              className="mt-0.5 shrink-0 text-gray-600"
            />

            <p className="text-xs leading-5 text-gray-600">
              Sua autenticação é validada pelo servidor. A senha
              não é armazenada no navegador, e o acesso depende
              da sessão criada pela API.
            </p>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-gray-500">
          Sistema de gerenciamento de reservas
        </p>
      </div>
    </main>
  );
}