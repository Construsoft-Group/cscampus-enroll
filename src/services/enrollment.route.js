import express from "express";
import { extendUserEnrollment } from "./enrollment.service.js";

const router = express.Router();
router.use(express.json());

router.post('/extend', async (req, res) => {
  try {
    const { userid, courseid, months } = req.body;

    if (!userid || !courseid || !months) {
      return res.status(400).json({ error: 'Missing required fields: userid, courseid, months' });
    }

    const result = await extendUserEnrollment({ userid, courseid, months });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Enrollment extension error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to extend enrollment' });
  }
});

export default router;