import { conectarBanco, sql } from "../config/db.js";

export async function listarReservas(req, res) {
  try {
    const pool = await conectarBanco();

    const resultado = await pool.request().query(`
      SELECT *
      FROM reserva.RESERVA
      ORDER BY data_inicio DESC
    `);

    res.json(resultado.recordset);
  } catch (erro) {
    console.error("Erro ao listar reservas:", erro);
    res.status(500).json({ erro: "Erro ao listar reservas." });
  }
}

export async function cadastrarReserva(req, res) {
  try {
    const {
      data_inicio,
      data_fim,
      hora_inicio,
      hora_fim,
      id_usuario,
      id_status,
      id_laboratorio,
      id_sala
    } = req.body;

    if (
      !data_inicio ||
      !data_fim ||
      !hora_inicio ||
      !hora_fim ||
      !id_usuario ||
      !id_status ||
      (!id_laboratorio && !id_sala)
    ) {
      return res.status(400).json({
        erro: "Preencha todos os campos obrigatórios."
      });
    }

    const pool = await conectarBanco();
    const pedido = pool.request();

    pedido.input("data_inicio", sql.Date, data_inicio);
    pedido.input("data_fim", sql.Date, data_fim);
    pedido.input("hora_inicio", sql.VarChar, hora_inicio);
    pedido.input("hora_fim", sql.VarChar, hora_fim);
    pedido.input("id_usuario", sql.Int, Number(id_usuario));
    pedido.input("id_status", sql.Int, Number(id_status));
    pedido.input(
      "id_laboratorio",
      sql.Int,
      id_laboratorio ? Number(id_laboratorio) : null
    );
    pedido.input(
      "id_sala",
      sql.Int,
      id_sala ? Number(id_sala) : null
    );

    const resultado = await pedido.query(`
      INSERT INTO reserva.RESERVA (
        data_inicio,
        data_fim,
        hora_inicio,
        hora_fim,
        id_usuario,
        id_status,
        id_laboratorio,
        id_sala
      )
      OUTPUT INSERTED.*
      VALUES (
        @data_inicio,
        @data_fim,
        @hora_inicio,
        @hora_fim,
        @id_usuario,
        @id_status,
        @id_laboratorio,
        @id_sala
      )
    `);

    res.status(201).json(resultado.recordset[0]);
  } catch (erro) {
    console.error("Erro ao cadastrar reserva:", erro);
    res.status(500).json({ erro: "Erro ao cadastrar reserva." });
  }
}

export async function excluirReserva(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ erro: "ID inválido." });
    }

    const pool = await conectarBanco();

    const resultado = await pool.request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM reserva.RESERVA
        WHERE id_reserva = @id
      `);

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({
        erro: "Reserva não encontrada."
      });
    }

    res.json({ mensagem: "Reserva excluída com sucesso." });
  } catch (erro) {
    console.error("Erro ao excluir reserva:", erro);
    res.status(500).json({ erro: "Erro ao excluir reserva." });
  }
}