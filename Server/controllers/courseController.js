import Course from "../models/courseModel.js"
import AppError from '../utils/errorUtil.js'


const getAllCourses = async (req,res,next)=>{

    // deselect (dont select) lectures
    try {
        const courses = await   Course.find({}).select('-lectures')

        if(!courses){
            return next(new AppError(500,`Unable to fetch Courses`))
        }

        res.status(200).json({
            success: true,
            message: `All courses found`,
            courses
        })
    } catch (error) {
        return next(new AppError(500,error.message))
    }
}


const getLecturesByCourseId = async(req,res,next) =>{
    try {
        const {id} = req.params

        const course = await Course.findById(id)

        if(!course){
            return next(new AppError(500,`Unable to fetch with provided course`))
        }

        res.status(200).json({
            success: true,
            message: `Course found` ,
            lectures: course.lectures
        })

    } catch (error) {
        return next(new AppError(500,`Unable to fetch Lectures`))
    }
}

export {getAllCourses,getLecturesByCourseId}