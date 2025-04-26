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