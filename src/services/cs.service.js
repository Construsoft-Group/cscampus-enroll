import axios from 'axios';
import formidable from "formidable";
import fs from 'fs'
import pool from "../database.js"
import enrollmentGroups from '../config/courses.js';
import { sendEmailToUser, sendInternalEmail, sendEnrollNotification } from '../config/sendMail.js';
import { queryMoodleUser, createMoodleUser, enrollMoodleuser, addUserToMoodleGroup } from '../config/moodle.js';
import { getSpAccessToken, sendFileToSp, createListItem } from '../config/sharepoint.js';

export const newJobApplicant = async (req, res, next) => {
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

export const customerEnrollmentReq = async (req, res, next) => {
  var formData = new formidable.IncomingForm();
  formData.parse(req, async (error, fields, files) => {
    const {courseId, firstname, lastname, institution, email, phone, optradio} = fields;






    
    console.log(fields);
  })

}

export const renderCourseForm = async (req, res, next) => {
  const { courseId } = req.params;
  var courseDetails = enrollmentGroups.find(obj => obj.courseId === parseInt(courseId));
  
  res.render("forms/customer-enroll", {courseId: courseDetails.courseId, courseName: courseDetails.courseName})
}