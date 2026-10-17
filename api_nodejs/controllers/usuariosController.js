import { conectarBanco, sql } from "../config/db.js";
import bcrypt from "bcryptjs";

function texto(valor, maximo) {
  if (typeof valor !== "string") return null;

  const resultado = valor.trim();

  if (!resultado || resultado.length > maximo) {
    return null;
  }

  return resultado;
}

function dataNascimentoValida(valor) {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return false;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);

  const data = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return false;
  }

  const hoje = new Date();
  const hojeTexto = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");

  return ano >= 1900 && valor <= hojeTexto;
}

function cpfValido(valor) {
  if (
    typeof valor !== "string" ||
    !/^[0-9.\-\s]+$/.test(valor)
  ) {
    return false;
  }

  return valor.replace(/\D/g, "").length === 11;
}

function celularValido(valor) {
  if (
    typeof valor !== "string" ||
    !/^[0-9+\-() ]{8,20}$/.test(valor)
  ) {
    return false;
  }

  const quantidade = valor.replace(/\D/g, "").length;

  return quantidade >= 8 && quantidade <= 15;
}

export async function cadastrarUsuario(req, res) {
  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        mensagem: "Os dados enviados são inválidos.",
      });
    }

    const cpf = texto(req.body.cpf, 14);
    const nome = texto(req.body.nome, 100);
    const dataNascimento = req.body.data_nascimento;
    const celular = texto(req.body.celular, 20);
    const email = texto(req.body.email, 100)?.toLowerCase();
    const login = texto(req.body.login, 50);
    const senha = req.body.senha;

    if (
      !cpf ||
      !nome ||
      !celular ||
      !email ||
      !login ||
      typeof senha !== "string"
    ) {
      return res.status(400).json({
        mensagem: "Preencha corretamente todos os campos.",
      });
    }

    if (!cpfValido(cpf)) {
      return res.status(400).json({
        mensagem: "Informe um CPF com 11 números.",
      });
    }

    if (!dataNascimentoValida(dataNascimento)) {
      return res.status(400).json({
        mensagem: "A data de nascimento é inválida.",
      });
    }

    if (!celularValido(celular)) {
      return res.status(400).json({
        mensagem: "O número de celular é inválido.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        mensagem: "Informe um e-mail válido.",
      });
    }

    if (!/^[a-zA-Z0-9._-]{3,50}$/.test(login)) {
      return res.status(400).json({
        mensagem:
          "O login deve ter de 3 a 50 caracteres, usando letras, números, ponto, hífen ou sublinhado.",
      });
    }

    if (
      senha.length < 8 ||
      Buffer.byteLength(senha, "utf8") > 72
    ) {
      return res.status(400).json({
        mensagem:
          "A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.",
      });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const banco = await conectarBanco();
    const request = banco.request();

    request.input("cpf", sql.VarChar(14), cpf);
    request.input("nome", sql.VarChar(100), nome);
    request.input(
      "data_nascimento",
      sql.Date,
      dataNascimento
    );
    request.input("celular", sql.VarChar(20), celular);
    request.input("email", sql.VarChar(100), email);
    request.input("login", sql.VarChar(50), login);
    request.input("senha", sql.VarChar(100), senhaHash);

    await request.query(`
      INSERT INTO reserva.USUARIO
      (
        cpf,
        nome,
        data_nascimento,
        celular,
        email,
        login,
        senha,
        data_cadastro
      )
      VALUES
      (
        @cpf,
        @nome,
        @data_nascimento,
        @celular,
        @email,
        @login,
        @senha,
        GETDATE()
      )
    `);

    return res.status(201).json({
      mensagem: "Usuário cadastrado com sucesso!",
    });
  } catch (erro) {
    console.error(
      "Erro ao cadastrar usuário:",
      erro.message
    );

    if (erro.number === 2627 || erro.number === 2601) {
      return res.status(409).json({
        mensagem: "CPF ou login já cadastrado.",
      });
    }

    return res.status(500).json({
      mensagem:
        "Não foi possível cadastrar o usuário. Verifique os dados informados.",
    });
  }
}

export async function listarUsuarios(req, res) {
  try {
    const banco = await conectarBanco();

    const resultado = await banco.request().query(`
      SELECT id_usuario, nome
      FROM reserva.USUARIO
      ORDER BY nome
    `);

    return res.json(resultado.recordset);
  } catch (erro) {
    console.error(
      "Erro ao consultar usuários:",
      erro.message
    );

    return res.status(500).json({
      mensagem: "Erro ao consultar usuários.",
    });
  }
}

export async function excluirUsuario(req, res) {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        mensagem: "ID do usuário inválido.",
      });
    }

    const numeroId = Number(id);

    if (!Number.isSafeInteger(numeroId)) {
      return res.status(400).json({
        mensagem: "ID do usuário inválido.",
      });
    }

    const banco = await conectarBanco();
    const request = banco.request();

    request.input("id", sql.Int, numeroId);

    const resultado = await request.query(`
      DELETE FROM reserva.USUARIO
      WHERE id_usuario = @id
    `);

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({
        mensagem: "Usuário não encontrado.",
      });
    }

    return res.json({
      mensagem: "Usuário excluído com sucesso!",
    });
  } catch (erro) {
    console.error(
      "Erro ao excluir usuário:",
      erro.message
    );

    if (erro.number === 547) {
      return res.status(409).json({
        mensagem:
          "Não é possível excluir este usuário porque ele está vinculado a uma reserva.",
      });
    }

    return res.status(500).json({
      mensagem: "Não foi possível excluir o usuário.",
    });
  }
}