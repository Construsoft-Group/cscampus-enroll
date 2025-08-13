import { extendEnrollment } from '../config/moodle.js';
import pool from '../database.js';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.resolve('logs/enrollment_fallback.log');

/**
 * Extends a Moodle user's enrollment in a course.
 * @param {number} userid - Moodle user ID
 * @param {number} courseid - Moodle course ID
 * @param {number} months - Months to extend
 * @returns {{ status: string }} if successful
 * @throws if Moodle fails
 */
export async function extendEnrollmentByUser({ userid, courseid, months }) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(now.getMonth() + parseInt(months));
  const timeend = Math.floor(endDate.getTime() / 1000);

  let moodleRes;
  try {
    moodleRes = await extendEnrollment({ userid, courseid, timeend });
  } catch (err) {
    throw new Error(`[MOODLE API ERROR] ${err.message}`);
  }

  const data = moodleRes.data;

  if (data && data.exception) {
    throw new Error(`[MOODLE ERROR] ${data.message} (${data.errorcode})`);
  }

  try {
    await pool.query(
      'INSERT INTO enrollment_extension (user_id, course_id, extended_by, created_at) VALUES (?, ?, ?, NOW())',
      [userid, courseid, months]
    );
  } catch (err) {
    const logLine = `[${new Date().toISOString()}] user_id=${userid}, course_id=${courseid}, months=${months}, error="${err.message}"\n`;
    fs.appendFileSync(LOG_FILE, logLine);
    console.warn('⚠️ Failed to insert DB record, logged to fallback file');
  }

  return { status: 'enrolled' };
}
