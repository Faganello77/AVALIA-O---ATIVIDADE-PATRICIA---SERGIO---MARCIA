"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  FlaskConical,
  DoorOpen,
  ClipboardList,
  CalendarDays,
} from "lucide-react";
import PainelLayout from "./components/PainelLayout";
import { API, lerResposta } from "./components/api";

const secoes = [
  {
    id: "usuarios",
    nome: "Usuários",
    href: "/usuarios",
    Icone: Users,
  },
  {
    id: "laboratorios",
    nome: "Laboratórios",
    href: "/laboratorios",
    Icone: FlaskConical,
  },
  {
    id: "salas",
    nome: "Salas",
    href: "/salas",
    Icone: DoorOpen,
  },
  {
    id: "status",
    nome: "Status",
    href: "/status",
    Icone: ClipboardList,
  },
  {
    id: "reservas",
    nome: "Reservas",
    href: "/reservas",
    Icone: CalendarDays,
  },
];

export default function Home() {
  return (
    <PainelLayout>
      <VisaoGeral />
    </PainelLayout>
  );
}

function VisaoGeral() {
  const router = useRouter();

  const [quantidades, setQuantidades] = useState({
    usuarios: 0,
    laboratorios: 0,
    salas: 0,
    status: 0,
    reservas: 0,
  });

  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarResumo() {
      setCarregando(true);
      setMensagem("");

      const novasQuantidades = {};

      try {
        for (const secao of secoes) {
          const resposta = await fetch(`${API}/${secao.id}`, {
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
                `Erro ao carregar ${secao.nome.toLowerCase()}.`
            );
          }

          if (!Array.isArray(resultado)) {
            throw new Error(
              resultado.mensagem ||
                `A API retornou dados inválidos para ${secao.nome.toLowerCase()}.`
            );
          }

          novasQuantidades[secao.id] = resultado.length;
        }

        if (ativo) {
          setQuantidades((anterior) => ({
            ...anterior,
            ...novasQuantidades,
          }));
        }
      } catch (erro) {
        console.error("Erro ao carregar a Visão Geral:", erro);

        if (ativo) {
          setMensagem(
            erro.message ||
              "Não foi possível carregar o resumo."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarResumo();

    return () => {
      ativo = false;
    };
  }, [router]);

  return (
    <>
      <div>
        <h3 className="text-2xl font-bold">Visão geral</h3>

        <p className="mt-1 text-gray-500">
          Gerencie os cadastros e consulte as informações do sistema.
        </p>
      </div>

      {mensagem && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {mensagem}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {secoes.map(({ id, nome, href, Icone }) => (
          <Link
            key={id}
            href={href}
            className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="mb-5 inline-flex rounded-xl bg-gray-100 p-3">
              <Icone size={22} />
            </div>

            <p className="text-sm text-gray-500">{nome}</p>

            <p className="mt-1 text-3xl font-bold">
              {carregando ? "—" : quantidades[id]}
            </p>

            <p className="mt-3 text-xs text-gray-500">
              Ver informações →
            </p>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="font-bold">Acesso rápido</h3>

        <p className="mt-2 text-sm text-gray-500">
          Escolha uma opção no menu lateral para cadastrar ou consultar os dados.
        </p>
      </section>
    </>
  );
}