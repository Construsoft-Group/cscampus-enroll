import pool from "../database.js";
import enrollmentGroups from '../config/courses.js';

export const bulkCourses = async (req, res, next) => {
    // 1) Preparamos mapas para cursos y grupos únicos
  const coursesMap = new Map();
  const groupsMap  = new Map();
  const rels       = [];

  for (const c of enrollmentGroups) {
    // escapamos apostrofes
    const courseName = c.courseName.replace(/'/g, "\\'");
    const courseLink = c.courseLink.replace(/'/g, "\\'");
    coursesMap.set(c.courseId, { id: c.courseId, name: courseName, link: courseLink });

    for (const g of c.groups) {
      const groupName = g.groupName.replace(/'/g, "\\'");
      groupsMap.set(g.groupId, { id: g.groupId, name: groupName });
      rels.push({ courseId: c.courseId, groupId: g.groupId });
    }
  }

  console.log(coursesMap + "/n" + groupsMap + "/n" + rels);
  

  // 2) Construir las cadenas VALUES
  const courseValues = [...coursesMap.values()]
    .map(c => `(${c.id}, '${c.name}', '${c.link}')`)
    .join(',\n');

  const groupValues = [...groupsMap.values()]
    .map(g => `(${g.id}, '${g.name}')`)
    .join(',\n');

  const relValues = rels
    .map(r => `(${r.courseId}, ${r.groupId})`)
    .join(',\n');

  // 3) Ejecutar los tres queries
  const sqlCourses = `
    INSERT INTO courses (course_id, course_name, course_link)
    VALUES
    ${courseValues}
    ON DUPLICATE KEY UPDATE
      course_name = VALUES(course_name),
      course_link = VALUES(course_link);
  `;
  await pool.query(sqlCourses);

  const sqlGroups = `
    INSERT INTO courses_groups_all (group_id, group_name)
    VALUES
    ${groupValues}
    ON DUPLICATE KEY UPDATE
      group_name = VALUES(group_name);
  `;
  await pool.query(sqlGroups);

  const sqlRels = `
    INSERT INTO course_groups (course_id, group_id)
    VALUES
    ${relValues}
    ON DUPLICATE KEY UPDATE
      course_id = VALUES(course_id);
  `;
  await pool.query(sqlRels);

  console.log('📦 Migración de cursos y grupos completada.');

}


export const listCourses = async (req, res, next) => {
try {
    const sql = `
        SELECT
        c.course_id   AS courseId,
        c.course_name AS courseName,
        c.course_link AS courseLink,
        cg.group_id   AS groupId,
        g.group_name  AS groupName
        FROM courses   AS c
        JOIN course_groups AS cg ON c.course_id = cg.course_id
        JOIN courses_groups_all    AS g ON g.group_id = cg.group_id
        ORDER BY c.course_name, g.group_name;
    `;
    const rows = await pool.query(sql);

    // Agrupamos por curso
    const courses = [];
    let curr = null;
    for (const r of rows) {
        if (!curr || curr.courseId !== r.courseId) {
        curr = {
            courseId:   r.courseId,
            courseName: r.courseName,
            courseLink: r.courseLink,
            groups:     []
        };
        courses.push(curr);
        }
        curr.groups.push({
        groupId:   r.groupId,
        groupName: r.groupName
        });
    }

    res.locals.courses = courses; // Guardamos los datos en res.locals
    next(); // Pasamos al siguiente middleware
    }
    catch(err) {
    next(err);
    }
}

export const newGroup = async (req, res, next) => {
    const { courseId } = req.params;
    const { groupId, groupName } = req.body;  // Ahora recibimos el groupId del usuario
  
    try {
      // 1. Verificamos si ya existe un grupo con el ID proporcionado
      const [existingGroup] = await pool.query(
        'SELECT * FROM groups WHERE group_id = ?',
        [groupId]
      );
  
      if (existingGroup.length > 0) {
        // Si el grupo ya existe, redirigimos con un mensaje de error
        return res.status(400).send('El ID del grupo ya existe. Por favor, elige otro ID.');
      }
  
      // 2. Insertamos el nuevo grupo en la base de datos
      await pool.query(
        'INSERT INTO groups (group_id, group_name) VALUES (?, ?)',
        [groupId, groupName]
      );
  
      // 3. Asociamos el grupo al curso
      await pool.query(
        'INSERT INTO course_groups (course_id, group_id) VALUES (?, ?)',
        [courseId, groupId]
      );
  
      // 4. Redirigimos al usuario a la página de cursos
      res.redirect('/courses');
  
    } catch (err) {
      next(err);
    }
}
