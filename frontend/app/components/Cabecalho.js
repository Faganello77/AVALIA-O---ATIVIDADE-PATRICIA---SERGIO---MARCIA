"use client";

import { Menu, RefreshCw, LogOut } from "lucide-react";

export default function Cabecalho({
  titulo,
  nomeConta,
  saindo,
  onSair,
  menuAberto,
  setMenuAberto,
  mostrarAtualizar = false,
}) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
          className="rounded-lg p-2 hover:bg-gray-100 md:hidden"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="text-sm text-gray-500">
            Sistema de gerenciamento
          </p>

          <h2 className="text-xl font-bold">{titulo}</h2>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {mostrarAtualizar && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            disabled={saindo}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
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
              {nomeConta || "Conta conectada"}
            </p>
          </div>

          <button
            type="button"
            onClick={onSair}
            disabled={saindo}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={16} />
            {saindo ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    </header>
  );
}