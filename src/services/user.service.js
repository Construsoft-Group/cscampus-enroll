import fetch from "node-fetch";
import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import { fileURLToPath } from 'url';
import path from 'path';
import pool from "../database.js"
import FormData from 'form-data';

import enrollmentGroups from '../config/courses.js';
import { sendEmailToUser, sendInternalEmail } from '../config/sendMail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var WebServiceUrl = process.env.MDL_DOMAIN + "webservice/rest/server.php";

export const newRecord = async (req, res, next) => {
    let date = new Date()
    var formData = new formidable.IncomingForm();
	formData.parse(req, async (error, fields, files) => {
        const {firstname, lastname, institution, country, role, course, email, phone} = fields;
        var extension = files.file.originalFilename.substr(files.file.originalFilename.lastIndexOf("."));
        var filename = email +"-"+ files.file.originalFilename;
        var newPath = path.resolve(__dirname, '../uploads/template'+ extension);
        fs.rename(files.file.filepath, newPath, function (errorRename) {
			console.log("File saved = " + newPath);
            fs.readFile(newPath, async (err, data) => {
                if (err) throw err;
                var spAccessToken = await getSpAccessToken();
                var uploadSpFile = await sendFileToSp(data, filename, spAccessToken.data.access_token);
            });
		});
        const newUser = {firstname, lastname, institution, country, role, course, email, phone};
        var user = await pool.query('SELECT * from request WHERE email = ?', newUser.email);

        if(user!=[])
        {
            await pool.query('INSERT INTO request set ?', [newUser])
            console.log("Nuevo registro exitoso" + newUser.email)
            const notifyUser = await sendEmailToUser(newUser);
            const notifyinternal = await sendInternalEmail(newUser);
            console.log('Message Sent ', notifyUser)
            res.redirect('/user/success');
        }else{
            res.status(200).json({'status': "usuario ya registrado"});
            console.log("usuario ya registrado")
            res.redirect('/user/success');
        }
    });
}

export const queryUserdb = async (req, res, next) => {
    var users = await pool.query('SELECT * from users WHERE username = "judi"');
    console.log(users);
}

export const moodle = async () => {
    let fecha_now = new Date(); //Fecha Actual
    var mlSeconds = 24*60*60000;
    var newDateObj = new Date(fecha_now - mlSeconds);
    var groupName = "";
    var userjd = await pool.query(`SELECT * FROM request WHERE submitted_at BETWEEN "2023-01-01 00:00:00" AND "${newDateObj.toISOString()}" AND campus_id = "0"`);
    if(userjd.length!=0){
        for(let i = 0; i <= userjd.length; i++){
            const usernamestr = userjd[i].firstname.substring(0,2)+userjd[i].lastname.substring(0,2)+ "-" +fecha_now.getTime().toString().substring(9,13);
            const username = usernamestr.toLowerCase();
            var mUser = { 
                username: username, 
                firstname: userjd[i].firstname, 
                lastname: userjd[i].lastname, 
                institution: userjd[i].institution, 
                country: userjd[i].country,
                role: userjd[i].role,
                course: userjd[i].course, 
                email: userjd[i].email, 
                phone: userjd[i].phone,
                campusId: userjd[i].campus_id
            };
            await pool.query('INSERT INTO users set ?', [mUser]);

            var qUser = await queryMoodleUser(userjd[i].email);
            var data = qUser.data.split("<hr>");
            let response = JSON.parse(data[2]);

            var iC = enrollmentGroups.setItems.map(obj => obj.courseName).indexOf(mUser.course);
            if(mUser.role == "Estudiante"){
                groupName = "PROGRAMA ESTUDIANTES 2023";
            } else {
                groupName = "PROGRAMA PROFESORES 2023";
            }
            var iG = enrollmentGroups[iC].groups.setItems.map(obj => obj.ssGroupStName).indexOf(groupName);
            
            if(!response.users){ //Cuando el usuario ya esta registrado entonces lo matricula y lo añade al curso.
                    var enrollment = await enrollMoodleuser(mUser.campusId, iC.courseId);
                    var addToGroup = await addUserToMoodleGroup(mUser.campusId, iG.ssGroupStId);
                    return "Usuario ya existe, matriculado";
            }
            else //Cuando el usuario no esta registrado entonces lo crea, lo matricula y lo agrega al grupo.
            {  
                var newUser = await createMoodleUser(mUser);
                var newUserData = newUser.data.split("<hr>");
                let newUserRes = JSON.parse(newUserData[2]);
                var enrollment = await enrollMoodleuser(newUserRes[0].id, iC.courseId);
                var addToGroup = await addUserToMoodleGroup(newUserRes[0].id, iG.ssGroupStId);
                await pool.query(`UPDATE users SET campus_id = ${newUserRes[0].id} WHERE email="${userjd[i].email}"`);
                await pool.query(`UPDATE request SET campus_id = ${newUserRes[0].id} WHERE email="${userjd[i].email}"`,  (err,res)=>{
                    console.log(err,res);
                    var response =  {Created: "ok", userId : newUserRes[0].id, enrollment: enrollment, group: addToGroup};
                    console.log(response);
                    return response;
                });
            }
        }
    }else{
        return "No hay usuarios nuevos";
    }
}

async function getSpAccessToken() {
    const formData = new URLSearchParams();
    formData.append("grant_type", "refresh_token");
    formData.append("client_id", `${process.env.SP_CLIENT_ID}@${process.env.SP_TENANT_ID}`);
    formData.append("client_secret", process.env.SP_CLIENT_SECRET);
    formData.append("resource", `00000003-0000-0ff1-ce00-000000000000/${process.env.SP_TENANT_NAME}.sharepoint.com@${process.env.SP_TENANT_ID}`);
    formData.append("refresh_token", process.env.SP_REFRESHTOKEN);
    var config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `https://accounts.accesscontrol.windows.net/${process.env.SP_TENANT_ID}/tokens/OAuth/2`,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data : formData
      };
      let res = await axios(config)
      return res;
}

async function sendFileToSp(file, filename, spAccessToken) {
    var sitename =  'UNIVERSIDADES-ProyectoEducacional';
    var folderPath = 'General/7. Documentos aspirantes'
    var spurl = `https://${process.env.SP_TENANT_NAME}.sharepoint.com/sites/${sitename}/_api/web/GetFolderByServerRelativeURL('/sites/${sitename}/Shared Documents/${folderPath}/')/Files/add(url='${filename}',overwrite=true)`;
    var config = {
        method: 'post',
        url: spurl,
        headers: {
            'Authorization': `Bearer ${spAccessToken}`,
            'X-RequestDigest': '', 
            'Accept': 'application/json; odata=nometadata', 
            'Content-Type': 'application/pdf'
        },
        data : file
      };

    let res = await axios(config)
    return res;
}

async function queryMoodleUser(email){
    const params = new URLSearchParams();
    params.append('moodlewsrestformat', 'json');
    params.append('wsfunction', 'core_user_get_users');
    params.append('wstoken', process.env.MDL_TOKEN);
    params.append('criteria[0][key]', 'email');
    params.append('criteria[0][value]', email);
    var config = {
        method: 'get',
        url: WebServiceUrl,
        headers: {},
        params :  params
      };

    let res = await axios(config)
    return res;
}

async function createMoodleUser(user) {
    console.log(user);
    const params = new URLSearchParams();
    params.append('moodlewsrestformat', 'json');
    params.append('wsfunction', 'core_user_create_users');
    params.append('wstoken', process.env.MDL_TOKEN);
    params.append('users[0][username]', user.username);
    params.append('users[0][createpassword]', 1);
    params.append('users[0][firstname]', user.firstname);
    params.append('users[0][lastname]', user.lastname);
    params.append('users[0][institution]', user.institution);
    params.append('users[0][country]', user.country);
    params.append('users[0][phone1]', user.phone);
    params.append('users[0][email]', user.email);
    params.append('users[0][idnumber]', 'AUTOGENERATEDID002');
    params.append('users[0][description]', 'auto-generated');
    params.append('users[0][lang]', 'en');
    var config = {
        method: 'post',
        url: WebServiceUrl,
        headers: {},
        params :  params
      };

    let res = await axios(config)
    return res;
}

async function enrollMoodleuser(userId, courseId){
    const params = new URLSearchParams();
    params.append('moodlewsrestformat', 'json');
    params.append('wsfunction', 'enrol_manual_enrol_users');
    params.append('wstoken', process.env.MDL_TOKEN);
    params.append('enrolments[0][roleid]', '5');
    params.append('enrolments[0][userid]', userId);
    params.append('enrolments[0][courseid]', courseId);
    params.append('enrolments[0][timestart]', '1672178173');
    params.append('enrolments[0][timeend]', '1678921849');
    params.append('enrolments[0][suspend]', '0'); //Este valor se puede usar para automatizar la extensión de matrícula

    var config = {
        method: 'post',
        url: WebServiceUrl,
        headers: {},
        params :  params
      };

    let res = await axios(config)
    return res;
}

async function addUserToMoodleGroup(userId, groupid){
    const params = new URLSearchParams();
    params.append('moodlewsrestformat', 'json');
    params.append('wsfunction', 'core_group_add_group_members');
    params.append('wstoken', process.env.MDL_TOKEN);
    params.append('members[0][groupid]', groupid); //id del grupo al cual se espera incluir al usuario
    params.append('members[0][userid]', userId);

    var config = {
        method: 'post',
        url: WebServiceUrl,
        headers: {},
        params :  params
      };

    let res = await axios(config)
    return res;
}


