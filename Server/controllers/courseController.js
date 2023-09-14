import Course from "../models/courseModel.js"
import AppError from '../utils/errorUtil.js'
import cloudinary from 'cloudinary'
import fs from 'fs/promises'

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


const createCourse = async (req,res,next) =>{
    const {title,description,category,createdBy} = req.body

    if(!title || !description || !category || !createdBy){
        return next(new AppError(500,`All fields are required`))
    }

    const newCourse = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail:{
            public_id: 'Dummy',
            secure_url: 'Dummy'
        }
    })

    if(!newCourse){
        return next(new AppError(500,`Unable to create Course`))
    }

    if(req.file){
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms',
            })

            if(result){
                newCourse.thumbnail.secure_url = result.secure_url
                newCourse.thumbnail.public_id = result.public_id
            }

            fs.rm(`uploads/${req.file.filename}`)

        } catch (error) {
            return next(new AppError(500,`Unable to upload image`))
        }
    }

    newCourse.save()

    res.status(200).json({
        success: true ,
        message: `Course created successfully`,
        newCourse
    })
} 


const updateCourse = async (req,res,next) =>{
    try {
        const {id} = req.params

        const courseUpdated = await Course.findByIdAndUpdate(
            id,
            {
                // overwrite all the parameters provided in body by user
                $set: req.body
            },
            {
                // validates parameters through the courseModel.js file
                runValidators: true
            }
        )

        if(!courseUpdated){
            return next(new AppError(500,`Unable to find course with given id`))
        }

        res.status(200).json({
            success: true,
            message: `Course updated successfully !`,
            courseUpdated
        })
    } catch (error) {
        return next(new AppError(500,error.message))
    }
} 

const removeCourse = async (req,res,next) =>{
    const {id} = req.params

    const courseToBeDeleted = await Course.findById(id)

    if(!courseToBeDeleted){
        return next(new AppError(500,`Unable to find course with given id`))
    }

    await Course.findByIdAndDelete(id)

    res.status(200).json({
        success:true,
        message: `Course deleted successfully`,
    })

} 

const addLectureByCourseId = async (req,res,next) =>{
    try {
        const {title,description} = req.body
        const {id} = req.params

        if(!title || !description){
            return next(new AppError(500,`All fields are required`))
        }

        const courseFromDB = await Course.findById(id)

        if(!courseFromDB){
            return next(new AppError(500,`Course with given id not found !`))
        }

        const lectureData = {
            title,description,lecture:{}
        }

        if(req.file){
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path,{
                    folder: 'lms',
                })
    
                if(result){
                    lectureData.lecture.secure_url = result.secure_url
                    lectureData.lecture.public_id = result.public_id
                }
    
                fs.rm(`uploads/${req.file.filename}`)
    
            } catch (error) {
                return next(new AppError(500,`Unable to upload image`))
            }
        }

        courseFromDB.lectures.push(lectureData)
        courseFromDB.numberOfLectures = courseFromDB.lectures.length

        await courseFromDB.save()
        
        res.status(200).json({
            success : true ,
            message: `Lecture added to the course successfully`,
            courseFromDB
        })

    } catch (error) {
        return next(new AppError(500,error.message))
    }
}

export {getAllCourses,getLecturesByCourseId,createCourse,updateCourse,removeCourse,addLectureByCourseId}