
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { csrfSync } from 'csrf-sync';

import { conectarBanco } from './config/db.js';
import {
  protecaoCabecalhos,
  limiteRequisicoes
} from './middleware/security.js';

import usuariosRouter from './routes/usuarios.js';
import laboratoriosRouter from './routes/laboratorios.js';
import salasRouter from './routes/salas.js';
import statusRouter from './routes/status.js';

const app = express();
const porta = Number(process.env.PORTA || 3000);

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('Configure SESSION_SECRET com pelo menos 32 caracteres no .env.');
}

for (const variavel of ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD']) {
  if (!process.env[variavel]) {
    throw new Error(`Configure ${variavel} no arquivo .env.`);
  }
}

app.disable('x-powered-by');

app.use(protecaoCabecalhos);

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

app.use(session({
  name: 'reserva.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000
  }
}));

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) =>
    req.body?._csrf || req.headers['x-csrf-token']
});

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: generateToken(req) });
});

app.use(csrfSynchronisedProtection);
app.use(limiteRequisicoes);

app.get('/', (req, res) => {
  res.json({ mensagem: 'API do Sistema de Reservas funcionando!' });
});

app.use('/usuarios', usuariosRouter);
app.use('/laboratorios', laboratoriosRouter);
app.use('/salas', salasRouter);
app.use('/status', statusRouter);

app.use((req, res) => {
  res.status(404).json({ mensagem: 'Rota não encontrada.' });
});

app.use((erro, req, res, next) => {
  if (erro.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      mensagem: 'Token de segurança inválido. Atualize a página e tente novamente.'
    });
  }

  console.error('Erro inesperado:', erro.message);

  if (res.headersSent) return next(erro);

  res.status(500).json({ mensagem: 'Ocorreu um erro interno.' });
});

let servidor;

async function iniciarServidor() {
  try {
    await conectarBanco();
    console.log('Conexão com o banco de dados estabelecida.');

    servidor = app.listen(porta, () => {
      console.log(`Servidor iniciado em http://localhost:${porta}`);
    });
  } catch (erro) {
    console.error('Não foi possível conectar ao banco:', erro.message);
    process.exitCode = 1;
  }
}

async function encerrar() {
  if (servidor) {
    servidor.close();
  }

  try {
    const banco = await conectarBanco();
    await banco.close();
  } catch {}

  process.exit(0);
}

process.once('SIGINT', encerrar);
process.once('SIGTERM', encerrar);

iniciarServidor();
