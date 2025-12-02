import express from "express";
import path from 'path';
import becaRouter from "./beca.router.js";
import csRouter from "./cs.router.js";
import tcRouter from "./tc.router.js";
import eudeRouter from "./eude.router.js";
import enrollmentRouter from './enrollment.route.js';
import enrollmentExtendRouter from './enrollment_extend.route.js';
import bimtcRouter from "./bimtc.router.js";
import isoRouter from "./iso.router.js";
import tcCertificationRouter from "./tc-certification.router.js";
import dbRouter from "./db.router.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

function routerApi(app) {
    app.get('/', (req, res) => {res.send('hello world')});
    app.use('/beca', becaRouter);
    app.use('/cs', csRouter);
    app.use('/tc', tcRouter);
    app.use('/eude', eudeRouter);
    app.use('/db', dbRouter);
    app.use('/enrollment', enrollmentRouter);
    app.use('/enrollment', enrollmentExtendRouter);
    app.use('/bimtc', bimtcRouter);
    app.use('/iso', isoRouter);
    app.use('/tc-certification', tcCertificationRouter);
}

export default routerApi;