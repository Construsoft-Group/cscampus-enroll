import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js"
import enrollmentGroups from '../config/courses.js';
import { replaceSpecialChars } from '../config/specialChars.js';
import {sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from '../config/moodle.js';
import { getSpAccessToken, sendFileToSp, createListItem } from '../config/sharepoint.js';

export const newJobApplicant = async (req, res, next) => {
    formData.parse(req, async (error, fields, files) => {
        const {firstname, lastname, email, phone, interest, country, office, privacidad, promo } = fields;
        var filename = email +"-"+ files.file.originalFilename;
        const file = files.file;
        /* Se comenta esta parte hasta resolver problema con Sharepoint
        fs.readFile(file.filepath, async (err, data) => { //Se lee el archivo desde temp y se inserta el buffer como data en sharepoint.
            var spAccessToken = await getSpAccessToken();
            var uploadSpFile = await sendFileToSp(data, filename, spAccessToken.data.access_token);
          });
        */
        const newApplicant = {firstname, lastname, email, phone, interest, country, office, privacidad, promo};
        var user = await pool.query(`SELECT * FROM cs_job_application WHERE submitted_at BETWEEN "${newDateObj.toISOString()}" AND "${fecha_now.toISOString()}" AND email = "${newUser.email}"`);
        if(user.length == 0){
          await pool.query('INSERT INTO cs_job_application set ?', [newApplicant]);
          res.redirect('/cs/success');  
        }else{
          console.log("Debes esperar al menos 24 horas para enviar una nueva solicitud");
          res.redirect('/cs/not-success');
        }

    });
}

export const customerEnrollmentReq = async (req, res, next) => {
  let fecha_now = new Date(); //Fecha Actual
  var mlSeconds = 24*60*60000;
  var newDateObj = new Date(fecha_now - mlSeconds);
  var formData = new formidable.IncomingForm();
  formData.parse(req, async (error, fields, files) => {
    //console.log(fields);
    
    const {courseName, firstname, lastname, company, activity, email, phone, position, optradio} = fields;
    var course = enrollmentGroups.find(obj => obj.courseName === courseName);
    //console.log(course);
    const promoValue = optradio ?? "off";
    const newUser = {course_Id : course.courseId, firstname, lastname, company, activity, email, phone, position, promoValue};
    console.log(newUser);
    var user = await pool.query(`SELECT * FROM customer_enrollment_request WHERE submitted_at BETWEEN "${newDateObj.toISOString()}" AND "${fecha_now.toISOString()}" AND email = "${newUser.email}"`);
    console.log(user.length);
        
        if(user.length == 0)
        {
          var userCreated = await pool.query('INSERT INTO customer_enrollment_request set ?', [newUser]);
          console.log(userCreated);
          await sendInternalEmail(newUser, "Formulario clientes Tekla");
      
          /* Se comenta esta parte hasta resolver problema con Sharepoint
          let data = {"__metadata": {"type": "SP.Data.Matriculaciones_x0020_webListItem"},
            "Title": filename,
            "Nombres": newUser.firstname,
            "Apellidos": newUser.lastname,
            "Instituci_x00f3_n": newUser.institution,
            "Pais": newUser.country,
            "curso": newUser.course,
            "phone":newUser.phone,
            "email": newUser.email
          }

          var listItemResult = await createListItem(spAccessToken.data.access_token, data, sitename, listname);
          
          console.log("Nuevo registro exitoso" + newUser.email + " sp status " + listItemResult.status);
          */
          
          var iC = enrollmentGroups.find(obj => obj.courseId === parseInt(newUser.course_Id));
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
            
            /* Se comenta esta parte hasta resolver problema con Sharepoint
            var spAccessToken = await getSpAccessToken();
            let data = {
                "__metadata": {"type": "SP.Data.Matriculaciones_x0020_webListItem"},
                "Title": mUser.campus_id.toString(),
                "Nombres": newUser.firstname,
                "Apellidos": newUser.lastname,
                "Email": newUser.email,
                "Topic": "(Topic) 33 - Acceso curso gratis Trimble Connect",
                "Product": "Timble Connect",
                "Segment": newUser.company_activity,
                "Phone": newUser.phone,
                "Owner": owner
            }
            
            var listItemResult = await createListItem(spAccessToken.data.access_token, data, sitename, listname);
            console.log("usuario matriculado " + mUser.email + " sp status " + listItemResult.status);
            */
           
            sendEnrollNotification(mUser, iC,  'gen_mail_enrolled.ejs');
            console.log("usuario matriculado " + mUser.email );
            
          }else{ //Cuando el usuario no esta registrado entonces lo crea, lo matricula y lo agrega al grupo.
              
              var mUserMoodle = await createMoodleUser(mUser);
              let newUserRes = mUserMoodle.data;
              mUser.campus_id = newUserRes[0].id;
              var enrollment = await enrollMoodleuser(newUserRes[0].id, iC.courseId, iniEnrollment, endEnrollment);
              var addToGroup = await addUserToMoodleGroup(newUserRes[0].id, iG.groupId);

              var insertEnrollDb = await pool.query('INSERT INTO all_enrollments set ?', [newEnrollment]);
              // Extraer el campo 'company' al crear un nuevo objeto sin ese campo
              
              const mUserWithoutCompany = (({ company, ...rest }) => rest)(mUser);
              var insertuserDb = await pool.query('INSERT INTO all_users set ?', [mUserWithoutCompany]);
              
              /*  Se comenta esta parte hasta resolver problema con Sharepoint
              var spAccessToken = await getSpAccessToken();
              let data = {
                  "__metadata": {"type": "SP.Data.Matriculaciones_x0020_webListItem"},
                  "Title": mUser.campus_id.toString(),
                  "Nombres": newUser.firstname,
                  "Apellidos": newUser.lastname,
                  "Email": newUser.email,
                  "Topic": "(Topic) 33 - Acceso curso gratis Trimble Connect",
                  "Product": "Timble Connect",
                  "Segment": newUser.company_activity,
                  "Phone": newUser.phone,
                  "Owner": owner
              }
              var listItemResult  = await createListItem(spAccessToken.data.access_token, data, sitename, listname);
              */

              
              sendEnrollNotification(mUser, iC, 'gen_mail_enrolled.ejs'); //Se envía correo de notificación con para acceder al curso
              console.log("usuario creado y matriculado " + mUser.email + " spStatus " + listItemResult.status);
          }
            res.redirect('/cs/customer-enroll/success');  
        }else{
            console.log("Debes esperar al menos 24 horas para enviar una nueva solicitud");
            res.redirect('/cs/customer-enroll/not-success');
        }
        
  })

}

export const renderCourseForm = async (req, res, next) => {
  res.render("forms/cs/customer-enroll");
  /*
  const { courseId } = req.params;
  var courseDetails = enrollmentGroups.find(obj => obj.courseId === parseInt(courseId));
  res.render("forms/cs/customer-enroll", {courseId: courseDetails.courseId, courseName: courseDetails.courseName})
  */
}