import 'dotenv/config';
import express from 'express';
import sql from 'mssql';

const app = express();

const porta = process.env.PORTA;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// conexão com banco

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function conectaBD() {
    return await sql.connect(config);
}

// inicio

app.get('/', (req, res) => {
    res.send(`
        <h1>Sistema de Reserva</h1>
        <h2>Cadastros</h2>
        <a href="/cadastro">Cadastrar Usuário</a><br><br>
        <a href="/cadastro-laboratorio">Cadastrar Laboratório</a><br><br>
        <a href="/cadastro-sala">Cadastrar Sala</a><br><br>
        <h2>Consultas</h2>
        <a href="/usuarios">Ver Usuários</a><br><br>
        <a href="/laboratorios">Ver Laboratórios</a><br><br>
        <a href="/salas">Ver Salas</a><br><br>
        <a href="/status">Ver Status</a>
    `);
});


// USUARIOS



// tela de cadastro

app.get('/cadastro', (req, res) => {
    res.send(`
        <h1>Cadastro de Usuário</h1>

        <form action="/usuarios" method="POST">

            <label>CPF:</label><br>
            <input type="text" name="cpf" required><br><br>

            <label>Nome:</label><br>
            <input type="text" name="nome" required><br><br>

            <label>Data de nascimento:</label><br>
            <input type="date" name="data_nascimento" required><br><br>

            <label>Celular:</label><br>
            <input type="text" name="celular" required><br><br>

            <label>Email:</label><br>
            <input type="email" name="email" required><br><br>

            <label>Login:</label><br>
            <input type="text" name="login" required><br><br>

            <label>Senha:</label><br>
            <input type="password" name="senha" required><br><br>

            <button type="submit">Cadastrar</button>

        </form>

        <br>

        <a href="/">Voltar</a>
    `);
});


// cadastrar usuario

app.post('/usuarios', async (req, res) => {

    try {

        const conexao = await conectaBD();

        const request = conexao.request();

        request.input('cpf', sql.VarChar(14), req.body.cpf);
        request.input('nome', sql.VarChar(100), req.body.nome);
        request.input('data_nascimento', sql.Date, req.body.data_nascimento);
        request.input('celular', sql.VarChar(20), req.body.celular);
        request.input('email', sql.VarChar(100), req.body.email);
        request.input('login', sql.VarChar(50), req.body.login);
        request.input('senha', sql.VarChar(100), req.body.senha);

        await request.query(`
            INSERT INTO reserva.USUARIO
            (
                cpf,
                nome,
                data_nascimento,
                celular,
                email,
                login,
                senha,
                data_cadastro
            )
            VALUES
            (
                @cpf,
                @nome,
                @data_nascimento,
                @celular,
                @email,
                @login,
                @senha,
                GETDATE()
            )
        `);

        res.send(`
            <h1>Usuário cadastrado com sucesso!</h1>
            <a href="/cadastro">Cadastrar outro usuário</a><br><br>
            <a href="/usuarios">Ver usuários</a><br><br>
            <a href="/">Voltar para o início</a>
        `);

    } catch (erro) {

        console.error(erro);

        res.status(500).send(`
            <h1>Erro ao cadastrar usuário</h1>

            <p>Verifique os dados informados.</p>

            <a href="/cadastro">Voltar</a>
        `);
    }
});


// ver usuarios

app.get('/usuarios', async (req, res) => {

    try {

        const conexao = await conectaBD();

        const result = await conexao.query(`
            SELECT *
            FROM reserva.USUARIO
        `);

        res.json(result.recordset);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao buscar usuários'
        });
    }
});

// LABORATORIOS

// tela de cadastro

app.get('/cadastro-laboratorio', (req, res) => {

    res.send(`
        <h1>Cadastro de Laboratório</h1>

        <form action="/laboratorios" method="POST">

            <label>Código:</label><br>
            <input type="text" name="codigo" required><br><br>

            <label>Nome:</label><br>
            <input type="text" name="nome" required><br><br>

            <label>Capacidade:</label><br>
            <input type="number" name="capacidade" required><br><br>

            <label>Localização:</label><br>
            <input type="text" name="localizacao" required><br><br>

            <button type="submit">Cadastrar</button>

        </form>
        <br>
        <a href="/">Voltar</a>
    `);
});

// cadastrar laboratorio

app.post('/laboratorios', async (req, res) => {

    try {

        const conexao = await conectaBD();

        const request = conexao.request();

        request.input('codigo', sql.VarChar(20), req.body.codigo);
        request.input('nome', sql.VarChar(100), req.body.nome);
        request.input('capacidade', sql.Int, req.body.capacidade);
        request.input('localizacao', sql.VarChar(100), req.body.localizacao);

        await request.query(`
            INSERT INTO reserva.LABORATORIO
            (
                codigo,
                nome,
                capacidade,
                localizacao
            )
            VALUES
            (
                @codigo,
                @nome,
                @capacidade,
                @localizacao
            )
        `);

        res.send(`
            <h1>Laboratório cadastrado com sucesso!</h1>
            <a href="/cadastro-laboratorio">Cadastrar outro laboratório</a><br><br>
            <a href="/laboratorios">Ver laboratórios</a><br><br>
            <a href="/">Voltar para o início</a>
        `);

    } catch (erro) {

        console.error(erro);

        res.status(500).send(`
            <h1>Erro ao cadastrar laboratório</h1>
            <a href="/cadastro-laboratorio">Voltar</a>
        `);
    }
});

// ver laboratorios

app.get('/laboratorios', async (req, res) => {

    try {

        const conexao = await conectaBD();

        const result = await conexao.query(`
            SELECT *
            FROM reserva.LABORATORIO
        `);

        res.json(result.recordset);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao buscar laboratórios'
        });
    }
});


// SALAS

// tela de cadastro

app.get('/cadastro-sala', (req, res) => {

    res.send(`
        <h1>Cadastro de Sala</h1>

        <form action="/salas" method="POST">

            <label>Código:</label><br>
            <input type="text" name="codigo" required><br><br>

            <label>Nome:</label><br>
            <input type="text" name="nome" required><br><br>

            <label>Capacidade:</label><br>
            <input type="number" name="capacidade" required><br><br>

            <label>Localização:</label><br>
            <input type="text" name="localizacao" required><br><br>

            <button type="submit">Cadastrar</button>

        </form>

        <br>

        <a href="/">Voltar</a>
    `);
});

// cadastrar sala

app.post('/salas', async (req, res) => {

    try {

        const conexao = await conectaBD();

        const request = conexao.request();

        request.input('codigo', sql.VarChar(20), req.body.codigo);
        request.input('nome', sql.VarChar(100), req.body.nome);
        request.input('capacidade', sql.Int, req.body.capacidade);
        request.input('localizacao', sql.VarChar(100), req.body.localizacao);

        await request.query(`
            INSERT INTO reserva.SALA
            (
                codigo,
                nome,
                capacidade,
                localizacao
            )
            VALUES
            (
                @codigo,
                @nome,
                @capacidade,
                @localizacao
            )
        `);

        res.send(`
            <h1>Sala cadastrada com sucesso!</h1>
            <a href="/cadastro-sala">Cadastrar outra sala</a><br><br>
            <a href="/salas">Ver salas</a><br><br>
            <a href="/">Voltar para o início</a>
        `);

    } catch (erro) {

        console.error(erro);

        res.status(500).send(`
            <h1>Erro ao cadastrar sala</h1>

            <a href="/cadastro-sala">Voltar</a>
        `);
    }
});

// ver salas

app.get('/salas', async (req, res) => {

    try {

        const conexao = await conectaBD();

        const result = await conexao.query(`
            SELECT *
            FROM reserva.SALA
        `);

        res.json(result.recordset);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao buscar salas'
        });
    }
});


// STATUS

app.get('/status', async (req, res) => {

    try {

        const conexao = await conectaBD();

        const result = await conexao.query(`
            SELECT *
            FROM reserva.STATUS
        `);

        res.json(result.recordset);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao buscar status'
        });
    }
});

// servidor

app.listen(porta, () => {

    console.log(`API funcionando!`);
    console.log(`Servidor rodando em: http://localhost:${porta}`);

});
