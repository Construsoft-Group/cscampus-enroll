// services/enrollment_extend.service.js
import {
  queryMoodleUser,
  isUserInCourseAnyStatus,
  getCourseNameById,
  getUserGroupNamesInCourse
} from '../config/moodle.js';
import { extendEnrollmentByUser } from './enrollment.service.js';
import { sendExtensionAppliedNotification } from '../config/sendMail.js';
import { getExtensionCount, decideExtensionAction } from '../helpers/enrollment_extension.helper.js';

export const renderExtendForm = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.render('forms/enrollment/enrollment_extend_form');
};

export const handleExtendRequest = async (req, res) => {
  try {
    const { email, courseid: courseidRaw, reason, newsletter } = req.body;

    // 1) Validaciones básicas
    if (!email || !courseidRaw || !reason) {
      return res.status(400).render('forms/form_response', {
        title: 'Faltan datos',
        message: 'Por favor completa todos los campos obligatorios.',
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    const courseid = Number.parseInt(courseidRaw, 10);
    if (!Number.isFinite(courseid)) {
      return res.status(400).render('forms/form_response', {
        title: 'Curso inválido',
        message: 'El identificador del curso no es válido.',
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    // 2) Buscar usuario por email en Moodle
    const moodleRes = await queryMoodleUser(email);
    const user = moodleRes?.data?.users?.[0];
    if (!user) {
      return res.status(404).render('forms/form_response', {
        title: 'Usuario no encontrado',
        message: `No se encontró un usuario en el Campus de Construsoft con el correo ${email}.`,
        link: { url: '/enrollment/extend-form', text: 'Intentar de nuevo' }
      });
    }

    // 3) Confirmar matrícula en el curso (activo o suspendido)
    const inThisCourseAnyStatus = await isUserInCourseAnyStatus(user.id, courseid);
    if (!inThisCourseAnyStatus) {
      return res.status(404).render('forms/form_response', {
        title: 'Usuario no matriculado en el curso',
        message: 'El usuario no está matriculado (ni activo, ni suspendido) en el curso solicitado.',
        link: { url: '/enrollment/extend-form', text: 'Intentar de nuevo' }
      });
    }

    // 3.1) Regla de grupos no elegibles
    const groupNames = await getUserGroupNamesInCourse(user.id, courseid);
    const forbidden = (name) => {
      if (!name) return false;
      const n = String(name).toLowerCase().trim();
      return n === 'fundae';
    };
    if (groupNames.some(forbidden)) {
      return res.status(403).render('forms/form_response', {
        title: 'Extensión no permitida',
        message: 'No es posible extender la matrícula porque tu usuario pertenece a un grupo no elegible. Si crees que es un error, por favor contáctanos a soporte.tekla@construsoft.com.',
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    // 4) Reglas de extensiones
    const currentCount = await getExtensionCount(user.id, courseid);
    const { action } = decideExtensionAction(currentCount);

    if (action === 'BLOCK') {
      return res.status(409).render('forms/form_response', {
        title: 'Límite de extensiones excedido',
        message: 'Has excedido el número de extensiones permitidas. No es posible procesar una nueva solicitud.',
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }
    // 5) Ejecutar extensión en Moodle y registrar en BD
    const months = 1; // período por defecto
    const result = await extendEnrollmentByUser({
      userid: user.id,
      courseid,
      reason,
      months,
      promoValue: newsletter,
    });

    if (result?.success === false || result?.status !== 'enrolled') {
      return res.status(500).render('forms/form_response', {
        title: 'Error al extender la matrícula',
        message: `Detalles: ${result?.error || 'No se pudo completar la operación, vuelve a intentarlo.'}`,
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    // 6) Mensaje de éxito
    const message = 'Por favor verifica el acceso a tu curso.';

    // 7) Envío de correo
    const courseName = await getCourseNameById(courseid);
    sendExtensionAppliedNotification({
      toEmail: email,
      studentName: user.firstname || 'Estudiante',
      courseName,
      months
    });

    // 8) Respuesta HTML al usuario
    return res.render('forms/form_response', {
      title: '¡Extensión aplicada!',
      message,
      link: { url: 'https://campus.construsoft.com/login/index.php', text: 'Ir al campus' }
    });

  } catch (err) {
    console.error('[EXTEND ERROR]', err);
    return res.status(500).render('forms/form_response', {
      title: 'Error del servidor',
      message: 'Ocurrió un problema al procesar tu solicitud. Intenta más tarde.',
      link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
    });
  }
};
