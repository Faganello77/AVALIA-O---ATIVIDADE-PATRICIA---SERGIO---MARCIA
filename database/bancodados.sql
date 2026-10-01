-- CRIACAO DO SCHEMA
CREATE SCHEMA reserva;
GO

-- TABELA USUARIO
CREATE TABLE reserva.USUARIO (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    data_nascimento DATE NOT NULL,
    celular VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    login VARCHAR(50) NOT NULL,
    senha VARCHAR(100) NOT NULL,
    data_cadastro DATETIME NOT NULL,
    data_acesso DATETIME NULL
);
GO

-- TABELA LABORATORIO
CREATE TABLE reserva.LABORATORIO (
    id_laboratorio INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    capacidade INT NOT NULL,
    localizacao VARCHAR(100) NOT NULL
);
GO

-- TABELA SALA
CREATE TABLE reserva.SALA (
    id_sala INT IDENTITY(1,1) PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    capacidade INT NOT NULL,
    localizacao VARCHAR(100) NOT NULL
);
GO

-- TABELA STATUS
CREATE TABLE reserva.STATUS (
    id_status INT IDENTITY(1,1) PRIMARY KEY,
    nome VARCHAR(50) NOT NULL
);
GO

-- INSERINDO OS STATUS
INSERT INTO reserva.STATUS (nome)
VALUES
('Livre'),
('Ocupado'),
('Bloqueado'),
('Reservado');
GO

-- TABELA RESERVA
CREATE TABLE reserva.RESERVA (
    id_reserva INT IDENTITY(1,1) PRIMARY KEY,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,

    id_usuario INT NOT NULL,
    id_status INT NOT NULL,
    id_laboratorio INT NULL,
    id_sala INT NULL,

    CONSTRAINT FK_RESERVA_USUARIO
        FOREIGN KEY (id_usuario)
        REFERENCES reserva.USUARIO(id_usuario),

    CONSTRAINT FK_RESERVA_STATUS
        FOREIGN KEY (id_status)
        REFERENCES reserva.STATUS(id_status),

    CONSTRAINT FK_RESERVA_LABORATORIO
        FOREIGN KEY (id_laboratorio)
        REFERENCES reserva.LABORATORIO(id_laboratorio),

    CONSTRAINT FK_RESERVA_SALA
        FOREIGN KEY (id_sala)
        REFERENCES reserva.SALA(id_sala)
);
GO
