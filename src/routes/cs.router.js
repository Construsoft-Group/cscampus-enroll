import express from "express";
import { newApplicant } from "../services/cs.service.js";

const router = express.Router();
router.use(express.json());
router.get('/formApplyCS', (req, res) => {res.render("forms/formApplyCS")});
router.post('/', newApplicant);

export default router;