// gerar chave screta: node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
import 'dotenv/config';
import express from 'express';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { csrfSync } from 'csrf-sync';

const app = express();
const porta = Number(process.env.PORTA || 3000);

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('Configure SESSION_SECRET no arquivo .env.');
}

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT !== 'false',
        trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
    }
};

app.disable('x-powered-by');
app.use(helmet());
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

const { csrfSynchronisedProtection, generateToken } = csrfSync();

app.use((req, res, next) => {
    res.locals.csrfToken = generateToken(req);
    next();
});

app.use(csrfSynchronisedProtection);

const limiteGeral = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false
});

app.use(limiteGeral);

let poolPromise;

function conectaBD() {
    if (!poolPromise) {
        poolPromise = sql.connect(config).catch((erro) => {
            poolPromise = null;
            throw erro;
        });
    }

    return poolPromise;
}

app.get('/', (req, res) => {
    res.json({
        mensagem: 'API do Sistema de Reserva funcionando!'
    });
});

app.get('/status', async (req, res) => {
    try {
        const banco = await conectaBD();
        const resultado = await banco.request().query(`
            SELECT id_status, nome
            FROM reserva.STATUS
            ORDER BY id_status
        `);

        res.json(resultado.recordset);
    } catch (erro) {
        console.error('Erro ao consultar status:', erro.message);
        res.status(500).json({
            mensagem: 'Erro ao consultar o banco de dados.'
        });
    }
});

app.listen(porta, () => {
    console.log('API funcionando!');
    console.log(`Servidor: http://localhost:${porta}`);
});



