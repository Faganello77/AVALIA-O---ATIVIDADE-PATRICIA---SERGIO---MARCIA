"use client";

import PainelLayout from "../components/PainelLayout";
import CrudPage from "../components/CrudPage";

const campos = [
  { nome: "codigo", rotulo: "Código", tipo: "text" },
  {
    nome: "nome",
    rotulo: "Nome do laboratório",
    tipo: "text",
  },
  { nome: "capacidade", rotulo: "Capacidade", tipo: "number" },
  { nome: "localizacao", rotulo: "Localização", tipo: "text" },
];

export default function LaboratoriosPage() {
  return (
    <PainelLayout>
      <CrudPage
        tipo="laboratorios"
        titulo="Laboratórios"
        campos={campos}
      />
    </PainelLayout>
  );
}