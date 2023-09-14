import AppError from "../utils/errorUtil.js"
import user from "../models/userModel.js"
import { json } from "express"
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import sendEmail from "../utils/sendEmail.js"
import crypto from 'crypto'
import { configDotenv } from "dotenv"
import { log } from "console"
configDotenv()

const cookieOptions = {
    maxAge: 7*24*60*60*1000, // 7 days
    httpOnly: true,
    secure: false
}

const register = async(req,res,next) =>{
    const {fullName,email,password} = req.body

    if(!fullName || !email || !password){
        return next(new AppError(500,`All fields are required`)) 
    }

    const userExists = await user.findOne({email})

    if(userExists){
        return next(new AppError(500,`User already exists !`))
    }

    const newUser = await user.create({
        fullName,
        email,
        password,
        avatar:{
            public_id: email,
            secure_url: 'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg'
        }
    })

    if(!newUser){
        return next(new AppError(500,`User registration failed, please try again`))
    }

    // IMAGE  FILE UPLOAD
    if(req.file){
        console.log(req.file);
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms',
                width: 250,
                height: 250 ,
                gravity: 'faces',
                crop: 'fill'
            })

            if(result){
                newUser.avatar.public_id = result.public_id 
                newUser.avatar.secure_url = result.secure_url 

                // remove file from server
                fs.rm(`uploads/${req.file.filename}`)
            }
        } catch (error) {
            return next(new AppError(500,`Cannot upload image, please try again`))
        }
    }


    // save user in DB
    await newUser.save()


    // token generation
    const token = await newUser.generateJWTtoken()

    // put token into cookie
    res.cookie('token',token,cookieOptions) 

    newUser.password = undefined
    res.status(200).json({
        success: true ,
        message: `User registered successfully`, 
        newUser
    })
}

const login = async (req,res,next) =>{

    try {
        const {email,password} = req.body

        if(!email || !password){
            return next(new AppError(500,`All fields are required`))
        }

        // getting password explicitly because it was selected as false in schema
        const existingUser = await user.findOne({
            email
        }).select('+password')

        if(!existingUser || !(await existingUser.comparePassword(password))){
            return next(new AppError(500,`Email & Password doesnt match`))
        }

        const token = await existingUser.generateJWTtoken()
        res.cookie('token',token,cookieOptions)

        existingUser.password = undefined
        
        res.status(200).json({
            success: true,
            message: `User logged in successfully`,
            existingUser
        })
    } catch (e) {
        return res.status(500).json({
            success: false ,
            message: e.message
        })
    }
    

}

const logout = (req,res) =>{
    res.cookie('token',null,{
        secure: true ,
        maxAge: 0 ,
        httpOnly: true
    })

    res.status(200).json({
        success :true ,
        message: `User logged out successfully`
    })
}

const getProfile = async (req,res,next) =>{
    try {
        const userId = req.user.id
        const userFromDB = await user.findById(userId)

        res.status(200).json({
            success:true,
            message: `User details found`,
            userFromDB
        })
    } catch (error) {
        return next(new AppError(500,`Failed to fetch profile`))
    }
}

const forgotPassword = async (req,res,next) =>{
    const {email} = req.body

    if(!email){
        return next(new AppError(500,`Please provide email`))
    }

    const userFromDB = await user.findOne({email}) 
    
    if(!userFromDB){
        return next(new AppError(500,`User not found with given email`))
    }
 
    const resetToken = await userFromDB.generatePasswordResetToken()
    console.log(`RESET TOKEN => ${resetToken}`)

    // save new user info with its token inside DB
    await userFromDB.save()

    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    console.log(resetPasswordURL);
    const subject = `Reset Password`
    const message = `You can reset your password by clicking <a href=${resetPasswordURL} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordURL}.\n If you have not requested this, kindly ignore.`;

    try {   
        await sendEmail(email,subject,message)

        res.status(200).json({
            success: true ,
            message: `Reset password token has been sent to ${email} successfully`
        })
    } catch (error) {   
        user.forgotPasswordExpiry = undefined
        user.forgotPasswordToken = undefined 

        await userFromDB.save()

        return next(new AppError(500,error.message))
    }
}

const resetPassword = async(req,res) =>{
    const {resetToken} = req.params
    const {password} = req.body

    const forgotPasswordToken = await crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

    const userExists = await user.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()  }
    })

    if(!userExists){
        return next(new AppError(500,`Token is invalid or expired, please try again`))
    }

    userExists.password = password
    userExists.forgotPasswordExpiry = undefined
    userExists.forgotPasswordToken = undefined

    userExists.save()

    res.status(200).json({
        success: true,
        message:`Password changed successfully !`
    })
}


const changePassword = async (req,res,next) =>{
    const {oldPassword, newPassword} = req.body
    const {id} = req.user
    
    if(!oldPassword || !newPassword){
        return next(new AppError(500,`All fields are mandatory`))
    }

    const userExists = await user.findById(id).select('+password')

    if(!userExists){
        return next(new AppError(500,`User doesnt exist`))
    }

    const isPasswordValid = await userExists.comparePassword(oldPassword)

    if(!isPasswordValid){
        next(new AppError(500,`Old password invalid`))
    }

    userExists.password = newPassword   
    await   userExists.save()

    userExists.password = undefined

    res.status(200).json({
        success: true ,
        message: `Password changed successfully`
    })
}


const updateUser = async (req,res,next) =>{
    const {fullName} = req.body
    const id = req.user.id    

    const userExists = await user.findById(id)

    if(!userExists){
        return next(new AppError(500,`User doesnt exists`))
    }

    if(fullName){
        userExists.fullName = fullName
    }

    if(req.file){
        await cloudinary.v2.uploader.destroy(userExists.avatar.public_id)

        // copy paste from register function
        try {
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms',
                width: 250,
                height: 250 ,
                gravity: 'faces',
                crop: 'fill'
            })

            if(result){
                newUser.avatar.public_id = result.public_id 
                newUser.avatar.secure_url = result.secure_url 

                // remove file from server
                fs.rm(`uploads/${req.file.filename}`)
            }
        } catch (error) {
            return next(new AppError(500,`Cannot upload image, please try again`))
        }   
    }

    await userExists.save()

    res.status(200).json({
        success: true ,
        message: `Profile changed successfully`
    })
}

export {register,login,logout,getProfile,forgotPassword,resetPassword,changePassword,updateUser}