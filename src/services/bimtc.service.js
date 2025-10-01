// services/bimtc.service.js (or controllers/bimtc.js)
import formidable from "formidable";
import pool from "../database.js";
import { replaceSpecialChars } from "../config/specialChars.js";
import { sendInternalEmail, sendEnrollNotification } from "../config/sendMail.js";
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from "../config/moodle.js";

const COURSE_ID = 251;
const GROUP_ID = 3949;
const COURSE_NAME = "CDE | Gestión y coordinación de proyectos BIM con Trimble Connect";
const COURSE_LINK = `https://campus.construsoft.com/course/view.php?id=${COURSE_ID}`;
const THANKYOU_URL = "https://www.construsoft.es/es/curso-gratis-cde/gracias-por-tu-solicitud";

export const customerEnrollmentReq_BIMTC = async (req, res) => {
  const now = new Date();
  const formData = new formidable.IncomingForm();

  formData.parse(req, async (error, fields) => {
    if (error) {
      console.error("[BIMTC][FORM ERROR]", error);
      return res.status(400).render("forms/form_response_redirect", {
        title: "Solicitud inválida",
        message: "Hubo un problema con el envío del formulario. Por favor, intenta nuevamente.",
        success: false
      });
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

    try {
      // ¿Solicitud previa?
      const recent = await pool.query(
        `SELECT * FROM customer_enrollment_request
         WHERE course_id = ? AND email = ?`,
        [COURSE_ID, newUser.email]
      );

      if (Array.isArray(recent) && recent.length > 0) {
        return res.render("forms/form_response_redirect", {
          title: "¡Ya habías solicitado acceso al curso anteriormente!",
          message: "Revisa tu correo electrónico para acceder al Campus Construsoft.",
          link: { url: COURSE_LINK, text: "Accede al Campus" },
          success: false
        });
      }

      // Registrar solicitud y notificar
      await pool.query("INSERT INTO customer_enrollment_request SET ?", [newUser]);
      await sendInternalEmail(newUser, "Formulario BIM Trimble Connect");

      // Ventana de matrícula (30 días)
      const startTs = Math.floor(now.getTime() / 1000);
      const end = new Date(now);
      end.setDate(end.getDate() + 30);
      const endTs = Math.floor(end.getTime() / 1000);

      // Buscar o crear usuario en Moodle
      const qUser = await queryMoodleUser(newUser.email);
      const existing = qUser?.data?.users ?? [];

      const mUser = {
        username: replaceSpecialChars(
          (firstname || "").substring(0, 2) +
          (lastname || "").substring(0, 2) + "-" +
          now.getTime().toString().slice(-4)
        ).toLowerCase(),
        firstname: replaceSpecialChars(firstname || ""),
        lastname: replaceSpecialChars(lastname || ""),
        company: replaceSpecialChars(company || ""),
        activity: replaceSpecialChars(activity || ""),
        email: replaceSpecialChars(email || ""),
        phone: replaceSpecialChars(phone || ""),
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
          country: "Company",
          role: "Estudiante",
          email: mUser.email,
          phone: mUser.phone,
          course: COURSE_NAME,
          campus_id: mUser.campus_id,
        };
        await pool.query("INSERT INTO all_users SET ?", [mUserForDb]);
      }

      // Matricular y agregar a grupo
      await enrollMoodleuser(userId, COURSE_ID, startTs, endTs);
      await addUserToMoodleGroup(userId, GROUP_ID);

      // Registrar matrícula
      await pool.query("INSERT INTO all_enrollments SET ?", [{
        course_id: COURSE_ID,
        user_email: newUser.email,
        role: "Estudiante",
        course_group: GROUP_ID,
      }]);

      // Email de bienvenida
      sendEnrollNotification(mUser, { courseName: COURSE_NAME, courseLink: COURSE_LINK }, "gen_mail_enrolled.ejs");

      // Respuesta de éxito → el iframe avisará al parent para abrir la nueva pestaña
      return res.render("forms/form_response_redirect", {
        title: "¡Registro exitoso!",
        message: "",
        link: { url: THANKYOU_URL, text: "Finalizar solicitud" },
        success: true
      });

    } catch (err) {
      console.error("[BIMTC][ERROR]", err);
      return res.status(500).render("forms/form_response_redirect", {
        title: "Ocurrió un error",
        message: "No pudimos completar tu solicitud en este momento. Intenta nuevamente más tarde.",
        success: false
      });
    }
  });
};

export const renderCourseForm_BIMTC = async (_req, res) => {
  res.render("forms/bimtc/customer-enroll");
};
