import express from "express";
import {newRecord, fileTest, queryUserdb} from "../services/beca.service.js";
import formidable from "formidable";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(express.json());
router.post('/', newRecord);
router.get('/form', (req, res) => {res.render("forms/beca/beca_form")});

/*Aquí algunas rutas de test */
router.get('/formTest', (req, res) => {res.render("forms/beca/formTest")});
router.get('/list', queryUserdb);
router.post('/upload', fileTest);

export default router;