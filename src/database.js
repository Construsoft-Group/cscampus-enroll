import mysql from "mysql";
import { database }  from './config.js';
import { promisify } from 'util';

const pool = mysql.createPool(database);
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