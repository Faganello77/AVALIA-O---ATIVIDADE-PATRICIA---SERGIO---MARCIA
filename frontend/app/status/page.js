"use client";

import PainelLayout from "../components/PainelLayout";
import CrudPage from "../components/CrudPage";

export default function StatusPage() {
  return (
    <PainelLayout>
      <CrudPage
        tipo="status"
        titulo="Status"
        permitirCadastro={false}
        permitirExclusao={false}
      />
    </PainelLayout>
  );
}