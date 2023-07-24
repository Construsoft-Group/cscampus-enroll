import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js"
import enrollmentGroups from '../config/courses.js';
import { sendEmailToUser, sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from '../config/moodle.js';
import { getSpAccessToken, sendFileToSp } from '../config/sharepoint.js';

export const newRecord = async (req, res, next) => {
  let fecha_now = new Date(); //Fecha Actual
  var mlSeconds = 24*60*60000;
  var newDateObj = new Date(fecha_now - mlSeconds);
  var formData = new formidable.IncomingForm();
	formData.parse(req, async (error, fields, files) => {
        const {firstname, lastname, institution, country, role, course, email, phone} = fields;
        var filename = email +"-"+ files.file.originalFilename;
        const file = files.file;
        fs.readFile(file.filepath, async (err, data) => { //Se lee el archivo desde temp y se inserta el buffer como data en sharepoint.
            var spAccessToken = await getSpAccessToken();
            var uploadSpFile = await sendFileToSp(data, filename, spAccessToken.data.access_token);
          });
        const newUser = {firstname, lastname, institution, country, role, course, email, phone};
        //consultamos si existen solicitudes recientes en la base de datos, mínimo 24 hrs.
        var user = await pool.query(`SELECT * FROM request WHERE submitted_at BETWEEN "${newDateObj.toISOString()}" AND "${fecha_now.toISOString()}" AND email = "${newUser.email}"`);
        //console.log(user);
        if(user.length == 0)
        {
            await pool.query('INSERT INTO request set ?', [newUser]);
            console.log("Nuevo registro exitoso" + newUser.email);
            await sendEmailToUser(newUser);
            await sendInternalEmail(newUser);
            res.redirect('/beca/success');
        }else{
            console.log("Debes esperar al menos 24 horas para enviar una nueva solicitud");
            res.redirect('/beca/not-success');
        }
    });
}

export const enroller = async () => {
    let fecha_now = new Date(); //Fecha Actual
    var mlSeconds = 24*60*60000;
    var newDateObj = new Date(fecha_now - mlSeconds);
    var groupName = "";
    var userjd = await pool.query(`SELECT * FROM request WHERE submitted_at BETWEEN "2023-01-01 00:00:00" AND "${newDateObj.toISOString()}" AND status = ""`);
    //console.log(userjd);
    const replaceSpecialChars = (str) => {
      const specialChars = { "ñ": "n" };
      const accents = {
        á: "a",
        é: "e",
        í: "i",
        ó: "o",
        ú: "u",
        Á: "A",
        É: "E",
        Í: "I",
        Ó: "O",
        Ú: "U"
      };
      return str.replace(/[ñáéíóúÁÉÍÓÚ]/g, (match) => specialChars[match] || accents[match] || match);
    };
    if(userjd.length!=0){
        //const usernamestr = userjd[0].firstname.substring(0,2)+userjd[0].lastname.substring(0,2)+ "-" +fecha_now.getTime().toString().substring(9,13);
        //const username = usernamestr.toLowerCase();
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
        //console.log(mUser);
        var qUser = await queryMoodleUser(mUser.email); // consultamos este usuario en el moodle
        //var data = qUser.data.split("<hr>"); //Esta linea es necesaria cuando es campus Strusite (Test)
        //let response = JSON.parse(data[2]); //Esta linea es necesaria cuando es campus Strusite (Test)
        let response = qUser.data;
        console.log(response);
        //console.log(response.users.length);
        var iC = enrollmentGroups.find(obj => obj.courseName === mUser.course);
        if(mUser.role == "Estudiante"){
            groupName = "PROGRAMA ESTUDIANTES 2023";
        } else {
            groupName = "PROGRAMA PROFESORES 2023";
        }
        var iG = iC.groups.find(obj => obj.groupName === groupName);
        var newEnrollment = {
            course_id: iC.courseId,
            user_email: mUser.email,
            role: mUser.role,
            course_group: iG.groupId
        }
        //console.log(newEnrollment);

        var iniEnrollment = parseInt((fecha_now.getTime()/1000).toFixed(0));
        var timeEnd = new Date();
        timeEnd.setDate(fecha_now.getDate() + 60);
        var endEnrollment = parseInt((timeEnd.getTime()/1000).toFixed(0));
        if(response.users.length != 0){ //Cuando el usuario ya esta registrado entonces lo matricula y lo añade al curso.
            var enrollment = await enrollMoodleuser(response.users[0].id, iC.courseId, iniEnrollment, endEnrollment);
            console.log(enrollment);
            var addToGroup = await addUserToMoodleGroup(response.users[0].id, iG.groupId);
            //console.log(addToGroup);
            var insertEnrollDb = await pool.query('INSERT INTO enrollments set ?', [newEnrollment]);
            //console.log(insertEnrollDb);
            var updateReqDb = await pool.query(`UPDATE request SET status = "enrolled" WHERE id_ext="${userjd[0].id_ext}"`);
            sendEnrollNotification(mUser, iC);
            return "usuario matriculado " + mUser.email;
        }
        else //Cuando el usuario no esta registrado entonces lo crea, lo matricula y lo agrega al grupo.
        {  
            var newUser = await createMoodleUser(mUser);
            console.log(newUser.data);
            //var newUserData = newUser.data.split("<hr>"); //Esta linea es necesaria cuando es canpus Strusite (Test)
            //let newUserRes = JSON.parse(newUserData[2]); //Esta linea es necesaria cuando es canpus Strusite (Test)
            let newUserRes = newUser.data;
            mUser.campus_id = newUserRes[0].id;
            var enrollment = await enrollMoodleuser(newUserRes[0].id, iC.courseId, iniEnrollment, endEnrollment);
            var addToGroup = await addUserToMoodleGroup(newUserRes[0].id, iG.groupId);
            var insertuserDb = await pool.query('INSERT INTO users set ?', [mUser]);
            var insertEnrollDb = await pool.query('INSERT INTO enrollments set ?', [newEnrollment]);
            var updateReqDb = await pool.query(`UPDATE request SET status = "created + enrolled" WHERE email="${mUser.email}"`);
            sendEnrollNotification(mUser, iC); //Se envía correo de notificación con para acceder al curso
            return "usuario creado y matriculado " + mUser.email;
        }
    }else{
        return "No hay usuarios nuevos";
    }
}

//A continuación son funciones de testing-->

export const fileTest = async(req, res, next) => {
  var mUser = { 
      username: 'username', 
      firstname: 'Camila', 
      lastname: 'Ocampo', 
      institution: 'userjd[0].institution', 
      country: 'userjd[0].country',
      role: 'userjd[0].role',
      course: 'Análisis y diseño de edificaciones con Tekla Structural Designer', 
      email: 'juan.diaz@construsoft.com', 
      phone: 'userjd[0].phone',
      campus_id: 0
  };
  var iC = enrollmentGroups.find(obj => obj.courseName === mUser.course);
  
  sendEnrollNotification(mUser, iC);
  const form = new formidable.IncomingForm();

  /* form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("aca el error");
      return;
    }
    var filename = files.file.originalFilename;
    const file = files.file;
    fs.readFile(file.filepath, async (err, data) => {
      if (err) {
        console.error("aca el error");
        return;
      }
      var spAccessToken = await getSpAccessToken();
      var uploadSpFile = await sendFileToSp(data, filename, spAccessToken.data.access_token);
      console.log(data);
    });
  }); */
}

export const queryUserdb = async (req, res, next) => {
  var users = await pool.query('SELECT * from users WHERE username = "judi"');
  console.log(users);
}

