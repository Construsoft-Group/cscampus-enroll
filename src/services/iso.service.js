// src/services/iso.service.js
import formidable from "formidable";
import pool from "../database.js";
import { replaceSpecialChars } from "../config/specialChars.js";
import { sendInternalEmail, sendEnrollNotification } from "../config/sendMail.js";
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from "../config/moodle.js";

// === CONFIGURACIÓN CURSO ISO 19650 ===
const COURSE_ID = 259;
const COURSE_NAME = "Cómo cumplir la norma ISO 19650 con Trimble Connect";
const COURSE_LINK = `https://campus.construsoft.com/course/view.php?id=${COURSE_ID}`;
const GROUP_ID = 3987; // FULL25

export const customerEnrollmentReq_ISO = async (req, res) => {
  const now = new Date();
  const formData = new formidable.IncomingForm();

  formData.parse(req, async (error, fields) => {
    if (error) {
      console.error('[ISO19650][FORM ERROR]', error);
      return res.status(400).send('Bad request');
    }

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

    // === Verificación duplicados ===
    const recent = await pool.query(
      `SELECT * FROM customer_enrollment_request
       WHERE course_id = ? AND email = ?`,
      [COURSE_ID, newUser.email]
    );
    if (recent.length > 0) {
      const dataResponse = {
        title: '¡Ya habías solicitado acceso al curso anteriormente!',
        message: 'Revisa tu correo electrónico para acceder al Campus Construsoft.',
        link: { url: COURSE_LINK, text: 'Accede al Campus' }
      };
      return res.render('forms/form_response_redirect', dataResponse);
    }

    // === Guardar solicitud ===
    await pool.query('INSERT INTO customer_enrollment_request SET ?', [newUser]);
    await sendInternalEmail(newUser, 'Formulario ISO 19650 | Trimble Connect');

    // === Fechas de matrícula (30 días) ===
    const startTs = Math.floor(now.getTime() / 1000);
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    const endTs = Math.floor(end.getTime() / 1000);

    // === Moodle user (buscar/crear) ===
    const qUser = await queryMoodleUser(newUser.email);
    const existing = qUser?.data?.users ?? [];

    const mUser = {
      username: replaceSpecialChars(
        (firstname || '').substring(0, 2) + (lastname || '').substring(0, 2) + '-' + now.getTime().toString().slice(-4)
      ).toLowerCase(),
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

    // === Matricular y agregar al grupo FULL25 ===
    await enrollMoodleuser(userId, COURSE_ID, startTs, endTs);
    await addUserToMoodleGroup(userId, GROUP_ID);

    // === Registrar matrícula en la BD ===
    const newEnrollment = {
      course_id: COURSE_ID,
      user_email: newUser.email,
      role: 'Estudiante',
      course_group: GROUP_ID
    };
    await pool.query('INSERT INTO all_enrollments SET ?', [newEnrollment]);

    // === Enviar correo de confirmación ===
    sendEnrollNotification(
      mUser,
      { courseName: COURSE_NAME, courseLink: COURSE_LINK },
      'gen_mail_enrolled.ejs'
    );

    // === Render respuesta ===
    const dataResponse = {
      title: '¡Gracias por registrarte!',
      message: 'Estás a un paso de dominar ISO 19650 con Trimble Connect.',
      link: {
        url: 'https://www.construsoft.es/es/curso-gratis-iso-19650/gracias-por-tu-solicitud',
        text: 'Accede ahora al curso'
      }
    };
    res.render('forms/form_response_redirect', dataResponse);
  });
};

export const renderCourseForm_ISO = async (_req, res) => {
  res.render('forms/iso/customer-enroll');
};
