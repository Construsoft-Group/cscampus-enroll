import express from "express";
import path from 'path';
import becaRouter from "./beca.router.js";
import csRouter from "./cs.router.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

function routerApi(app) {
    app.get('/', (req, res) => {res.send('hello world')});
    app.use('/user', becaRouter);
    app.use('/cs', csRouter);
}



export default routerApi;