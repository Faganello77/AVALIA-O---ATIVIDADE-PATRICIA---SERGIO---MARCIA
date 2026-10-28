"use client";

import PainelLayout from "../components/PainelLayout";
import CrudPage from "../components/CrudPage";

const campos = [
  { nome: "cpf", rotulo: "CPF", tipo: "text" },
  { nome: "nome", rotulo: "Nome completo", tipo: "text" },
  {
    nome: "data_nascimento",
    rotulo: "Data de nascimento",
    tipo: "date",
  },
  { nome: "celular", rotulo: "Celular", tipo: "text" },
  { nome: "email", rotulo: "E-mail", tipo: "email" },
  { nome: "login", rotulo: "Login", tipo: "text" },
  { nome: "senha", rotulo: "Senha", tipo: "password" },
];

export default function UsuariosPage() {
  return (
    <PainelLayout>
      <CrudPage
        tipo="usuarios"
        titulo="Usuários"
        campos={campos}
      />
    </PainelLayout>
  );
}