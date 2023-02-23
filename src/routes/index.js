import express from "express";
import path from 'path';
import userRouter from "./user.router.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

function routerApi(app) {
    app.get('/', (req, res) => {res.send('hello world')});
    app.use('/user', userRouter);
}



export default routerApi;