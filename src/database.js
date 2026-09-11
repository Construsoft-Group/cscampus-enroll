import mysql from "mysql2";
import { database }  from './config.js';
import { promisify } from 'util';

// The original hosting (Hostinger MariaDB) ran without STRICT_TRANS_TABLES, so the
// application relies on implicit defaults for NOT NULL columns it does not fill in
// (e.g. beca_request.status = ''). JawsDB ships strict mode on by default, which turns
// those INSERTs into ER_NO_DEFAULT_FOR_FIELD. We cannot change the global mode on a
// shared plan, so we set the legacy mode on every pooled connection instead.
const LEGACY_SQL_MODE = 'IGNORE_SPACE,NO_ENGINE_SUBSTITUTION';

const pool = mysql.createPool(database);

pool.on('connection', (connection) => {
    connection.query(`SET SESSION sql_mode = '${LEGACY_SQL_MODE}'`, (err) => {
        if (err) console.error('Could not set session sql_mode:', err.message);
    });
});

pool.getConnection((err, connection) => {
    if (err) {
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.');
      }
      if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has to many connections');
      }
      if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused');
      }
    }
  
    if (connection) connection.release();
    console.log('DB is Connected');
  
    return;
});
  
// Promisify Pool Querys
pool.query = promisify(pool.query);
  
  //module.exports = pool;

export default pool;
