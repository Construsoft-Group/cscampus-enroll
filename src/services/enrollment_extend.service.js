// services/enrollment_extend.service.js
import { queryMoodleUser, getCoursesByUser } from '../config/moodle.js';
import { extendEnrollmentByUser } from './enrollment.service.js';

export const renderExtendForm = (req, res) => {
  // Evita cacheos raros del navegador
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  // Usa la ruta de vistas que tengas configurada con app.set('views', ...)
  res.render('forms/enrollment/enrollment_extend_form');
};

export const handleExtendRequest = async (req, res) => {
  try {
    const { email, courseid: courseidRaw, reason } = req.body;

    // Validaciones básicas
    if (!email || !courseidRaw || !reason) {
      return res.status(400).render('forms/form_response', {
        title: 'Faltan datos',
        message: 'Por favor completa todos los campos obligatorios.',
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    // Normaliza courseid (string -> number) para comparar contra Moodle
    const courseid = Number.parseInt(courseidRaw, 10);
    if (!Number.isFinite(courseid)) {
      return res.status(400).render('forms/form_response', {
        title: 'Curso inválido',
        message: 'El identificador del curso no es válido.',
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    // Buscar usuario por email en Moodle
    const moodleRes = await queryMoodleUser(email);
    const user = moodleRes?.data?.users?.[0];

    if (!user) {
      return res.status(404).render('forms/form_response', {
        title: 'Usuario no encontrado',
        message: `No se encontró un usuario en Moodle con el correo ${email}.`,
        link: { url: '/enrollment/extend-form', text: 'Intentar de nuevo' }
      });
    }

    // Cursos del usuario y verificación de matrícula
    const courses = await getCoursesByUser(user.id);

    // Si Moodle devolvió un objeto de error: { exception, errorcode, message }
    if (courses && typeof courses === 'object' && !Array.isArray(courses) &&
        ('exception' in courses || 'errorcode' in courses)) {
      console.error('[MOODLE ERROR getCoursesByUser]', courses);
      return res.status(401).render('forms/form_response', {
        title: 'Error de acceso a Moodle',
        message: `No fue posible consultar los cursos del usuario. Detalle: ${courses.message || 'Acceso denegado.'}`,
        link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
      });
    }

    const list = Array.isArray(courses) ? courses : [];
    const enrolled = list.some(c => Number(c.id) === courseid);

    if (!enrolled) {
      return res.status(404).render('forms/form_response', {
        title: 'Usuario no matriculado en el curso',
        message: `El usuario no está matriculado en el curso con ID ${courseid}.`,
        link: { url: '/enrollment/extend-form', text: 'Intentar de nuevo' }
      });
    }

    // Ejecutar extensión de matrícula
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

    // OK
    res.setHeader('Cache-Control', 'no-store');
    return res.render('forms/form_response', {
      title: '¡Solicitud procesada!',
      message: 'Tu matrícula ha sido extendida exitosamente.',
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
