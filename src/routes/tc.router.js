import express from "express";
import { newTcRecord } from "../services/tc.service.js";

const router = express.Router();
router.use(express.json());
router.get('/form', (req, res) => {res.render("forms/formTc")});
router.post('/', newTcRecord);

export default router;