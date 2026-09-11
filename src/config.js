import * as dotenv from 'dotenv';
import path from 'path'
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Database connection settings.
 *
 * Priority:
 *  1. A connection URL injected by the Heroku add-on (JawsDB Maria/MySQL) or a
 *     generic DATABASE_URL, formatted as mysql://user:pass@host:port/database
 *  2. The discrete DB_HOST / DB_PORT / DB_USER / DB_PASS / DB_NAME variables
 *     (local development, docker-compose, legacy hosting).
 */
const parseDatabaseUrl = (url) => {
    const u = new URL(url);
    return {
        host: u.hostname,
        port: Number(u.port) || 3306,
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace(/^\//, '')
    };
};

const databaseUrl = process.env.JAWSDB_MARIA_URL || process.env.JAWSDB_URL || process.env.DATABASE_URL;

const connection = databaseUrl
    ? parseDatabaseUrl(databaseUrl)
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    };

export const database =  {
    connectionLimit: 10,
    ...connection
}
export const PORT = process.env.PORT || 4000;
