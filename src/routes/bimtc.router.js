import express from "express";
import { customerEnrollmentReq_BIMTC, renderCourseForm_BIMTC } from "../services/bimtc.service.js";


const router = express.Router();
router.use(express.json());


// Rutas del nuevo formulario BIM Trimble Connect (idéntica lógica a CS)
router.post('/customer-enroll', customerEnrollmentReq_BIMTC);
router.get('/customer-enroll/', renderCourseForm_BIMTC);


export default router;