
import { conectarBanco, sql } from '../config/db.js';

function texto(valor, maximo) {
  if (typeof valor !== 'string') return null;

  const resultado = valor.trim();

  if (!resultado || resultado.length > maximo) {
    return null;
  }

  return resultado;
}

function numeroPositivo(valor) {
  const numero = Number(valor);

  if (!Number.isSafeInteger(numero) || numero <= 0) {
    return null;
  }

  return numero;
}

export async function cadastrarLaboratorio(req, res) {
  try {
    const codigo = texto(req.body.codigo, 20);
    const nome = texto(req.body.nome, 100);
    const capacidade = numeroPositivo(req.body.capacidade);
    const localizacao = texto(req.body.localizacao, 100);

    if (!codigo || !nome || !capacidade ||
        capacidade > 10000 || !localizacao) {
      return res.status(400).send(
        'Dados inválidos para o laboratório.'
      );
    }

    const banco = await conectarBanco();
    const request = banco.request();

    request.input('codigo', sql.VarChar(20), codigo);
    request.input('nome', sql.VarChar(100), nome);
    request.input('capacidade', sql.Int, capacidade);
    request.input('localizacao', sql.VarChar(100), localizacao);

    await request.query(`
      INSERT INTO reserva.LABORATORIO
        (codigo, nome, capacidade, localizacao)
      VALUES
        (@codigo, @nome, @capacidade, @localizacao)
    `);

    res.send(`
      <h1>Laboratório cadastrado!</h1>
      <p><a href="/cadastro-laboratorio">Cadastrar outro</a></p>
      <p><a href="/">Voltar ao início</a></p>
    `);
  } catch (erro) {
    console.error('Erro ao cadastrar laboratório:', erro.message);
    res.status(500).send(
      'Não foi possível cadastrar o laboratório.'
    );
  }
}

export async function listarLaboratorios(req, res) {
  try {
    const banco = await conectarBanco();

    const resultado = await banco.request().query(`
      SELECT id_laboratorio, codigo, nome, capacidade, localizacao
      FROM reserva.LABORATORIO
      ORDER BY nome
    `);

    res.json(resultado.recordset);
  } catch (erro) {
    console.error('Erro ao consultar laboratórios:', erro.message);
    res.status(500).json({
      mensagem: 'Erro ao consultar laboratórios.'
    });
  }
}
