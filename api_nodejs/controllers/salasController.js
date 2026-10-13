
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

export async function cadastrarSala(req, res) {
  try {
    const codigo = texto(req.body.codigo, 20);
    const nome = texto(req.body.nome, 100);
    const capacidade = numeroPositivo(req.body.capacidade);
    const localizacao = texto(req.body.localizacao, 100);

    if (!codigo || !nome || !capacidade ||
        capacidade > 10000 || !localizacao) {
      return res.status(400).send(
        'Dados inválidos para a sala.'
      );
    }

    const banco = await conectarBanco();
    const request = banco.request();

    request.input('codigo', sql.VarChar(20), codigo);
    request.input('nome', sql.VarChar(100), nome);
    request.input('capacidade', sql.Int, capacidade);
    request.input('localizacao', sql.VarChar(100), localizacao);

    await request.query(`
      INSERT INTO reserva.SALA
        (codigo, nome, capacidade, localizacao)
      VALUES
        (@codigo, @nome, @capacidade, @localizacao)
    `);

    res.send(`
      <h1>Sala cadastrada!</h1>
      <p><a href="/cadastro-sala">Cadastrar outra</a></p>
      <p><a href="/">Voltar ao início</a></p>
    `);
  } catch (erro) {
    console.error('Erro ao cadastrar sala:', erro.message);
    res.status(500).send(
      'Não foi possível cadastrar a sala.'
    );
  }
}

export async function listarSalas(req, res) {
  try {
    const banco = await conectarBanco();

    const resultado = await banco.request().query(`
      SELECT id_sala, codigo, nome, capacidade, localizacao
      FROM reserva.SALA
      ORDER BY nome
    `);

    res.json(resultado.recordset);
  } catch (erro) {
    console.error('Erro ao consultar salas:', erro.message);
    res.status(500).json({
      mensagem: 'Erro ao consultar salas.'
    });
  }
}
export async function excluirSala(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        mensagem: 'ID da sala inválido.'
      });
    }

    const banco = await conectarBanco();
    const request = banco.request();

    request.input('id', sql.Int, id);

    const resultado = await request.query(`
      DELETE FROM reserva.SALA
      WHERE id_sala = @id
    `);

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({
        mensagem: 'Sala não encontrada.'
      });
    }

    return res.json({
      mensagem: 'Sala excluída com sucesso!'
    });
  } catch (erro) {
    console.error('Erro ao excluir sala:', erro.message);

    if (erro.number === 547) {
      return res.status(409).json({
        mensagem: 'Não é possível excluir esta sala porque ela está vinculada a outros registros.'
      });
    }

    return res.status(500).json({
      mensagem: 'Não foi possível excluir a sala.'
    });
  }
}

