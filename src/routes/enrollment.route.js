import express from "express";
import { extendEnrollmentByUserAndGroup } from "../services/enrollment.service.js";

const router = express.Router();
router.use(express.json());

router.post('/extend', async (req, res) => {
  try {
    const { userid, groupid, courseid, months } = req.body;

    if (!userid || !groupid || !courseid || !months) {
      return res.status(400).json({ error: 'userid, groupid, courseid, and months are required' });
    }

    const result = await extendEnrollmentByUserAndGroup({ userid, groupid, courseid, months });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Error extending enrollment:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to extend enrollment' });
  }
});

export default router;