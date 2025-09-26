import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import ejs from 'ejs';
import enrollmentGroups from './courses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    host: 'cloud01.dowhilestudio.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_ACCOUNT,
        pass: process.env.MAIL_PASS,
    }
});

export const sendReceptionConfirmToUser = async (newUser) => {
    var htmlPath = path.resolve(__dirname, './email_templates/beca_mail_aspirante.ejs');
    
    const info = await transporter.sendMail({
        from: "'Campus Construsoft' <campus@construsoft.es>",
        to: newUser.email,
        subject: 'Postulación recibida',
        html: { path: htmlPath }
    });
    return info.messageId
}

export async function sendInternalEmail(newUser, formName) {
    var contentHTML = `
        <h1>Nuevo Registro del formulario ${formName}</h1>
        <ul>
        `;
        // Encontrar el nombre del curso basado en el courseId
        //const course = enrollmentGroups.find(course => course.courseId === newUser.course_Id);
        const course = enrollmentGroups.find(obj => obj.courseId === parseInt(newUser.course_Id));
        const courseName = course ? course.courseName : 'Curso Desconocido';

        // Iterar sobre las propiedades del objeto newUser
        Object.keys(newUser).forEach(key => {
            if (key === 'course_Id') {
                contentHTML += `<li>Curso: ${courseName}</li>`;
            } else {
                contentHTML += `<li>${key}: ${newUser[key]}</li>`;
            }
        });
        contentHTML += `
        </ul>
        `;

    const info = await transporter.sendMail({
        from: "'Campus Construsoft' <campus@construsoft.es>",
        to: ['vanessa.puentes@construsoft.com','marketing-es@construsoft.com', 'juan.diaz@construsoft.com'],
        subject: `Formulario ${formName}`,
        html: contentHTML
    });
    return info.messageId
}

export const sendEnrollNotification = (newUser, course, emailTemplate) => {
    var studentName = newUser.firstname;
    var courseName = course.courseName;
    var courseLink = course.courseLink;
    //console.log(studentName + " " + courseName +" "+ courseLink);
    ejs.renderFile(__dirname + `/email_templates/${emailTemplate}`, {studentName, courseName, courseLink} , (err, data) => {
        if (err) {
            console.log(err);
        } else {
            var mailOptions = {
            from: "'Campus Construsoft' <campus@construsoft.es>",
            to: newUser.email,
            subject: courseName,
            html: data
            };

            transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Enroll message sent: %s', info.messageId);
            });
        }
    });
}

export const sendEnrollNotificationMultiple = (userData, enrolledCourses, packName, matriculaDias, emailTemplate = 'gen_mail_enrolled_multiple.ejs') => {
    const studentName = userData.firstname;
    const totalCourses = enrolledCourses.length;

    ejs.renderFile(__dirname + `/email_templates/${emailTemplate}`, {
        studentName,
        enrolledCourses,
        packName,
        totalCourses,
        matriculaDias
    }, (err, data) => {
        if (err) {
            console.log('Error rendering multiple enrollment template:', err);
        } else {
            var mailOptions = {
                from: "'Campus Construsoft' <campus@construsoft.es>",
                to: userData.email,
                subject: `Matriculación exitosa - ${packName}`,
                html: data
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log('Error sending multiple enrollment email:', error);
                }
                console.log('Multiple enrollment message sent: %s', info.messageId);
            });
        }
    });
}

// config/sendMail.js  (añadir al final del archivo)
export const sendExtensionAppliedNotification = (payload) => {
  const {
    toEmail,          // correo del usuario
    studentName,      // nombre del usuario
    courseName,       // nombre del curso
    months,           // meses que se extendieron (ej: 2)
    remaining,        // extensiones restantes (0,1,2)
    courseLink,       // opcional
    template = 'enrollment_extension_applied.ejs', // nombre del .ejs
  } = payload;

  const remainingText = (remaining === 2)
    ? 'Te quedan máximo 2 extensiones.'
    : (remaining === 1)
      ? 'Te queda 1 extensión.'
      : (remaining === 0)
        ? 'No te quedan más extensiones.'
        : '';

  ejs.renderFile(
    __dirname + `/email_templates/${template}`,
    { studentName, courseName, months, remainingText, courseLink },
    (err, html) => {
      if (err) {
        console.error('[MAIL][EXTENSION][TPL ERROR]', err);
        return;
      }
      const mailOptions = {
        from: "'Campus Construsoft' <campus@construsoft.es>",
        to: toEmail,
        subject: `Extensión aplicada: ${courseName}`,
        html,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('[MAIL][EXTENSION][SEND ERROR]', error);
          return;
        }
        console.log('Extension message sent: %s', info.messageId);
      });
    }
  );
};
