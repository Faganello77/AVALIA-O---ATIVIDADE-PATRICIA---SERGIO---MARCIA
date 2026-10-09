
import { conectarBanco, sql } from '../config/db.js';
import bcrypt from 'bcryptjs';

function texto(valor, maximo) {
  if (typeof valor !== 'string') return null;

  const resultado = valor.trim();

  if (!resultado || resultado.length > maximo) return null;

  return resultado;
}

export async function cadastrarUsuario(req, res) {
  try {
    const cpf = texto(req.body.cpf, 14);
    const nome = texto(req.body.nome, 100);
    const dataNascimento = texto(req.body.data_nascimento, 10);
    const celular = texto(req.body.celular, 20);
    const email = texto(req.body.email, 100);
    const login = texto(req.body.login, 50);
    const senha = req.body.senha;

    if (
      !cpf || !nome || !dataNascimento || !celular ||
      !email || !login || typeof senha !== 'string' ||
      senha.length < 8 || senha.length > 72
    ) {
      return res.status(400).json({
        mensagem: 'Confira os campos e use uma senha de 8 a 72 caracteres.'
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento) ||
      Number.isNaN(Date.parse(dataNascimento)) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        mensagem: 'Data de nascimento ou e-mail inválido.'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const banco = await conectarBanco();
    const request = banco.request();

    request.input('cpf', sql.VarChar(14), cpf);
    request.input('nome', sql.VarChar(100), nome);
    request.input('data_nascimento', sql.Date, dataNascimento);
    request.input('celular', sql.VarChar(20), celular);
    request.input('email', sql.VarChar(100), email);
    request.input('login', sql.VarChar(50), login);
    request.input('senha', sql.VarChar(100), senhaHash);

    await request.query(`
      INSERT INTO reserva.USUARIO
      (cpf, nome, data_nascimento, celular, email, login, senha, data_cadastro)
      VALUES
      (@cpf, @nome, @data_nascimento, @celular, @email, @login, @senha, GETDATE())
    `);

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!'
    });
  } catch (erro) {
    console.error('Erro ao cadastrar usuário:', erro.message);

    return res.status(500).json({
      mensagem: 'Não foi possível cadastrar. Verifique se CPF e login já existem e confira os dados.'
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
    console.error('Erro ao consultar usuários:', erro.message);

    return res.status(500).json({
      mensagem: 'Erro ao consultar usuários.'
    });
  }
}
