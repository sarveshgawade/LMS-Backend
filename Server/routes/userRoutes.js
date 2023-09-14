import { Router } from "express";
import { changePassword, forgotPassword, getProfile, login, logout, register, resetPassword, updateUser } from "../controllers/userController.js";
import {isLoggedIn} from "../middleware/authMiddleware.js";
import upload from '../middleware/multerMiddleware.js'

const router = Router()

// ROUTES
router.post('/register',upload.single('avatar'),register)
router.post('/login',login)
router.get('/logout',logout)
router.get('/me',isLoggedIn,getProfile )
router.post('/forgot-password',forgotPassword)
router.post('/reset-password/:resetToken',resetPassword)
router.post('/change-password',isLoggedIn,changePassword)
router.post('/update',isLoggedIn,upload.single('avatar'),updateUser)

export default router 