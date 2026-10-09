
import 'dotenv/config';
import express from 'express';
import session from 'express-session';
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

if (
  !process.env.SESSION_SECRET ||
  process.env.SESSION_SECRET.length < 32
) {
  throw new Error(
    'Configure SESSION_SECRET com pelo menos 32 caracteres no .env.'
  );
}

const variaveisObrigatorias = [
  'DB_SERVER',
  'DB_DATABASE',
  'DB_USER',
  'DB_PASSWORD'
];

for (const variavel of variaveisObrigatorias) {
  if (!process.env[variavel]) {
    throw new Error(`Configure ${variavel} no arquivo .env.`);
  }
}

app.disable('x-powered-by');

app.use(protecaoCabecalhos);

app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({
  extended: false,
  limit: '20kb'
}));

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

const {
  csrfSynchronisedProtection,
  generateToken
} = csrfSync({
  getTokenFromRequest: (req) => {
    return req.body?._csrf ||
      req.headers['x-csrf-token'];
  }
});

// Gera o token depois de inicializar a sessão.
app.use((req, res, next) => {
  try {
    res.locals.csrfToken = generateToken(req);
    next();
  } catch (erro) {
    next(erro);
  }
});

// Valida o token nas requisições que modificam dados.
app.use(csrfSynchronisedProtection);

app.use(limiteRequisicoes);

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sistema de Reserva</title>
</head>
<body>
  <h1>Sistema de Reserva</h1>

  <h2>Cadastros</h2>
  <p><a href="/cadastro">Cadastrar usuário</a></p>
  <p><a href="/cadastro-laboratorio">Cadastrar laboratório</a></p>
  <p><a href="/cadastro-sala">Cadastrar sala</a></p>

  <h2>Consultas</h2>
  <p><a href="/usuarios">Consultar usuários</a></p>
  <p><a href="/laboratorios">Consultar laboratórios</a></p>
  <p><a href="/salas">Consultar salas</a></p>
  <p><a href="/status">Consultar status</a></p>
</body>
</html>`);
});

app.get('/cadastro', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cadastro de Usuário</title>
</head>
<body>
  <h1>Cadastro de Usuário</h1>

  <form action="/usuarios" method="POST">
    <input type="hidden" name="_csrf" value="${res.locals.csrfToken}">

    <label>CPF:
      <input name="cpf" maxlength="14" required>
    </label><br><br>

    <label>Nome:
      <input name="nome" maxlength="100" required>
    </label><br><br>

    <label>Data de nascimento:
      <input type="date" name="data_nascimento" required>
    </label><br><br>

    <label>Celular:
      <input name="celular" maxlength="20" required>
    </label><br><br>

    <label>E-mail:
      <input type="email" name="email" maxlength="100" required>
    </label><br><br>

    <label>Login:
      <input name="login" maxlength="50" required>
    </label><br><br>

    <label>Senha:
      <input type="password" name="senha"
        minlength="8" maxlength="72"
        autocomplete="new-password" required>
    </label><br><br>

    <button type="submit">Cadastrar</button>
  </form>

  <p><a href="/">Voltar ao início</a></p>
</body>
</html>`);
});

app.get('/cadastro-laboratorio', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cadastro de Laboratório</title>
</head>
<body>
  <h1>Cadastro de Laboratório</h1>

  <form action="/laboratorios" method="POST">
    <input type="hidden" name="_csrf" value="${res.locals.csrfToken}">

    <label>Código:
      <input name="codigo" maxlength="20" required>
    </label><br><br>

    <label>Nome:
      <input name="nome" maxlength="100" required>
    </label><br><br>

    <label>Capacidade:
      <input type="number" name="capacidade"
        min="1" max="10000" required>
    </label><br><br>

    <label>Localização:
      <input name="localizacao" maxlength="100" required>
    </label><br><br>

    <button type="submit">Cadastrar</button>
  </form>

  <p><a href="/">Voltar ao início</a></p>
</body>
</html>`);
});

app.get('/cadastro-sala', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cadastro de Sala</title>
</head>
<body>
  <h1>Cadastro de Sala</h1>

  <form action="/salas" method="POST">
    <input type="hidden" name="_csrf" value="${res.locals.csrfToken}">

    <label>Código:
      <input name="codigo" maxlength="20" required>
    </label><br><br>

    <label>Nome:
      <input name="nome" maxlength="100" required>
    </label><br><br>

    <label>Capacidade:
      <input type="number" name="capacidade"
        min="1" max="10000" required>
    </label><br><br>

    <label>Localização:
      <input name="localizacao" maxlength="100" required>
    </label><br><br>

    <button type="submit">Cadastrar</button>
  </form>

  <p><a href="/">Voltar ao início</a></p>
</body>
</html>`);
});

app.use('/usuarios', usuariosRouter);
app.use('/laboratorios', laboratoriosRouter);
app.use('/salas', salasRouter);
app.use('/status', statusRouter);

// Rota inexistente
app.use((req, res) => {
  res.status(404).send('Página não encontrada.');
});

// Tratamento centralizado de erros
app.use((erro, req, res, next) => {
  if (erro.code === 'EBADCSRFTOKEN') {
    return res.status(403).send(
      'Formulário expirado ou inválido. Atualize a página e tente novamente.'
    );
  }

  console.error('Erro inesperado:', erro.message);

  if (res.headersSent) {
    return next(erro);
  }

  res.status(500).send('Ocorreu um erro interno.');
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
    console.error(
      'Não foi possível conectar ao banco:',
      erro.message
    );
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
  } catch {
    // A conexão pode não ter sido estabelecida.
  }

  process.exit(0);
}

process.once('SIGINT', encerrar);
process.once('SIGTERM', encerrar);

iniciarServidor();
