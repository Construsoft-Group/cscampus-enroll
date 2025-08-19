// services/enrollment_extend.service.js
import { queryMoodleUser } from '../config/moodle.js';
import { extendEnrollmentByUser } from './enrollment.service.js';

/**
 * Renders the public enrollment extension form.
 */
export const renderExtendForm = (req, res) => {
  res.render('../views/forms/enrollment/enrollment_extend_form'); // this is your EJS view
};

/**
 * Handles the form submission.
 * - Finds user by email
 * - Calls existing backend service to extend enrollment
 */
export const handleExtendRequest = async (req, res) => {
  const { email, courseid, reason } = req.body;
  const months = 2; // default extension period

  if (!email || !courseid || !reason) {
    return res.status(400).render('forms/form_response', {
      title: 'Faltan datos',
      message: 'Por favor completa todos los campos obligatorios.',
      link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
    });
  }

  try {
    const moodleRes = await queryMoodleUser(email);
    const user = moodleRes?.data?.users?.[0];

    if (!user) {
      return res.status(404).render('forms/form_response', {
        title: 'Usuario no encontrado',
        message: `No se encontró un usuario en Moodle con el correo ${email}.`,
        link: { url: '/enrollment/extend-form', text: 'Intentar de nuevo' }
      });
    }

    // Call the actual logic that writes to Moodle and DB
    const result = await extendEnrollmentByUser({
        userid: user.id,
        courseid,
        reason,
        months
    });


    if (result.success === false || result.status !== 'enrolled') {
        return res.status(500).render('forms/form_response', {
            title: 'Error al extender la matrícula',
            message: `Detalles: ${result?.error || 'No se pudo completar la operación.'}`,
            link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
        });
    }

    return res.render('forms/form_response', {
        title: '¡Solicitud procesada!',
        message: 'Tu matrícula ha sido extendida exitosamente.',
        link: { url: '/enrollment/extend-form', text: 'Extender otra matrícula' }
    });

  } catch (err) {
    console.error('[EXTEND ERROR]', err.message);
    return res.status(500).render('forms/form_response', {
      title: 'Error del servidor',
      message: 'Ocurrió un problema al procesar tu solicitud. Intenta más tarde.',
      link: { url: '/enrollment/extend-form', text: 'Volver al formulario' }
    });
  }
};
