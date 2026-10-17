import { conectarBanco, sql } from "../config/db.js";

// Consultar reservas com filtros
export async function listarReservas(req, res) {
  try {
    const {
      recurso,
      data_inicio,
      data_fim,
      hora,
      usuario,
      id_status,
    } = req.query;

    const pool = await conectarBanco();
    const pedido = pool.request();

    pedido.input("recurso", sql.VarChar(100), recurso?.trim() || null);
    pedido.input("usuario", sql.VarChar(100), usuario?.trim() || null);
    pedido.input("data_inicio", sql.VarChar(10), data_inicio || null);
    pedido.input("data_fim", sql.VarChar(10), data_fim || null);
    pedido.input("hora", sql.VarChar(8), hora || null);
    pedido.input(
      "id_status",
      sql.Int,
      id_status ? Number(id_status) : null
    );

    const resultado = await pedido.query(`
      SELECT
        r.id_reserva,

        CONVERT(varchar(10), r.data_inicio, 23) AS data_inicio,
        CONVERT(varchar(10), r.data_fim, 23) AS data_fim,

        CONVERT(varchar(5), r.hora_inicio, 108) AS hora_inicio,
        CONVERT(varchar(5), r.hora_fim, 108) AS hora_fim,

        r.id_usuario,
        u.nome AS nome_usuario,

        r.id_laboratorio,
        l.codigo AS codigo_laboratorio,
        l.nome AS nome_laboratorio,

        r.id_sala,
        s.codigo AS codigo_sala,
        s.nome AS nome_sala,

        r.id_status,
        st.nome AS nome_status

      FROM reserva.RESERVA r

      LEFT JOIN reserva.USUARIO u
        ON r.id_usuario = u.id_usuario

      LEFT JOIN reserva.LABORATORIO l
        ON r.id_laboratorio = l.id_laboratorio

      LEFT JOIN reserva.SALA s
        ON r.id_sala = s.id_sala

      LEFT JOIN reserva.STATUS st
        ON r.id_status = st.id_status

      WHERE
        (
          @data_inicio IS NULL
          OR r.data_fim >= TRY_CONVERT(date, @data_inicio, 23)
        )

        AND (
          @data_fim IS NULL
          OR r.data_inicio <= TRY_CONVERT(date, @data_fim, 23)
        )

        AND (
          @hora IS NULL
          OR (
            r.hora_inicio <= TRY_CONVERT(time(0), @hora, 108)
            AND r.hora_fim >= TRY_CONVERT(time(0), @hora, 108)
          )
        )

        AND (
          @usuario IS NULL
          OR u.nome LIKE '%' + @usuario + '%'
        )

        AND (
          @recurso IS NULL
          OR l.codigo LIKE '%' + @recurso + '%'
          OR l.nome LIKE '%' + @recurso + '%'
          OR s.codigo LIKE '%' + @recurso + '%'
          OR s.nome LIKE '%' + @recurso + '%'
        )

        AND (
          @id_status IS NULL
          OR r.id_status = @id_status
        )

      ORDER BY r.data_inicio DESC, r.hora_inicio DESC
    `);

    res.json(resultado.recordset);
  } catch (erro) {
    console.error("Erro ao listar reservas:", erro);

    res.status(500).json({
      mensagem: "Erro ao listar reservas.",
    });
  }
}

// Cadastrar reserva
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
      id_sala,
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
        erro: "Preencha todos os campos obrigatórios.",
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data_inicio) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data_fim) ||
      !/^\d{2}:\d{2}$/.test(hora_inicio) ||
      !/^\d{2}:\d{2}$/.test(hora_fim)
    ) {
      return res.status(400).json({
        erro: "Verifique as datas e os horários informados.",
      });
    }

    if (data_fim < data_inicio) {
      return res.status(400).json({
        erro: "A data final não pode ser anterior à inicial.",
      });
    }

    if (id_laboratorio && id_sala) {
      return res.status(400).json({
        erro: "Selecione somente um recurso: laboratório ou sala.",
      });
    }

    const pool = await conectarBanco();
    const pedido = pool.request();

    // Recebe os valores como texto e converte no SQL Server.
    pedido.input("data_inicio", sql.VarChar(10), data_inicio);
    pedido.input("data_fim", sql.VarChar(10), data_fim);
    pedido.input("hora_inicio", sql.VarChar(8), hora_inicio);
    pedido.input("hora_fim", sql.VarChar(8), hora_fim);

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
        CONVERT(date, @data_inicio, 23),
        CONVERT(date, @data_fim, 23),
        CONVERT(time(0), @hora_inicio, 108),
        CONVERT(time(0), @hora_fim, 108),
        @id_usuario,
        @id_status,
        @id_laboratorio,
        @id_sala
      )
    `);

    res.status(201).json(resultado.recordset[0]);
  } catch (erro) {
    console.error("Erro ao cadastrar reserva:", erro);

    res.status(500).json({
      erro: "Erro ao cadastrar reserva.",
    });
  }
}

// Excluir reserva
export async function excluirReserva(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        erro: "ID inválido.",
      });
    }

    const pool = await conectarBanco();

    const resultado = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        DELETE FROM reserva.RESERVA
        WHERE id_reserva = @id
      `);

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({
        erro: "Reserva não encontrada.",
      });
    }

    res.json({
      mensagem: "Reserva excluída com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao excluir reserva:", erro);

    res.status(500).json({
      erro: "Erro ao excluir reserva.",
    });
  }
}