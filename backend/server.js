const sql = require("mssql");
require("dotenv").config();

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

sql.connect(config)
    .then(() => {
        console.log("Conectado ao SQL Server!");
    })
    .catch((erro) => {
        console.error("Erro ao conectar:", erro);
    });
    const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ mensagem: "API funcionando!" });
});

app.listen(3000, () => {
    console.log("API rodando na porta 3000");
});