// helpers/captcha.helper.js
import axios from 'axios';

export async function verifyCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({ secret, response: token })
    );
    // Devuelve todo (success, score si v3, error-codes, etc.)
    return response.data;
  } catch (err) {
    console.error('[CAPTCHA ERROR]', err.message);
    return { success: false, 'error-codes': ['internal-error'] };
  }
}
