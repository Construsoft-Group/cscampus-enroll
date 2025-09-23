// services/enrollment_extend.service.js
import { queryMoodleUser, isUserInCourseAnyStatus, getCourseNameById } from '../config/moodle.js';
import { extendEnrollmentByUser } from './enrollment.service.js';
import { sendExtensionAppliedNotification } from '../config/sendMail.js';
import { getExtensionCount, decideExtensionAction } from '../helpers/enrollment_extension.helper.js';

export const renderExtendForm = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.render('forms/enrollment/enrollment_extend_form');
};

export const handleExtendRequest = async (req, res) => {
  try {
    const { email, courseid: courseidRaw, reason } = req.body;

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
        message: `El usuario no está matriculado (ni activo ni suspendido) en el curso con ID ${courseid}.`,
        link: { url: '/enrollment/extend-form', text: 'Intentar de nuevo' }
      });
    }

    // 4) Reglas de extensiones (conteo desde BD)
    const currentCount = await getExtensionCount(user.id, courseid);
    const { action, remaining } = decideExtensionAction(currentCount);

    if (action === 'BLOCK') {
      return res.status(409).render('forms/form_response', {
        title: 'Límite de extensiones excedido',
        message: 'Has excedido el número de extensiones permitidas (3). No es posible procesar una nueva solicitud.',
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    // 5) Ejecutar extensión en Moodle y registrar en BD (lo hace enrollment.service.js)
    const months = 2; // período por defecto
    const result = await extendEnrollmentByUser({
      userid: user.id,
      courseid,
      reason,
      months
    });

    if (result?.success === false || result?.status !== 'enrolled') {
      return res.status(500).render('forms/form_response', {
        title: 'Error al extender la matrícula',
        message: `Detalles: ${result?.error || 'No se pudo completar la operación.'}`,
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    // 6) Mensaje de éxito según las extensiones restantes
    const msgMap = {
      2: 'Extensión ejecutada correctamente. Te quedan máximo 2 extensiones.',
      1: 'Extensión ejecutada correctamente. Te queda 1 extensión.',
      0: 'Extensión ejecutada correctamente. No te quedan más extensiones.'
    };
    const message = msgMap[remaining] ?? 'Extensión ejecutada correctamente.';

    // 7) Envío de correo
    // Obtener el nombre real del curso desde Moodle
    const courseName = await getCourseNameById(courseid);

    sendExtensionAppliedNotification({
      toEmail: email,
      studentName: user.firstname || 'Estudiante',
      courseName,
      months,
      remaining
      // courseLink: (opcional, si lo tuvieras)
    });

    // 8) Respuesta HTML al usuario
    return res.render('forms/form_response', {
      title: '¡Extensión aplicada!',
      message,
      link: { url: '/enrollment/extend-form', text: 'Extender otra matrícula' }
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
