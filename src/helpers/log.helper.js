import fs from 'fs';
import path from 'path';

// Absolute path to fallback log file
const LOG_PATH = path.resolve('../logs/enrollment_fallback.log');

/**
 * Logs a failed DB write to a local log file, including timestamp and reason.
 */
export function logEnrollmentFailureToFile({ userid, courseid, months, error }) {
  const logLine = `[${new Date().toISOString()}] user_id=${userid}, course_id=${courseid}, months=${months}, error="${error}"\n`;

  fs.appendFile(LOG_PATH, logLine, (err) => {
    if (err) {
      console.error('🔥 FAILED TO LOG ENROLLMENT FAILURE TO FILE 🔥', err.message);
    }
  });
}
