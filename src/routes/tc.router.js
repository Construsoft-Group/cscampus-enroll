import express from "express";
import { newTcRecord } from "../services/tc.service.js";

const router = express.Router();
router.use(express.json());
router.get('/form', (req, res) => {res.render("forms/tc_form")});
router.get('/success', (req, res) => {res.render("forms/tc_success")});
router.get('/not-success', (req, res) => {res.render("forms/tc_not-success")});
router.post('/', newTcRecord);

export default router;