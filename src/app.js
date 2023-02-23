import express from "express";
import expressLayouts from "express-ejs-layouts";
import { dirname, join } from "path";
import { fileURLToPath } from 'url';
import routerApi from "./routes/index.js";
import cron from 'node-cron';
import {job} from './job.js';

import { PORT } from "./config.js";

//Initializations
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

// Schedule tasks to be run on the server.
cron.schedule('* * * * *', async () => {await job();});

//settings
app.set('port', PORT);
const __filename = fileURLToPath(import.meta.url);

//Middlewaress
app.use(express.urlencoded({extended:false}));

//Global variables

// routes
routerApi(app);

//Static files
//app.set(express.static(path.join(__dirname, '/public')));
app.use(express.static(__dirname + '/public'));

//Plantillas
app.use(expressLayouts)
//app.set('layout', './layouts/layout')
app.set('view engine', 'ejs')
app.set("views", __dirname + '/views');

export default app;