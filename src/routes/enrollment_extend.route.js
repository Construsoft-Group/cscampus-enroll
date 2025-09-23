import express from 'express';
import {
  renderExtendForm,
  handleExtendRequest
} from '../services/enrollment_extend.service.js';

const router = express.Router();

router.get('/extend-form', renderExtendForm);       // Renders the form
router.post('/extend-request', handleExtendRequest); // Handles form submission

export default router;
