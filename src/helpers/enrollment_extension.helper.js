// helpers/enrollment_extension.helper.js
import pool from '../database.js';

/**
 * Cuenta el total de registros (solicitudes/ejecuciones) en enrollment_extension
 * para un par (usuario, curso).
 * @param {number|string} userId
 * @param {number|string} courseId
 * @returns {Promise<number>}
 */
export async function getExtensionCount(userId, courseId) {
  const rows = await pool.query(
    'SELECT COUNT(*) AS cnt FROM enrollment_extension WHERE user_id = ? AND course_id = ?',
    [userId, courseId]
  );
  const cnt = Array.isArray(rows) ? rows[0]?.cnt ?? 0 : rows?.[0]?.cnt ?? 0;
  return Number(cnt) || 0;
}

/**
 * Reglas de negocio:
 *  - 0 previas → EJECUTAR extensión, quedan 2.
 *  - 1 previa  → EJECUTAR extensión, queda 1.
 *  - 2 previas → EJECUTAR extensión, quedan 0.
 *  - 3+        → BLOQUEAR.
 * @param {number} currentCount
 * @returns {{action:'EXECUTE_AND_REGISTER'|'BLOCK', remaining:number}}
 */
export function decideExtensionAction(currentCount) {
  if (currentCount >= 3) {
    return { action: 'BLOCK', remaining: 0 };
  }
  // Para 0,1,2 → ejecutar
  const remainingMap = { 0: 2, 1: 1, 2: 0 };
  const remaining = remainingMap[currentCount] ?? 0;
  return { action: 'EXECUTE_AND_REGISTER', remaining };
}
