import { conectarBanco, sql } from '../config/db.js';
import bcrypt from 'bcryptjs';

// Realizar login
export async function login(req, res) {
  try {
    const { login: loginDigitado, senha } = req.body || {};

    if (
      typeof loginDigitado !== 'string' ||
      typeof senha !== 'string' ||
      !loginDigitado.trim() ||
      !senha ||
      loginDigitado.length > 50 ||
      Buffer.byteLength(senha, 'utf8') > 72
    ) {
      return res.status(400).json({
        mensagem: 'Informe um login e uma senha válidos.'
      });
    }

    const banco = await conectarBanco();

    const resultado = await banco.request()
      .input('login', sql.VarChar(50), loginDigitado.trim())
      .query(`
        SELECT TOP 1 id_usuario, login, senha
        FROM reserva.USUARIO
        WHERE login = @login
      `);

    const usuario = resultado.recordset[0];

    if (
      !usuario ||
      typeof usuario.senha !== 'string' ||
      !(await bcrypt.compare(senha, usuario.senha.trim()))
    ) {
      return res.status(401).json({
        mensagem: 'Login ou senha incorretos.'
      });
    }

    req.session.regenerate((erro) => {
      if (erro) {
        console.error('Erro ao iniciar sessão:', erro.message);
        return res.status(500).json({
          mensagem: 'Não foi possível iniciar a sessão.'
        });
      }

      req.session.user = {
        id: usuario.id_usuario,
        login: usuario.login
      };

      req.session.save((erroSalvar) => {
        if (erroSalvar) {
          console.error('Erro ao salvar sessão:', erroSalvar.message);
          return res.status(500).json({
            mensagem: 'Não foi possível salvar a sessão.'
          });
        }

        return res.json({
          mensagem: 'Login realizado com sucesso!',
          usuario: {
            id: usuario.id_usuario,
            login: usuario.login
          }
        });
      });
    });
  } catch (erro) {
    console.error('Erro ao realizar login:', erro.message);
    return res.status(500).json({
      mensagem: 'Não foi possível realizar o login.'
    });
  }
}

// Verificar sessão
export function verificarSessao(req, res) {
  if (!req.session?.user) {
    return res.status(401).json({
      autenticado: false
    });
  }

  return res.json({
    autenticado: true,
    usuario: req.session.user
  });
}

// Encerrar sessão
export function logout(req, res) {
  req.session.destroy((erro) => {
    if (erro) {
      console.error('Erro ao encerrar sessão:', erro.message);
      return res.status(500).json({
        mensagem: 'Não foi possível sair do sistema.'
      });
    }

    res.clearCookie('reserva.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res.json({
      mensagem: 'Sessão encerrada com sucesso!'
    });
  });
}