
import { conectarBanco } from '../config/db.js';

export async function listarStatus(req, res) {
  try {
    const banco = await conectarBanco();

    const resultado = await banco.request().query(`
      SELECT id_status, nome
      FROM reserva.STATUS
      ORDER BY id_status
    `);

    res.json(resultado.recordset);
  } catch (erro) {
    console.error('Erro ao consultar status:', erro.message);

    res.status(500).json({
      mensagem: 'Erro ao consultar status.'
    });
  }
}
