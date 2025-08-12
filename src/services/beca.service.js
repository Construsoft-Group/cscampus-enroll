import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js";
import enrollmentGroups from '../config/courses.js';
import { sendReceptionConfirmToUser, sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from '../config/moodle.js';
import { getSpAccessToken, sendFileToSp, createListItem, sendFilePAutomate } from '../config/sharepoint.js';

export const newRecord = async (req, res, next) => {
  let fecha_now = new Date(); //Fecha Actual
  var mlSeconds = 24*60*60000;
  var newDateObj = new Date(fecha_now - mlSeconds);

  // fecha de corte: 1 de enero de 2025 a las 00:00
  const cutoffDate = new Date('2025-01-01T00:00:00Z');

  //var sitename =  'UNIVERSIDADES-ProyectoEducacional'; //Comentado temporalmente
  //var folderPath = 'Shared Documents/General/7. Documentos aspirantes'; //Comentado temporalmente
  //var sitename =  'Becas'; //nombre del sharepoint
  //var folderPath = 'Documentos%20compartidos/7. Documentos aspirantes'; //ruta de archivo en el sharepoint 
  //var listname = 'Matriculaciones web'; //Nombre de la lista en SP
  
  var formData = new formidable.IncomingForm();
	formData.parse(req, async (error, fields, files) => {
        const {firstname, lastname, institution, country, role, course, email, phone} = fields;
        var filename = email +"-"+ files.file.originalFilename;
        const file = files.file;
        const newUser = {firstname, lastname, institution, country, role, course, email, phone};
        //  Se comenta esta parte hasta resolver problema con Sharepoint
        //var spAccessToken = await getSpAccessToken();
        //console.log(file);

        //const fileContentBase64 = fs.readFileSync(file.filepath, { encoding: 'base64' });
        //var uploadedFile = sendFilePAutomate(fileContentBase64, filename);

        fs.readFile(file.filepath, async (err, data) => { //Se lee el archivo desde temp y se inserta el buffer como data en sharepoint.
            //var uploadSpFile = await sendFileToSp(data, filename, spAccessToken.data.access_token, sitename, folderPath);
            //const base64Content = Buffer.from(data).toString('base64');
            //var uploadedFile = sendFilePAutomate(base64Content, filename);
            //console.log(uploadedFile.body)
          });
        
        // 1) Buscamos en BD si hay algún registro desde el 01/01/2025
        var user = await pool.query(
          `SELECT 1 FROM beca_request 
            WHERE submitted_at >= ? 
            AND email = ? 
          LIMIT 1`,
          [cutoffDate.toISOString(), newUser.email]
        );

        /*
        //consultamos si existen solicitudes recientes en la base de datos, mínimo 24 hrs.
        var user = await pool.query(
          `SELECT * FROM beca_request 
          WHERE submitted_at BETWEEN "${newDateObj.toISOString()}" 
          AND "${fecha_now.toISOString()}" 
          AND email = "${newUser.email}"`);
        */

        if(user.length == 0)
        {
          await pool.query('INSERT INTO beca_request set ?', [newUser]); //Se crea el resgistro en la tabla beca_request
          await sendReceptionConfirmToUser(newUser);

          await sendInternalEmail(newUser, "Formulario de becas");
          //Se comenta esta parte hasta resolver problema con Sharepoint
          
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
          
          //var listItemResult = await createListItem(spAccessToken.data.access_token, data, sitename, listname);
          
          console.log("Nuevo registro exitoso" + newUser.email + " sp status " + listItemResult.status);
          console.log("Nuevo registro exitoso" + newUser.email );

          const dataResponse = {
            title:    '¡Registro completo!',
            message:  'Hemos recibido tu solicitud de beca y estamos evaluando tu candidatura. Te informaremos por correo electrónico si tu candidatura ha sido aprobada en un plazo de 15 días.',
            // si no quieres mostrar enlace, deja link en null o undefined
            link: { 
              url:  '/beca/form',
              text: 'Enviar otra respuesta'
            }
          };
            
          res.render('forms/form_response', dataResponse);
            
        }else{

          var iC = enrollmentGroups.find(obj => obj.courseName === newUser.course);
          sendEnrollNotification(newUser, iC, 'beca_mail_not_approved.ejs');

          const textoOriginal = [
            'Tras revisar tu solicitud, hemos comprobado que ya te has matriculado a un curso gratuito en 2025 mediante la beca para estudiantes y profesores.',
            'Esta beca permite un solo curso gratuito por persona al año, por lo que no ha sido posible tramitar gratuitamente tu inscripción al curso Fundamentos Tekla Structures Acero.',
            'Como ya has aprovechado la beca este 2025 (que cubre un solo curso gratuito por persona), queremos ofrecerte una opción especial para seguir formándote.',
            'Accede a cualquiera de los cursos de la beca por solo 97 €.',
            '🔐 Código de descuento: FORMATE25',
            '📅 Válido hasta el 31 de diciembre de 2025',
            'Solo tienes que aplicar el código al adquirir el curso en nuestra tienda online. Este descuento es válido en cualquiera de los cursos disponibles en la beca.'
          ].join('\n\n');
          
          // sustituimos dobles saltos por <br><br>, simples por <br>
          const htmlConBreaks = textoOriginal
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>');

          const dataResponse = {
            title:    '¡Gracias por tu interés en la beca exclusiva para estudiantes y profesores!',
            message:  htmlConBreaks,
            // si no quieres mostrar enlace, deja link en null o undefined
            link: { 
              url:  'https://www.construsoft.es/es/formacion-bim/curso-online',
              text: 'Accede a los cursos de la beca'
            }
          };
          
          res.render('forms/form_response', dataResponse);
          console.log("Nuestro sistema registra ya una solicitud este año.");

        }
    });
}

export const enroller = async () => {
    let fecha_now = new Date(); //Fecha Actual
    var mlSeconds = 24*60*60000;
    var newDateObj = new Date(fecha_now - mlSeconds);
    var groupName = "";
    var userjd = await pool.query(`SELECT * FROM beca_request WHERE submitted_at BETWEEN "2023-01-01 00:00:00" AND "${newDateObj.toISOString()}" AND status = ""`);

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
        var iC = enrollmentGroups.find(obj => obj.courseName === mUser.course);
        if(mUser.role == "Estudiante"){
            groupName = "PROGRAMA ESTUDIANTES 2025";
        } else {
            groupName = "PROGRAMA PROFESORES 2025";
        }
        var iG = iC.groups.find(obj => obj.groupName === groupName);
        var newEnrollment = {
            course_id: iC.courseId,
            user_email: mUser.email,
            role: mUser.role,
            course_group: iG.groupId
        }

        var iniEnrollment = parseInt((fecha_now.getTime()/1000).toFixed(0));
        var timeEnd = new Date();
        timeEnd.setDate(fecha_now.getDate() + 60);
        var endEnrollment = parseInt((timeEnd.getTime()/1000).toFixed(0));
        if(response.users.length != 0){ //Cuando el usuario ya esta registrado entonces lo matricula y lo añade al curso.
            var enrollment = await enrollMoodleuser(response.users[0].id, iC.courseId, iniEnrollment, endEnrollment);
            console.log(enrollment);
            var addToGroup = await addUserToMoodleGroup(response.users[0].id, iG.groupId);
            //console.log(addToGroup);
            var insertEnrollDb = await pool.query('INSERT INTO all_enrollments set ?', [newEnrollment]);
            //console.log(insertEnrollDb);
            var updateReqDb = await pool.query(`UPDATE beca_request SET status = "enrolled" WHERE id_ext="${userjd[0].id_ext}"`);
            sendEnrollNotification(mUser, iC, 'beca_mail_enrolled.ejs');
            return "usuario matriculado " + mUser.email;
        }
        else //Cuando el usuario no esta registrado entonces lo crea, lo matricula y lo agrega al grupo.
        {  
          if (mUser.country == "Costa Rica" || mUser.country == "El Salvador" || mUser.country == "Dominican Republic" ){
            mUser.country = "";
          }
          var newUser = await createMoodleUser(mUser);
          console.log(newUser.data);
          //var newUserData = newUser.data.split("<hr>"); //Esta linea es necesaria cuando es canpus Strusite (Test)
          //let newUserRes = JSON.parse(newUserData[2]); //Esta linea es necesaria cuando es canpus Strusite (Test)
          let newUserRes = newUser.data;
          mUser.campus_id = newUserRes[0].id;
          var enrollment = await enrollMoodleuser(newUserRes[0].id, iC.courseId, iniEnrollment, endEnrollment);
          var addToGroup = await addUserToMoodleGroup(newUserRes[0].id, iG.groupId);
          var insertuserDb = await pool.query('INSERT INTO all_users set ?', [mUser]);
          var insertEnrollDb = await pool.query('INSERT INTO all_enrollments set ?', [newEnrollment]);
          var updateReqDb = await pool.query(`UPDATE beca_request SET status = "created + enrolled" WHERE email="${mUser.email}"`);

          //Se comenta esta parte hasta resolver problema con Sharepoint
          var spAccessToken = await getSpAccessToken();
          let data = {
              "__metadata": {
              "type": "SP.Data.Matriculaciones_x0020_webListItem"
              },
              "Title": mUser.campus_id,
              "Nombres": mUser.firstname,
              "Apellidos": mUser.lastname,
              "email": mUser.email,
              "Instituci_x00f3_n": mUser.institution,
              "Pais": mUser.country,
              "curso": mUser.course,
              "phone": mUser.phone
          }
          //await createListItem(spAccessToken.data.access_token, data, sitename, listname);
          
          sendEnrollNotification(mUser, iC, 'beca_mail_enrolled.ejs'); //Se envía correo de notificación con para acceder al curso
          return "usuario creado y matriculado " + mUser.email;
        }
    }else{
        return "No hay usuarios nuevos";
    }
}

//A continuación son funciones de testing-->

export const fileTest = async(req, res, next) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("aca el error");
      return;
    }
    try {
      const filename = files.file.originalFilename;
      const filepath = files.file.filepath;

      // Leer el archivo en base64
      let fileContentBase64 = fs.readFileSync(filepath, { encoding: 'base64' });

      // Limpiar saltos de línea por si acaso
      fileContentBase64 = fileContentBase64.replace(/\r?\n|\r/g, "");

      //console.log("Tamaño Base64:", fileContentBase64);

      // Esperar la respuesta de Power Automate
      const uploadedFile = await sendFilePAutomate(filepath, filename);

      console.log("Respuesta de Power Automate:", uploadedFile.status, uploadedFile.statusText);
      res.send("Archivo enviado correctamente");
    } catch (error) {
      console.error("Error al enviar archivo a Power Automate:", error.message);
      res.status(500).send("Error en envío");
    }

  });
}

export const queryUserdb = async (req, res, next) => {
  var users = await pool.query('SELECT * from all_users WHERE role = "Profesor"');
  res.status(200).json(users);
}

