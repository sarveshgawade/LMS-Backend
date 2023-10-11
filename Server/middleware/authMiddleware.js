import jwt from 'jsonwebtoken'
import AppError from "../utils/errorUtil.js"


const isLoggedIn = async (req,res,next)=>{
    const {token}= req.cookies
    console.log(`TOKEN => ${token}`);
    if(!token){
        return next(new AppError(500,`Unauthenticated, please try again`))
    }

    const userDetails = await jwt.verify(token,process.env.SECRET)

    req.user = userDetails

    next() 
}

const  authorizedRoles = (...roles) => async (req,res,next) =>{
    const currentRole = req.user.role

    if(!roles.includes(currentRole)){
        return next(new AppError(500,`You do not the permission to access this route`))
    }

    next()
} 

const authorizedSubscriber  = async(req,res,next)=>{
    const subscription = req.user.subscription
    const currentRole = req.user.role

    if(currentRole !== 'ADMIN' && subscription.status !== 'active'){
        return next(
            new AppError(403,`Please subscribe to access this route`
        ))
    }

    next()
}
export  {isLoggedIn,authorizedRoles,authorizedSubscriber}   