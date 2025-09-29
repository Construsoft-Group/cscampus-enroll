import formidable from "formidable";
import pool from "../database.js";
import enrollmentGroups from "../config/courses.js"; // para añadir FULL como en CS
import { replaceSpecialChars } from "../config/specialChars.js";
import { sendInternalEmail, sendEnrollNotification } from "../config/sendMail.js";
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from "../config/moodle.js";

// Parámetros fijos del curso/página
const COURSE_ID = 251;
const GROUP_ID = 3949;
const COURSE_NAME = "CDE | Gestión y coordinación de proyectos BIM con Trimble Connect";
const COURSE_LINK = `https://campus.construsoft.com/course/view.php?id=${COURSE_ID}`;

export const customerEnrollmentReq_BIMTC = async (req, res) => {
  const now = new Date();
  const windowMs = 24 * 60 * 60_000; // 24h
  const since = new Date(now - windowMs);

  const formData = new formidable.IncomingForm();
  formData.parse(req, async (error, fields) => {
    if (error) {
      console.error('[BIMTC][FORM ERROR]', error);
      return res.status(400).send('Bad request');
    }

    // NOTA: sin 'courseName' (el curso es fijo)
    const { firstname, lastname, company, activity, email, phone, position, optradio } = fields;
    const promoValue = optradio ?? "off";

    const newUser = {
      course_Id: COURSE_ID,
      firstname,
      lastname,
      company,
      activity,
      email,
      phone,
      position,
      promoValue,
    };

    // Bloqueo 24h por email
    const recent = await pool.query(
      `SELECT * FROM customer_enrollment_request
       WHERE submitted_at BETWEEN ? AND ? AND email = ?`,
      [since.toISOString(), now.toISOString(), newUser.email]
    );

    if (recent.length > 0) {
      const dataResponse = {
        title: '¡Tienes una solicitud en curso!',
        message: 'Debes esperar al menos 24 horas para enviar una nueva solicitud',
        link: { url: 'https://www.construsoft.es/es/servicios/area-privada-tekla', text: 'Volver al área de clientes' }
      };
      return res.render('forms/form_response', dataResponse);
    }

    // Registrar solicitud
    await pool.query('INSERT INTO customer_enrollment_request SET ?', [newUser]);
    await sendInternalEmail(newUser, 'Formulario BIM Trimble Connect');

    // Fechas de matrícula (30 días como en CS)
    const startTs = Math.floor(now.getTime() / 1000);
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    const endTs = Math.floor(end.getTime() / 1000);

    // Buscar o crear usuario en Moodle
    const qUser = await queryMoodleUser(newUser.email);
    const existing = qUser?.data?.users ?? [];

    const mUser = {
      username: replaceSpecialChars((firstname || '').substring(0, 2) + (lastname || '').substring(0, 2) + '-' + now.getTime().toString().slice(-4)).toLowerCase(),
      firstname: replaceSpecialChars(firstname || ''),
      lastname: replaceSpecialChars(lastname || ''),
      company: replaceSpecialChars(company || ''),
      activity: replaceSpecialChars(activity || ''),
      email: replaceSpecialChars(email || ''),
      phone: replaceSpecialChars(phone || ''),
      course: COURSE_NAME,
      campus_id: 0,
    };

    let userId;
    if (existing.length) {
      userId = existing[0].id;
      mUser.campus_id = userId;
    } else {
      const created = await createMoodleUser(mUser);
      userId = created.data[0].id;
      mUser.campus_id = userId;

      // Guardar en all_users siguiendo convención CS (sin 'company')
      const mUserForDb = {
        username: mUser.username,
        firstname: mUser.firstname,
        lastname: mUser.lastname,
        institution: mUser.company,
        country: 'Company',
        role: 'Estudiante',
        email: mUser.email,
        phone: mUser.phone,
        course: COURSE_NAME,
        campus_id: mUser.campus_id,
      };
      await pool.query('INSERT INTO all_users SET ?', [mUserForDb]);
    }

    // Matricular en curso y añadir al grupo fijo
    await enrollMoodleuser(userId, COURSE_ID, startTs, endTs);
    await addUserToMoodleGroup(userId, GROUP_ID);

    // Registrar matrícula
    const newEnrollment = {
      course_id: COURSE_ID,
      user_email: newUser.email,
      role: 'Estudiante',
      course_group: GROUP_ID
    };
    await pool.query('INSERT INTO all_enrollments SET ?', [newEnrollment]);

    // Email de bienvenida (reutiliza plantilla genérica)
    sendEnrollNotification(mUser, { courseName: COURSE_NAME, courseLink: COURSE_LINK }, 'gen_mail_enrolled.ejs');

    // Respuesta tipo CS
    const dataResponse = {
      title: '¡Registro exitoso!',
      message: 'Hemos recibido tu solicitud. Enseguida recibirás un correo instructivo para acceder al campus Construsoft y empezar a estudiar',
      link: { url: 'https://campus.construsoft.com/login/index.php', text: 'Ir al campus' }
    };
    res.render('forms/form_response', dataResponse);
  });
};

export const renderCourseForm_BIMTC = async (_req, res) => {
  res.render('forms/bimtc/customer-enroll');
};