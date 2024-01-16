import express from "express";
import { newJobApplicant, customerEnrollmentReq, renderCourseForm } from "../services/cs.service.js";

const router = express.Router();
router.use(express.json());
router.get('/customer-enroll/:courseId', renderCourseForm);
router.post('/customer-enroll', customerEnrollmentReq)
router.get('/applyCsJob', (req, res) => {res.render("forms/bolsa_form")});
router.post('/applyCsJob', newJobApplicant);

export default router;