import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js"
import enrollmentGroups from '../config/courses.js';
import { replaceSpecialChars } from '../config/specialChars.js';
import {sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from '../config/moodle.js';

/* export const newJobApplicant = async (req, res, next) => {
    formData.parse(req, async (error, fields, files) => {
        const {firstname, lastname, email, phone, interest, country, office, privacidad, promo } = fields;

        const newApplicant = {firstname, lastname, email, phone, interest, country, office, privacidad, promo};
        var user = await pool.query(`SELECT * FROM cs_job_application WHERE submitted_at BETWEEN "${newDateObj.toISOString()}" AND "${fecha_now.toISOString()}" AND email = "${newUser.email}"`);
        if(user.length == 0){
          await pool.query('INSERT INTO cs_job_application set ?', [newApplicant]);
          res.redirect('/eude/success');  
        }else{
          console.log("Debes esperar al menos 24 horas para enviar una nueva solicitud");
          res.redirect('/eude/not-success');
        }

    });
} */

export const eudeEnrollmentReq = async (req, res, next) => {
  let fecha_now = new Date(); //Fecha Actual
  var mlSeconds = 24*60*60000;
  var newDateObj = new Date(fecha_now - mlSeconds);
  var formData = new formidable.IncomingForm();
  formData.parse(req, async (error, fields, files) => {
    //console.log(fields);
    
    const { firstname, lastname, company, /* activity, */ email, phone, position, optradio} = fields;
    /* var course = enrollmentGroups.find(obj => obj.courseName === courseName); */
    //console.log(course);
    const promoValue = optradio ?? "off";
    const newUser = {/* course_Id : course.courseId, */ firstname, lastname, company, /* activity, */ email, phone, position, promoValue};
    console.log(newUser);
    var user = await pool.query(`SELECT * FROM eude_request WHERE submitted_at BETWEEN "${newDateObj.toISOString()}" AND "${fecha_now.toISOString()}" AND email = "${newUser.email}"`);
    console.log(user.length);
        
        if(user.length == 0)
        {
          var userCreated = await pool.query('INSERT INTO eude_request set ?', [newUser]);
          console.log(userCreated);
          /* await sendInternalEmail(newUser, "Formulario Eude"); */
          
          /* var iC = enrollmentGroups.find(obj => obj.courseId === parseInt(newUser.course_Id));
          console.log(iC);
          //var iC = enrollmentGroups.find(obj => obj.courseName === "Common Data Environment con Trimble Connect NUEVO");
          var groupName =  "PROGRAMA CLIENTES TEKLA 2024";
          var iG = iC.groups.find(obj => obj.groupName === groupName);
          console.log(groupName);

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
          let qUserData = qUser.data;

          const mUser = { 
            username: replaceSpecialChars(newUser.firstname.substring(0,2)+newUser.lastname.substring(0,2)+ "-" +fecha_now.getTime().toString().substring(9,13)).toLowerCase(), 
            firstname: replaceSpecialChars(newUser.firstname), 
            lastname: replaceSpecialChars(newUser.lastname),
            company: replaceSpecialChars(newUser.company),
            activity: replaceSpecialChars(newUser.activity),
            email: replaceSpecialChars(newUser.email),
            phone: replaceSpecialChars(newUser.phone),
            course: iC.courseName,
            campus_id: 0
          }; 

          if(qUserData.users.length != 0){ //Cuando el usuario ya esta registrado entonces lo matricula y lo añade al curso.
            mUser.campus_id = qUserData.users[0].id;
            var enrollment = await enrollMoodleuser(qUserData.users[0].id, iC.courseId, iniEnrollment, endEnrollment);
            var addToGroup = await addUserToMoodleGroup(qUserData.users[0].id, iG.groupId);
            var insertEnrollDb = await pool.query('INSERT INTO all_enrollments set ?', [newEnrollment]);
           
            sendEnrollNotification(mUser, iC,  'gen_mail_enrolled.ejs');
            console.log("usuario matriculado " + mUser.email );
            
          }else{ //Cuando el usuario no esta registrado entonces lo crea, lo matricula y lo agrega al grupo.
              
              var mUserMoodle = await createMoodleUser(mUser);
              let newUserRes = mUserMoodle.data;
              mUser.campus_id = newUserRes[0].id;
              var enrollment = await enrollMoodleuser(newUserRes[0].id, iC.courseId, iniEnrollment, endEnrollment);
              var addToGroup = await addUserToMoodleGroup(newUserRes[0].id, iG.groupId);

              var insertEnrollDb = await pool.query('INSERT INTO all_enrollments set ?', [newEnrollment]);
              const mUserWithoutCompany =  { 
                username: mUser.username, 
                firstname: mUser.firstname, 
                lastname: mUser.lastname,
                institution: mUser.company,
                country: "Company",
                role: "Estudiante",
                email: mUser.email,
                phone: mUser.phone,
                course: iC.courseName,
                campus_id: mUser.campus_id
              };; // Extraer el campo 'company' al crear un nuevo objeto sin ese campo
              var insertuserDb = await pool.query('INSERT INTO all_users set ?', [mUserWithoutCompany]);
               
              sendEnrollNotification(mUser, iC, 'gen_mail_enrolled.ejs'); //Se envía correo de notificación con para acceder al curso
              //console.log("usuario creado y matriculado " + mUser.email + " spStatus " + listItemResult.status);
              console.log("usuario creado y matriculado " + mUser.email);
          } */
            res.redirect('/eude/success');  
        }else{
            console.log("Debes esperar al menos 24 horas para enviar una nueva solicitud");
            res.redirect('/eude/not-success');
        }
        
  })

}

export const renderCourseForm = async (req, res, next) => {
  res.render("forms/eude/eude_form");

}