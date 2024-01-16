import express from "express";
import { newTcRecord } from "../services/tc.service.js";

const router = express.Router();
router.use(express.json());
router.post('/', newTcRecord);
router.get('/form', (req, res) => {res.render("forms/tc/tc_form")});
router.get('/success', (req, res) => {res.render("forms/tc/tc_success")});
router.get('/not-success', (req, res) => {res.render("forms/tc/tc_not-success")});

export default router;