"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FlaskConical,
  DoorOpen,
  ClipboardList,
  LayoutDashboard,
  CalendarDays,
  X,
} from "lucide-react";

const secoes = [
  { href: "/", nome: "Visão geral", Icone: LayoutDashboard },
  { href: "/usuarios", nome: "Usuários", Icone: Users },
  { href: "/laboratorios", nome: "Laboratórios", Icone: FlaskConical },
  { href: "/salas", nome: "Salas", Icone: DoorOpen },
  { href: "/status", nome: "Status", Icone: ClipboardList },
  { href: "/reservas", nome: "Reservas", Icone: CalendarDays },
];

export default function MenuLateral({
  menuAberto,
  setMenuAberto,
}) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-white p-5 transition-transform md:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-3"
            onClick={() => setMenuAberto(false)}
          >
            <div className="rounded-xl bg-black p-3 text-white">
              <DoorOpen size={23} />
            </div>

            <div>
              <h1 className="font-bold">Reserva de Salas</h1>

              <p className="text-xs text-gray-500">
                Painel administrativo
              </p>
            </div>
          </Link>

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
          {secoes.map(({ href, nome, Icone }) => {
            const ativo =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                href={href}
                key={href}
                onClick={() => setMenuAberto(false)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm ${
                  ativo
                    ? "bg-gray-100 font-semibold text-black"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icone size={19} />
                {nome}
              </Link>
            );
          })}
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

      {menuAberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuAberto(false)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      )}
    </>
  );
}