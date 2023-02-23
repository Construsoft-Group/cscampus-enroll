import express from "express";
import {newRecord, queryUserdb} from "../services/user.service.js";
import formidable from "formidable";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(express.json());
router.get('/form', (req, res) => {res.render("form")});
router.post('/', newRecord);
router.get('/list', queryUserdb);
router.post('/upload', (req, res) => {
    var formData = new formidable.IncomingForm();
	formData.parse(req, (error, fields, files) => {
        var extension = files.file.originalFilename.substr(files.file.originalFilename.lastIndexOf("."));
        var newPath = path.resolve(__dirname, '../uploads/TestFile'+ extension);
        fs.rename(files.file.filepath, newPath, function (errorRename) {
			res.send("File saved = " + newPath);
		});
    });
});

export default router;