import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const sendEmailToUser = async (newUser) => {
    var htmlPath = path.resolve(__dirname, './email_templates/mail1_aspirante.html');
    const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
            user: 'notificacion@strusite.com',
            pass: process.env.MAIL_PASS,
        }
    });

    const info = await transporter.sendMail({
        from: "'Server Strusite' <notificacion@strusite.com >",
        to: newUser.email,
        subject: 'Formulario becas',
        html: { path: htmlPath }
    });
    return info.messageId
}

export const sendInternalEmail = async (newUser) => {
    var contentHTML = `
        <h1>Nuevo Registro de Beca</h1>
        <ul>
            <li>Usuario: ${newUser.username}</li>
            <li>Email: ${newUser.email}</li>
            <li>País: ${newUser.counrty}</li>
            <li>Role: ${newUser.role}</li>
            <li>Curso: ${newUser.course}</li>
            <li>Phone: ${newUser.phone}</li>
        </ul>
    `;

    const transporter = nodemailer.createTransport({
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        auth: {
            user: 'notificacion@strusite.com',
            pass: process.env.MAIL_PASS,
        }
    });

    const info = await transporter.sendMail({
        from: "'Server Strusite' <notificacion@strusite.com >",
        to: ['juan.diaz@construsoft.com','juafdiazdam@gmail.com'],
        subject: 'Formulario becas',
        html: contentHTML
    });
    return info.messageId
}