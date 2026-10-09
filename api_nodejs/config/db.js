
import 'dotenv/config';
import sql from 'mssql';

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT !== 'false',
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  connectionTimeout: 15000,
  requestTimeout: 15000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise;

export function conectarBanco() {
  if (!poolPromise) {
    poolPromise = sql.connect(config).catch((erro) => {
      poolPromise = null;
      throw erro;
    });
  }

  return poolPromise;
}

export { sql };
