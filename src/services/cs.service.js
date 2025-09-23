import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js"
import enrollmentGroups from '../config/courses.js';
import hotmartPacks from '../config/hotmartProducts.js';
import { replaceSpecialChars } from '../config/specialChars.js';
import {sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup, getHotmartGroupId } from '../config/moodle.js';
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

  //console.log(req.body);
  
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
          var groupName =  "PROGRAMA CLIENTES TEKLA 2025";
          
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


            //Para el curso trimble connect se inclyuye tambien en el gruipo FULL
            if( iC.courseName === "CDE | Gestión y coordinación de proyectos BIM con Trimble Connect"){
              var groupName2 =  "23_FULL";
              var iFullG = iC.groups.find(obj => obj.groupName === groupName2);
              var addToFullGroup = await addUserToMoodleGroup(qUserData.users[0].id, iFullG.groupId);
            }
            
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
              //console.log("usuario creado y matriculado " + mUser.email + " spStatus " + listItemResult.status);
              console.log("usuario creado y matriculado " + mUser.email);
          }
          const dataResponse = {
            title:    '¡Registro esitoso!',
            message:  'Hemos recibido tu solicitud. Enseguida recibirás un correo instructivo para acceder al campus Construsoft y empezar a estudiar',
            // si no quieres mostrar enlace, deja link en null o undefined
            link: { 
              url:  'https://campus.construsoft.com/login/index.php',
              text: 'Ir al campus'
            }
          };
          
          res.render('forms/form_response', dataResponse);

          //res.redirect('/cs/customer-enroll/success');  
        }else{
            console.log("Debes esperar al menos 24 horas para enviar una nueva solicitud");

            const dataResponse = {
              title:    '¡Tienes una solicitud en curso!',
              message:  'Debes esperar al menos 24 horas para enviar una nueva solicitud',
              // si no quieres mostrar enlace, deja link en null o undefined
              link: { 
                url:  'https://www.construsoft.es/es/servicios/area-privada-tekla',
                text: 'Volver al área de clientes'
              }
            };
            
            res.render('forms/form_response', dataResponse);

            //res.redirect('/cs/customer-enroll/not-success');
        }
        
  })
  
}

export const hotmartTest = async (req, res, next) => {
  try {
    console.log('Webhook recibido de Hotmart:', req.body);

    const webhookData = req.body;

    // Validar que es un evento de compra válido
    const validEvents = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE'];
    const validStatuses = ['APPROVED', 'COMPLETED'];

    if (!validEvents.includes(webhookData.event) || !validStatuses.includes(webhookData.data.purchase.status)) {
      console.log(`Webhook ignorado - Evento: ${webhookData.event}, Status: ${webhookData.data.purchase.status}`);
      return res.status(200).json({message: "webhook processed - not a valid purchase"});
    }

    console.log(`✅ Compra válida detectada - Evento: ${webhookData.event}, Status: ${webhookData.data.purchase.status}`);

    // Extraer datos del comprador
    const buyer = webhookData.data.buyer;
    const product = webhookData.data.product;
    const purchase = webhookData.data.purchase;

    const userData = {
      email: buyer.email,
      firstname: buyer.first_name,
      lastname: buyer.last_name,
      phone: buyer.checkout_phone || '',
      company: 'Hotmart Customer',
      activity: 'E-learning',
      position: 'Student',
      transaction_id: purchase.transaction
    };

    console.log('Datos del usuario extraídos:', userData);

    // Buscar pack en la configuración de Hotmart (la estructura cambió a array)
    const pack = hotmartPacks[0][product.name];
    if (!pack) {
      console.log(`Producto no mapeado: ${product.name}`);
      return res.status(200).json({message: "product not mapped"});
    }

    console.log(`Pack encontrado: ${product.name} con ${pack.courses.length} cursos`);

    // Verificar duplicados por transaction_id
    const existingTransaction = await pool.query(
      `SELECT * FROM hotmart_enrollments WHERE transaction_id = ?`,
      [userData.transaction_id]
    );

    if (existingTransaction.length > 0) {
      console.log(`Transacción duplicada: ${userData.transaction_id}`);
      return res.status(200).json({message: "transaction already processed"});
    }

    // Configurar fechas de matriculación - usar "matricula" como días
    const fecha_now = new Date();
    const iniEnrollment = parseInt((fecha_now.getTime()/1000).toFixed(0));
    const timeEnd = new Date();
    timeEnd.setDate(fecha_now.getDate() + pack.matricula);
    const endEnrollment = parseInt((timeEnd.getTime()/1000).toFixed(0));

    console.log(`Matriculación por ${pack.matricula} días`);

    // Verificar si el usuario existe en Moodle
    const qUser = await queryMoodleUser(userData.email);
    let qUserData = qUser.data;

    const mUser = {
      username: replaceSpecialChars(userData.firstname.substring(0,2) + userData.lastname.substring(0,2) + "-" + fecha_now.getTime().toString().substring(9,13)).toLowerCase(),
      firstname: replaceSpecialChars(userData.firstname),
      lastname: replaceSpecialChars(userData.lastname),
      company: replaceSpecialChars(userData.company),
      activity: replaceSpecialChars(userData.activity),
      email: replaceSpecialChars(userData.email),
      phone: replaceSpecialChars(userData.phone),
      campus_id: 0
    };

    let enrolledCourses = [];
    let enrollmentErrors = [];

    // Determinar si el usuario existe o necesita ser creado
    if (qUserData.users.length !== 0) {
      mUser.campus_id = qUserData.users[0].id;
      console.log(`Usuario existente encontrado: ${mUser.email} (ID: ${mUser.campus_id})`);
    } else {
      // Crear nuevo usuario
      const mUserMoodle = await createMoodleUser(mUser);
      let newUserRes = mUserMoodle.data;
      mUser.campus_id = newUserRes[0].id;

      // Insertar en tabla all_users
      const mUserWithoutCompany = {
        username: mUser.username,
        firstname: mUser.firstname,
        lastname: mUser.lastname,
        institution: mUser.company,
        country: "Online",
        role: "Estudiante",
        email: mUser.email,
        phone: mUser.phone,
        course: "Multiple Courses",
        campus_id: mUser.campus_id
      };
      await pool.query('INSERT INTO all_users set ?', [mUserWithoutCompany]);
      console.log(`Usuario nuevo creado: ${mUser.email} (ID: ${mUser.campus_id})`);
    }

    // Matricular en todos los cursos del pack
    for (const packCourse of pack.courses) {
      try {
        // Usar directamente la información de hotmartProducts
        const course = {
          courseId: packCourse.id,
          courseName: packCourse.name,
          courseLink: packCourse.url
        };

        console.log(`Procesando curso: ${course.courseName} (ID: ${course.courseId})`);

        // Buscar el grupo "Hotmart" dinámicamente en el curso
        const hotmartGroupId = await getHotmartGroupId(course.courseId);

        if (!hotmartGroupId) {
          console.log(`No se encontró grupo Hotmart para el curso: ${course.courseName}`);
          enrollmentErrors.push(`Grupo Hotmart no encontrado en curso: ${course.courseName}`);
          continue;
        }

        console.log(`Matriculando en: ${course.courseName}, grupo Hotmart (ID: ${hotmartGroupId})`);

        // Matricular en el curso
        const enrollment = await enrollMoodleuser(mUser.campus_id, course.courseId, iniEnrollment, endEnrollment);

        // Agregar al grupo Hotmart
        const addToGroup = await addUserToMoodleGroup(mUser.campus_id, hotmartGroupId);

        // Registrar matriculación en base de datos
        const newEnrollment = {
          course_id: course.courseId,
          user_email: userData.email,
          role: "Estudiante",
          course_group: hotmartGroupId
        };
        await pool.query('INSERT INTO all_enrollments set ?', [newEnrollment]);

        // Lógica especial para Trimble Connect
        if (course.courseName === "CDE | Gestión y coordinación de proyectos BIM con Trimble Connect") {
          const groupName2 = "23_FULL";
          const iFullG = course.groups.find(obj => obj.groupName === groupName2);
          if (iFullG) {
            await addUserToMoodleGroup(mUser.campus_id, iFullG.groupId);
            console.log(`Usuario agregado también al grupo FULL de Trimble Connect`);
          }
        }

        // Enviar notificación por email para cada curso
        mUser.course = course.courseName;
        await sendEnrollNotification(mUser, course, 'gen_mail_enrolled.ejs');

        enrolledCourses.push({
          courseName: course.courseName,
          courseId: course.courseId,
          groupId: hotmartGroupId,
          groupName: "Hotmart"
        });

        console.log(`✅ Matriculación exitosa en: ${course.courseName}`);

      } catch (courseError) {
        console.error(`Error matriculando en curso ${packCourse.name}:`, courseError);
        enrollmentErrors.push(`Error en ${packCourse.name}: ${courseError.message}`);
      }
    }

    // Registrar la transacción de Hotmart
    const hotmartRecord = {
      transaction_id: userData.transaction_id,
      product_name: product.name,
      buyer_email: userData.email,
      enrolled_courses: JSON.stringify(enrolledCourses),
      enrollment_errors: JSON.stringify(enrollmentErrors),
      total_courses: pack.courses.length,
      successful_enrollments: enrolledCourses.length,
      processed_at: fecha_now
    };

    await pool.query('INSERT INTO hotmart_enrollments set ?', [hotmartRecord]);

    // Enviar email interno de notificación
    await sendInternalEmail({
      ...userData,
      pack: product.name,
      enrolledCourses: enrolledCourses.length,
      totalCourses: pack.courses.length,
      source: 'Hotmart Webhook'
    }, "Matriculación automática Hotmart - Pack múltiple");

    console.log(`🎉 Proceso completado para ${userData.email}: ${enrolledCourses.length}/${pack.courses.length} cursos matriculados`);

    res.status(200).json({
      message: "enrollment process completed",
      user_id: mUser.campus_id,
      pack_name: product.name,
      transaction_id: userData.transaction_id,
      total_courses: pack.courses.length,
      successful_enrollments: enrolledCourses.length,
      enrolled_courses: enrolledCourses,
      errors: enrollmentErrors
    });

  } catch (error) {
    console.error('Error procesando webhook de Hotmart:', error);
    res.status(500).json({error: "internal server error", details: error.message});
  }
}


export const renderCourseForm = async (req, res, next) => {
  res.render("forms/cs/customer-enroll");
  /*
  const { courseId } = req.params;
  var courseDetails = enrollmentGroups.find(obj => obj.courseId === parseInt(courseId));
  res.render("forms/cs/customer-enroll", {courseId: courseDetails.courseId, courseName: courseDetails.courseName})
  */
}