// src/routes/iso.router.js
import express from "express";
import { customerEnrollmentReq_ISO, renderCourseForm_ISO } from "../services/iso.service.js";

const router = express.Router();
router.use(express.json());

// Formulario ISO 19650 con Trimble Connect
router.post('/customer-enroll', customerEnrollmentReq_ISO);
router.get('/customer-enroll', renderCourseForm_ISO);

export default router;
