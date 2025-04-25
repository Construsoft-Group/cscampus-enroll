import express from "express";
import { bulkCourses, listCourses, newGroup } from "../services/db.service.js";

const router = express.Router();
router.use(express.json());
//router.get('/', bulkCourses);
router.get('/courses', listCourses, (req, res) => {                           
    res.render('db/courses', {
      courses: res.locals.courses
    });
  });
//crear course
router.get('/courses/:courseId/groups/new', (req, res) => {
    const { courseId } = req.params;
    res.render('db/group_form', { courseId });
  });

router.post('/courses/:courseId/groups', newGroup);

//editar course
router.get('/courses/:courseId/groups/:groupId/edit', );
//router.post('/courses/:courseId/groups/:groupId?_method=DELETE,);


export default router;