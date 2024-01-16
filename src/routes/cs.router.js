import express from "express";
import { newJobApplicant, customerEnrollmentReq, renderCourseForm } from "../services/cs.service.js";

const router = express.Router();
router.use(express.json());
/* Rutas de matriulaciones clientes */
router.post('/customer-enroll', customerEnrollmentReq)
router.get('/customer-enroll/:courseId', renderCourseForm);
router.get('/customer-enroll/success', (req, res) => {res.render("forms/cs/cs_success")});
router.get('/customer-enroll/not-success', (req, res) => {res.render("forms/cs/cs_not-success")});

/* Rutas de aspiraciones a cs job */
router.get('/applyCsJob', (req, res) => {res.render("forms/cs/bolsa_form")});
router.post('/applyCsJob', newJobApplicant);

export default router;