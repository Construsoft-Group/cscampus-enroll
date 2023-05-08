import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js"
import { sendEmailToUser, sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';

export const newApplicant = async (req, res, next) => {
    formData.parse(req, async (error, fields, files) => {
        const {firstname, lastname, email, phone, interest, country, office, privacidad, promo } = fields;
        var filename = email +"-"+ files.file.originalFilename;
        const file = files.file;
        fs.readFile(file.filepath, async (err, data) => { //Se lee el archivo desde temp y se inserta el buffer como data en sharepoint.
            var spAccessToken = await getSpAccessToken();
            var uploadSpFile = await sendFileToSp(data, filename, spAccessToken.data.access_token);
          });
        const newApplicant = {firstname, lastname, email, phone, interest, country, office, privacidad, promo};
        await pool.query('INSERT INTO request set ?', [newApplicant]);
    });
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