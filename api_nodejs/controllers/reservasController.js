import { conectarBanco, sql } from "../config/db.js";

// Verifica se a data realmente existe no calendário
function dataValida(valor) {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return false;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);

  if (ano < 1 || mes < 1 || mes > 12) {
    return false;
  }

  const bissexto =
    ano % 4 === 0 &&
    (ano % 100 !== 0 || ano % 400 === 0);

  const diasPorMes = [
    31,
    bissexto ? 29 : 28,
    31, 30, 31, 30,
    31, 31, 30, 31, 30, 31,
  ];

  return dia >= 1 && dia <= diasPorMes[mes - 1];
}

// Verifica se o horário está no formato HH:mm
function horaValida(valor) {
  if (
    typeof valor !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(valor)
  ) {
    return false;
  }

  return true;
}

// Aceita somente IDs inteiros positivos e seguros
function idValido(valor) {
  if (typeof valor === "number") {
    return Number.isSafeInteger(valor) && valor > 0;
  }

  if (
    typeof valor !== "string" ||
    !/^[1-9]\d*$/.test(valor.trim())
  ) {
    return false;
  }

  return Number.isSafeInteger(Number(valor));
}

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

    // Valida os filtros recebidos pela API
    for (const [valor, limite] of [
      [recurso, 100],
      [usuario, 100],
    ]) {
      if (
        valor !== undefined &&
        (
          typeof valor !== "string" ||
          valor.trim().length > limite
        )
      ) {
        return res.status(400).json({
          mensagem: "Um dos filtros de texto é inválido.",
        });
      }
    }

    const dataInicioFiltro =
      data_inicio === undefined || data_inicio === ""
        ? null
        : data_inicio;

    const dataFimFiltro =
      data_fim === undefined || data_fim === ""
        ? null
        : data_fim;

    const horaFiltro =
      hora === undefined || hora === ""
        ? null
        : hora;

    const statusFiltro =
      id_status === undefined || id_status === ""
        ? null
        : id_status;

    if (
      dataInicioFiltro !== null &&
      !dataValida(dataInicioFiltro)
    ) {
      return res.status(400).json({
        mensagem: "A data inicial do filtro é inválida.",
      });
    }

    if (
      dataFimFiltro !== null &&
      !dataValida(dataFimFiltro)
    ) {
      return res.status(400).json({
        mensagem: "A data final do filtro é inválida.",
      });
    }

    if (
      dataInicioFiltro &&
      dataFimFiltro &&
      dataInicioFiltro > dataFimFiltro
    ) {
      return res.status(400).json({
        mensagem: "A data inicial não pode ser posterior à final.",
      });
    }

    if (horaFiltro !== null && !horaValida(horaFiltro)) {
      return res.status(400).json({
        mensagem: "O horário do filtro é inválido.",
      });
    }

    if (statusFiltro !== null && !idValido(statusFiltro)) {
      return res.status(400).json({
        mensagem: "O status informado é inválido.",
      });
    }

    const pool = await conectarBanco();
    const pedido = pool.request();

    pedido.input(
      "recurso",
      sql.VarChar(100),
      typeof recurso === "string" && recurso.trim()
        ? recurso.trim()
        : null
    );

    pedido.input(
      "usuario",
      sql.VarChar(100),
      typeof usuario === "string" && usuario.trim()
        ? usuario.trim()
        : null
    );

    pedido.input(
      "data_inicio",
      sql.VarChar(10),
      dataInicioFiltro
    );

    pedido.input(
      "data_fim",
      sql.VarChar(10),
      dataFimFiltro
    );

    pedido.input(
      "hora",
      sql.VarChar(8),
      horaFiltro
    );

    pedido.input(
      "id_status",
      sql.Int,
      statusFiltro === null ? null : Number(statusFiltro)
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

    return res.json(resultado.recordset);
  } catch (erro) {
    console.error("Erro ao listar reservas:", erro.message);

    return res.status(500).json({
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

    const temLaboratorio =
      id_laboratorio !== undefined &&
      id_laboratorio !== null &&
      id_laboratorio !== "";

    const temSala =
      id_sala !== undefined &&
      id_sala !== null &&
      id_sala !== "";

    if (
      !dataValida(data_inicio) ||
      !dataValida(data_fim) ||
      !horaValida(hora_inicio) ||
      !horaValida(hora_fim) ||
      !idValido(id_usuario) ||
      !idValido(id_status)
    ) {
      return res.status(400).json({
        mensagem: "Verifique os campos, as datas, os horários e os IDs.",
      });
    }

    if (data_fim < data_inicio) {
      return res.status(400).json({
        mensagem: "A data final não pode ser anterior à inicial.",
      });
    }

    if (
      data_inicio === data_fim &&
      hora_fim <= hora_inicio
    ) {
      return res.status(400).json({
        mensagem: "O horário final deve ser posterior ao inicial.",
      });
    }

    if (temLaboratorio === temSala) {
      return res.status(400).json({
        mensagem: "Selecione somente um recurso: laboratório ou sala.",
      });
    }

    if (
      temLaboratorio &&
      !idValido(id_laboratorio)
    ) {
      return res.status(400).json({
        mensagem: "O ID do laboratório é inválido.",
      });
    }

    if (
      temSala &&
      !idValido(id_sala)
    ) {
      return res.status(400).json({
        mensagem: "O ID da sala é inválido.",
      });
    }

    const pool = await conectarBanco();
    const pedido = pool.request();

    pedido.input("data_inicio", sql.VarChar(10), data_inicio);
    pedido.input("data_fim", sql.VarChar(10), data_fim);
    pedido.input("hora_inicio", sql.VarChar(8), hora_inicio);
    pedido.input("hora_fim", sql.VarChar(8), hora_fim);

    pedido.input("id_usuario", sql.Int, Number(id_usuario));
    pedido.input("id_status", sql.Int, Number(id_status));

    pedido.input(
      "id_laboratorio",
      sql.Int,
      temLaboratorio ? Number(id_laboratorio) : null
    );

    pedido.input(
      "id_sala",
      sql.Int,
      temSala ? Number(id_sala) : null
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

    return res.status(201).json(resultado.recordset[0]);
  } catch (erro) {
    console.error("Erro ao cadastrar reserva:", erro.message);

    return res.status(500).json({
      mensagem: "Erro ao cadastrar reserva.",
    });
  }
}

// Excluir reserva
export async function excluirReserva(req, res) {
  try {
    const { id } = req.params;

    if (!idValido(id)) {
      return res.status(400).json({
        mensagem: "ID inválido.",
      });
    }

    const pool = await conectarBanco();

    const resultado = await pool
      .request()
      .input("id", sql.Int, Number(id))
      .query(`
        DELETE FROM reserva.RESERVA
        WHERE id_reserva = @id
      `);

    if (resultado.rowsAffected[0] === 0) {
      return res.status(404).json({
        mensagem: "Reserva não encontrada.",
      });
    }

    return res.json({
      mensagem: "Reserva excluída com sucesso.",
    });
  } catch (erro) {
    console.error("Erro ao excluir reserva:", erro.message);

    return res.status(500).json({
      mensagem: "Erro ao excluir reserva.",
    });
  }
}