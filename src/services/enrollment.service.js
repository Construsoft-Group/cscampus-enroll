import { extendEnrollment } from '../config/moodle.js';
import pool from '../database.js';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.resolve('logs/enrollment_fallback.log');

/**
 * Extiende la matrícula de un usuario en un curso de Moodle y registra la operación en la base de datos.
 * @param {number} userid - ID del usuario en Moodle
 * @param {number} courseid - ID del curso en Moodle
 * @param {number} months - Número de meses de extensión (el servicio llamante usa 1 por defecto)
 * @param {string} reason - Razón proporcionada por el usuario
 * @param {string} promoValue - Valor del código promocional (opcional)
 * @returns {{ success: boolean, status?: string, error?: string }}
 */
export async function extendEnrollmentByUser({ userid, courseid, months, reason, promoValue }) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(now.getMonth() + parseInt(months));
  const timeend = Math.floor(endDate.getTime() / 1000);

  try {
    const moodleRes = await extendEnrollment({ userid, courseid, timeend });
    const data = moodleRes.data;

    if (data && data.exception) {
      return {
        success: false,
        error: `[MOODLE ERROR] ${data.message} (${data.errorcode})`
      };
    }

    try {
      await pool.query(
        `INSERT INTO enrollment_extension (user_id, course_id, extended_by, created_at, reason, promo_value)
         VALUES (?, ?, ?, NOW(), ?, ?)`,
        [userid, courseid, months, reason, promoValue || "off"]
      );
    } catch (dbError) {
      const logLine = `[${new Date().toISOString()}] user_id=${userid}, course_id=${courseid}, months=${months}, error="${dbError.message}"\n`;
      fs.appendFileSync(LOG_FILE, logLine);
      console.warn('⚠️ DB write failed. Logged to fallback file.');

      return {
        success: false,
        error: `[DB ERROR] ${dbError.message}`
      };
    }

    return { success: true, status: 'enrolled' };

  } catch (err) {
    return {
      success: false,
      error: `[MOODLE API ERROR] ${err.message}`
    };
  }
}
