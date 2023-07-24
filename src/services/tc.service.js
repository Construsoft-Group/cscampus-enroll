import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js"
import enrollmentGroups from '../config/courses.js';

import { sendEmailToUser, sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from '../config/moodle.js';


export const newTcRecord = async (req, res, next) => {
    let fecha_now = new Date(); //Fecha Actual
    var mlSeconds = 24*60*60000;
    var newDateObj = new Date(fecha_now - mlSeconds);
    var formData = new formidable.IncomingForm();
        formData.parse(req, async (error, fields, files) => {
            const {firstname, lastname, email, country, phone, company, company_category, company_activity, position, promo} = fields;
            const promoValue = promo ?? "off";
            const newUser = {firstname, lastname, email, country, phone, company, company_category, company_activity, position, promoValue};
            console.log(newUser);

            var user = await pool.query(`SELECT * FROM tc_request WHERE submitted_at BETWEEN "${newDateObj.toISOString()}" AND "${fecha_now.toISOString()}" AND email = "${newUser.email}"`); //consultamos si existen solicitudes recientes en la base de datos, mínimo 24 hrs.
            console.log(user);
            
            if(user.length == 0)
            {
                await pool.query('INSERT INTO tc_request set ?', [newUser]);
                console.log("Nuevo registro TC exitoso" + newUser.email);
                //await sendEmailToUser(newUser);
                //await sendInternalEmail(newUser);
                /*
                var qUser = await queryMoodleUser(newUser.email);
                let response = qUser.data;
                console.log(response);

                 const mUser = { 
                    username: replaceSpecialChars(userjd[0].firstname.substring(0,2)+userjd[0].lastname.substring(0,2)+ "-" +fecha_now.getTime().toString().substring(9,13)).toLowerCase(), 
                    firstname: replaceSpecialChars(userjd[0].firstname), 
                    lastname: replaceSpecialChars(userjd[0].lastname), 
                    institution: replaceSpecialChars(userjd[0].institution), 
                    country: replaceSpecialChars(userjd[0].country),
                    role: replaceSpecialChars(userjd[0].role),
                    course: userjd[0].course, //Aqui no se hace el reemplazo, de lo contrario no se encuentra el curso para retornar su id en enrollmentgroups 
                    email: replaceSpecialChars(userjd[0].email), 
                    phone: replaceSpecialChars(userjd[0].phone),
                    campus_id: 0
                }; 
                
                if(response.users.length != 0){ //Cuando el usuario ya esta registrado entonces lo matricula y lo añade al curso.

                    var enrollment = await enrollMoodleuser(response.users[0].id, iC.courseId, iniEnrollment, endEnrollment);
                


                }else{ //Cuando el usuario no esta registrado entonces lo crea, lo matricula y lo agrega al grupo.
                    var newUserMoodle = await createMoodleUser(mUser);
                    console.log(newUserMoodle.data);
                    mUser.campus_id = newUserRes[0].id;
                    var enrollment = await enrollMoodleuser(newUserRes[0].id, iC.courseId, iniEnrollment, endEnrollment);
                    var addToGroup = await addUserToMoodleGroup(newUserRes[0].id, iG.groupId);
                }
                */


                res.redirect('/tc/success');
            }else{
                console.log("Debes esperar al menos 24 horas para enviar una nueva solicitud");
                res.redirect('/tc/not-success');
            }
            
        });
}