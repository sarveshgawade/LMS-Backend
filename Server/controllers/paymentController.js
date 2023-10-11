import user from "../models/userModel.js"
import AppError from "../utils/errorUtil.js"

const getRazorpayApiKey = async (req,res,next) =>{
    res.status(200).json({
        success: true ,
        message: 'Razorpay API key',
        key: process.env.RAZORPAY_KEY_ID
    })
}

const buySubscription = async (req,res,next) =>{
    const {id} = req.user
    const user = await user.findById(id)

    if(!user){
        return next(
            new AppError('Unauthorized, please login again',400)
        )
    }

    if(user.role === 'ADMIN'){
        return next(
            new AppError('Admin cannot purchase a subscription',400)
        )
    }
}

const verifySubscription = async (req,res,next) =>{

}

const cancelSubscription = async (req,res,next) =>{

}

const allPayments = async (req,res,next) =>{

}


export {getRazorpayApiKey,buySubscription,verifySubscription,cancelSubscription,allPayments}