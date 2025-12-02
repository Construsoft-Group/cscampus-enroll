// src/routes/tc-certification.router.js
import express from "express";
import { customerEnrollmentReq_TCCertification, renderCourseForm_TCCertification } from "../services/tc-certification.service.js";

const router = express.Router();
router.use(express.json());

// Formulario TC Certification
router.post('/customer-enroll', customerEnrollmentReq_TCCertification);
router.get('/customer-enroll', renderCourseForm_TCCertification);

export default router;
