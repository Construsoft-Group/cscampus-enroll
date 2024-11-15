import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js"
import enrollmentGroups from '../config/courses.js';
import { replaceSpecialChars } from '../config/specialChars.js';

import { sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from '../config/moodle.js';
import { getSpAccessToken, createListItem } from '../config/sharepoint.js';

export const eudeEnrollmentReq = async (req, res, next) => {
    let fecha_now = new Date(); //Fecha Actual
    var mlSeconds = 24*60*60000;
    var newDateObj = new Date(fecha_now - mlSeconds);
    var groupName = 3480;
    /* var sitename = '5TRIMBLECONNECT'; //nombre del sharepoint
    var listname = 'Matriculaciones web'; //Nombre de la lista en SP */
    var formData = new formidable.IncomingForm();
        formData.parse(req, async (error, fields, files) => {
            const {firstname, lastname, company, email, phone, position, optradio} = fields;
            const promoValue = optradio ?? "off";
            const newUser = {firstname, lastname, company, email, phone, position, promoValue};

            var user = await pool.query(`SELECT * FROM eude_request WHERE submitted_at BETWEEN "${newDateObj.toISOString()}" AND "${fecha_now.toISOString()}" AND email = "${newUser.email}"`); //consultamos si existen solicitudes recientes en la base de datos, mínimo 24 hrs.
            if(user.length == 0)
            {
                await pool.query('INSERT INTO eude_request set ?', [newUser]);
                console.log("Nuevo registro Eude exitoso" + newUser.email);
                await sendInternalEmail(newUser, "Solicitud Curso Modelado de Estructuras con Tekla Structures - EUDE");

                var iC = enrollmentGroups.find(obj => obj.courseId === 240);
                var iG = iC.groups.find(obj => obj.id === groupName);
                
                var newEnrollment = {
                    course_id: iC.courseId,
                    user_email: newUser.email,
                    role: "Estudiante",
                    course_group: iG.groupId
                };

                var iniEnrollment = parseInt((fecha_now.getTime()/1000).toFixed(0));
                var timeEnd = new Date();
                timeEnd.setDate(fecha_now.getDate() + 30); // Aqui se configuran 30 dias de matricula
                var endEnrollment = parseInt((timeEnd.getTime()/1000).toFixed(0));

                var qUser = await queryMoodleUser(newUser.email);
                let response = qUser.data;

                const mUser = { 
                    username: replaceSpecialChars(newUser.firstname.substring(0,2)+newUser.lastname.substring(0,2)+ "-" +fecha_now.getTime().toString().substring(9,13)).toLowerCase(), 
                    firstname: replaceSpecialChars(newUser.firstname), 
                    lastname: replaceSpecialChars(newUser.lastname),
                    email: replaceSpecialChars(newUser.email),
                    phone: replaceSpecialChars(newUser.phone),
                    institution: replaceSpecialChars(newUser.company), 
                    role: replaceSpecialChars(newUser.position),
                    course: "Fundamentos Tekla Structures Hormigón EUDE", //Aqui no se hace el reemplazo, de lo contrario no se encuentra el curso para retornar su id en enrollmentgroups 
                    campus_id: 0
                }; 
                
                if(response.users.length != 0){ //Cuando el usuario ya esta registrado entonces lo matricula y lo añade al curso.
                    mUser.campus_id = response.users[0].id;
                    var enrollment = await enrollMoodleuser(response.users[0].id, iC.courseId, iniEnrollment, endEnrollment);
                    var addToGroup = await addUserToMoodleGroup(response.users[0].id, iG.groupId);
                    var insertEnrollDb = await pool.query('INSERT INTO all_enrollments set ?', [newEnrollment]);
                    sendEnrollNotification(mUser, iC,  'eude_mail_enrolled.ejs');
                    console.log("usuario matriculado " + mUser.email );
                    //console.log("usuario matriculado " + mUser.email + " sp status " + listItemResult.status);

                }else{ //Cuando el usuario no esta registrado entonces lo crea, lo matricula y lo agrega al grupo.
                    
                    var mUserMoodle = await createMoodleUser(mUser);
                    let newUserRes = mUserMoodle.data;
                    mUser.campus_id = newUserRes[0].id;
                    var enrollment = await enrollMoodleuser(newUserRes[0].id, iC.courseId, iniEnrollment, endEnrollment);
                    var addToGroup = await addUserToMoodleGroup(newUserRes[0].id, iG.groupId);

                    var insertEnrollDb = await pool.query('INSERT INTO all_enrollments set ?', [newEnrollment]);
                    var insertuserDb = await pool.query('INSERT INTO all_users set ?', [mUser]);

                    sendEnrollNotification(mUser, iC, 'eude_mail_enrolled.ejs'); //Se envía correo de notificación con para acceder al curso
                    console.log("usuario creado y matriculado " + mUser.email );
                    //console.log("usuario creado y matriculado " + mUser.email + " spStatus " + listItemResult.status);
                } 
                
                res.redirect('/eude/success');
            }else{
                console.log("Debes esperar al menos 24 horas para enviar una nueva solicitud");
                res.redirect('/eude/not-success');
            }
        });
}