"use client";

import PainelLayout from "../components/PainelLayout";
import CrudPage from "../components/CrudPage";

const campos = [
  { nome: "codigo", rotulo: "Código", tipo: "text" },
  { nome: "nome", rotulo: "Nome da sala", tipo: "text" },
  { nome: "capacidade", rotulo: "Capacidade", tipo: "number" },
  { nome: "localizacao", rotulo: "Localização", tipo: "text" },
];

export default function SalasPage() {
  return (
    <PainelLayout>
      <CrudPage
        tipo="salas"
        titulo="Salas"
        campos={campos}
      />
    </PainelLayout>
  );
}