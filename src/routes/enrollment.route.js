import express from "express";
import { extendEnrollmentByUser } from "../services/enrollment.service.js";

const router = express.Router();
router.use(express.json());

router.post('/extend', async (req, res) => {
  try {
    const { userid, courseid, months } = req.body;

    if (!userid || !courseid || !months) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const result = await extendEnrollmentByUser({ userid, courseid, months });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Error extending enrollment:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extend enrollment'
    });
  }
});

export default router;