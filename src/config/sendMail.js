import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import ejs from 'ejs';

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

export const sendEmailToUser = async (newUser) => {
    var htmlPath = path.resolve(__dirname, './email_templates/beca_mail_aspirante.html');
    
    const info = await transporter.sendMail({
        from: "'Campus Construsoft' <campus@construsoft.es>",
        to: newUser.email,
        subject: 'Postulación recibida',
        html: { path: htmlPath }
    });
    return info.messageId
}

export const sendInternalEmail = async (newUser) => {
    var contentHTML = `
        <h1>Nuevo Registro de Beca</h1>
        <ul>
            <li>Email: ${newUser.email}</li>
            <li>País: ${newUser.country}</li>
            <li>Role: ${newUser.role}</li>
            <li>Curso: ${newUser.course}</li>
            <li>Phone: ${newUser.phone}</li>
        </ul>
    `;

    const info = await transporter.sendMail({
        from: "'Campus Construsoft' <campus@construsoft.es>",
        to: ['vanessa.puentes@construsoft.com','marketing-es@construsoft.com', 'juan.diaz@construsoft.com'],
        subject: 'Formulario becas',
        html: contentHTML
    });
    return info.messageId
}

export const sendEnrollNotification = (newUser, course) => {
    var studentName = newUser.firstname;
    var courseName = course.courseName;
    var courseLink = course.courseLink;
    //console.log(studentName + " " + courseName +" "+ courseLink);
    ejs.renderFile(__dirname + '/email_templates/beca_mail_enrolled.ejs', {studentName, courseName, courseLink} , (err, data) => {
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