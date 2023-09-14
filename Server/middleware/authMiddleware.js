import jwt from 'jsonwebtoken'
import AppError from "../utils/errorUtil.js"
import asyncHandler from '../middleware/asyncHandler.js'

const isLoggedIn = asyncHandler(async (req,res,next)=>{
    const {token}= req.cookies
    console.log(`TOKEN => ${token}`);
    if(!token){
        return next(new AppError(500,`Unauthenticated, please try again`))
    }

    const userDetails = await jwt.verify(token,process.env.SECRET)

    req.user = userDetails

    next() 
})

export default isLoggedIn