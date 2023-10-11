import { Router } from "express";
import { getAllCourses, getLecturesByCourseId,updateCourse,createCourse, removeCourse, addLectureByCourseId} from "../controllers/courseController.js";
import {isLoggedIn,authorizedRoles,authorizedSubscriber} from '../middleware/authMiddleware.js'
import upload from '../middleware/multerMiddleware.js'

const router = new Router()


router.route('/')
    .get(getAllCourses)
    .post(isLoggedIn,authorizedRoles('ADMIN'),upload.single('thumbnail'),createCourse)
    

router.route('/:id')
    .get(isLoggedIn,authorizedSubscriber,getLecturesByCourseId)
    .put(isLoggedIn,authorizedRoles('ADMIN'),updateCourse)
    .delete(isLoggedIn,authorizedRoles('ADMIN'),removeCourse)
    .post(isLoggedIn,authorizedRoles('ADMIN'),upload.single('lecture'),addLectureByCourseId)


export default router