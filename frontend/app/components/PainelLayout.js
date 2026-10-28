"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import MenuLateral from "./MenuLateral";
import Cabecalho from "./Cabecalho";
import {
  API,
  lerResposta,
  extrairConta,
  obterTokenCsrf,
} from "./api";

const titulos = {
  "/": "Visão geral",
  "/usuarios": "Usuários",
  "/laboratorios": "Laboratórios",
  "/salas": "Salas",
  "/status": "Status",
  "/reservas": "Reservas",
};

export default function PainelLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [mensagemLayout, setMensagemLayout] = useState("");

  const nomeConta =
    usuarioLogado?.nome ||
    usuarioLogado?.login ||
    usuarioLogado?.username ||
    usuarioLogado?.usuario ||
    usuarioLogado?.email ||
    usuarioLogado?.name ||
    "";

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
        const conta = extrairConta(resultado);

        if (
          !resposta.ok ||
          !conta ||
          resultado?.autenticado === false ||
          resultado?.authenticated === false
        ) {
          if (ativo) {
            setUsuarioLogado(null);
            router.replace("/login");
          }

          return;
        }

        if (ativo) {
          setUsuarioLogado(conta);
        }
      } catch (erro) {
        console.error("Não foi possível verificar a sessão:", erro);

        if (ativo) {
          setUsuarioLogado(null);
          router.replace("/login");
        }
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

  async function sair() {
    if (saindo) return;

    setSaindo(true);
    setMensagemLayout("");

    try {
      const token = await obterTokenCsrf();

      const resposta = await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "x-csrf-token": token,
        },
      });

      const resultado = await lerResposta(resposta);

      if (!resposta.ok) {
        throw new Error(
          resultado.mensagem ||
            "Não foi possível encerrar a sessão."
        );
      }

      setUsuarioLogado(null);
      window.location.replace("/login");
    } catch (erro) {
      console.error("Erro ao sair:", erro);

      setMensagemLayout(
        erro.message || "Ocorreu um erro ao encerrar a sessão."
      );

      setSaindo(false);
    }
  }

  if (verificandoSessao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-600">
        Verificando sessão...
      </main>
    );
  }

  if (!usuarioLogado) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <MenuLateral
        menuAberto={menuAberto}
        setMenuAberto={setMenuAberto}
      />

      <main className="min-h-screen md:ml-64">
        <Cabecalho
          titulo={titulos[pathname] || "Reserva de Salas"}
          nomeConta={nomeConta}
          saindo={saindo}
          onSair={sair}
          menuAberto={menuAberto}
          setMenuAberto={setMenuAberto}
          mostrarAtualizar={pathname !== "/"}
        />

        <div className="space-y-6 p-5 md:p-8">
          {mensagemLayout && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {mensagemLayout}
            </p>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}