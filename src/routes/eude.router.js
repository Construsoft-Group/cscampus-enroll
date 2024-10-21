import express from "express";
import { /* newJobApplicant ,*/ eudeEnrollmentReq, /* renderCourseForm */ } from "../services/eude.service.js";

const router = express.Router();
router.use(express.json());
/* Rutas de matriulaciones clientes */
router.post('/form', eudeEnrollmentReq)
/* router.get('/form', renderCourseForm); */
router.get('/form', (req, res) => {res.render("forms/eude/eude_form")});
router.get('/success', (req, res) => {res.render("forms/eude/eude_success")});
router.get('/not-success', (req, res) => {res.render("forms/eude/eude_not-success")});

/* Rutas de aspiraciones a cs job 
router.get('/applyCsJob', (req, res) => {res.render("forms/cs/bolsa_form")});
router.post('/applyCsJob', newJobApplicant); */

export default router;