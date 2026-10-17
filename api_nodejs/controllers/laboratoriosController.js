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
  if (
    typeof valor !== 'string' &&
    typeof valor !== 'number'
  ) {
    return null;
  }

  if (
    typeof valor === 'string' &&
    !/^\d+$/.test(valor.trim())
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isSafeInteger(numero) ||
    numero <= 0 ||
    numero > 2147483647
  ) {
    return null;
  }

  return numero;
}

// Cadastrar laboratório
export async function cadastrarLaboratorio(req, res) {
  try {
    if (
      !req.body ||
      typeof req.body !== 'object' ||
      Array.isArray(req.body)
    ) {
      return res.status(400).send(
        'Os dados enviados são inválidos.'
      );
    }

    const codigo = texto(req.body.codigo, 20);
    const nome = texto(req.body.nome, 100);
    const capacidade = numeroPositivo(req.body.capacidade);
    const localizacao = texto(req.body.localizacao, 100);

    if (
      !codigo ||
      !nome ||
      !capacidade ||
      capacidade > 10000 ||
      !localizacao
    ) {
      return res.status(400).send(
        'Dados inválidos para o laboratório.'
      );
    }

    const banco = await conectarBanco();
    const request = banco.request();

    request.input('codigo', sql.VarChar(20), codigo);
    request.input('nome', sql.VarChar(100), nome);
    request.input('capacidade', sql.Int, capacidade);
    request.input(
      'localizacao',
      sql.VarChar(100),
      localizacao
    );

    await request.query(`
      INSERT INTO reserva.LABORATORIO
        (codigo, nome, capacidade, localizacao)
      VALUES
        (@codigo, @nome, @capacidade, @localizacao)
    `);

    return res.status(201).send(`
      <h1>Laboratório cadastrado!</h1>
      <p><a href="/cadastro-laboratorio">Cadastrar outro</a></p>
      <p><a href="/">Voltar ao início</a></p>
    `);
  } catch (erro) {
    console.error(
      'Erro ao cadastrar laboratório:',
      erro.message
    );

    if (erro.number === 2627 || erro.number === 2601) {
      return res.status(409).send(
        'Já existe um laboratório com esse código.'
      );
    }

    return res.status(500).send(
      'Não foi possível cadastrar o laboratório.'
    );
  }
}

// Listar laboratórios
export async function listarLaboratorios(req, res) {
  try {
    const banco = await conectarBanco();

    const resultado = await banco.request().query(`
      SELECT
        id_laboratorio,
        codigo,
        nome,
        capacidade,
        localizacao
      FROM reserva.LABORATORIO
      ORDER BY nome
    `);

    return res.json(resultado.recordset);
  } catch (erro) {
    console.error(
      'Erro ao consultar laboratórios:',
      erro.message
    );

    return res.status(500).json({
      mensagem: 'Erro ao consultar laboratórios.'
    });
  }
}

// Excluir laboratório
export async function excluirLaboratorio(req, res) {
  try {
    const idTexto = req.params.id;

    if (
      typeof idTexto !== 'string' ||
      !/^[1-9]\d*$/.test(idTexto)
    ) {
      return res.status(400).json({
        mensagem: 'ID do laboratório inválido.'
      });
    }

    const id = numeroPositivo(idTexto);

    if (id === null) {
      return res.status(400).json({
        mensagem: 'ID do laboratório inválido.'
      });
    }

    const banco = await conectarBanco();
    const request = banco.request();

    request.input('id', sql.Int, id);

    const resultado = await request.query(`
      DELETE FROM reserva.LABORATORIO
      WHERE id_laboratorio = @id
    `);

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({
        mensagem: 'Laboratório não encontrado.'
      });
    }

    return res.json({
      mensagem: 'Laboratório excluído com sucesso!'
    });
  } catch (erro) {
    console.error(
      'Erro ao excluir laboratório:',
      erro.message
    );

    if (erro.number === 547) {
      return res.status(409).json({
        mensagem:
          'Não é possível excluir este laboratório porque ele está vinculado a outros registros.'
      });
    }

    return res.status(500).json({
      mensagem: 'Não foi possível excluir o laboratório.'
    });
  }
}