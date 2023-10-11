import User from "../models/userModel.js"
import { razorpay } from "../server.js"
import AppError from "../utils/errorUtil.js"
import Razorpay from 'razorpay'
import crypto from 'crypto'
import payment from '../models/paymentModel.js'

const getRazorpayApiKey = async (req,res,next) =>{
    try {
        res.status(200).json({
            success: true ,
            message: 'Razorpay API key',
            key: process.env.RAZORPAY_KEY_ID
        })
    } catch (error) {
        return next(
            new AppError(400,e.message)
        )
    }
}

const buySubscription = async (req,res,next) =>{
    try {
        const {id} = req.user
        const user = await User.findById(id)
    
        if(!user){
            return next(
                new AppError(400,'Unauthorized, please login again')
            )
        }
    
        if(user.role === 'ADMIN'){
            return next(
                new AppError(400,'Admin cannot purchase a subscription')
            )
        }
    
        const subscription = new razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify:1,
        })
    
        user.subscription.id = subscription.id
        user.subscription.status = subscription.status
    
        await user.save()
    
    
        res.status(200).json({
            success: true,
            message: 'Subscribed successfully',
            subscription_id: subscription.id
        })
    } catch (error) {
        return next(
            new AppError(400,e.message)
        )
    }
}

const verifySubscription = async (req,res,next) =>{
    try {
        const {id} = req.user
        const {razorpay_payment_id,razorpay_signature,razorpay_subscription_id} = req.body
    
        const user = await User.findById(id)
    
        if(!user){
            return next(
                new AppError(400,'Unauthorized, please login again')
            )
        }
    
        const subscriptionID = user.subscription.id
    
        const generatedSignature = crypto
            .createHmac('sha256',process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${subscriptionID}`)
            .digest('hex')
    
        if(generatedSignature !== razorpay_signature){
            return next(
                new AppError(400,'Payment not verified, please try again')
            )
        }
    
        await payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id
        })
    
        user.subscription.status = 'active'
        await user.save()
    
        res.status(200).json({
            success:true,
            message: 'Payment verified successfully'
        })
    } catch (error) {
        return next(
            new AppError(400,e.message)
        )
    }

}

const cancelSubscription = async (req,res,next) =>{
    try {
        const {id} = req.user
        const user = await User.findById(id)

        if(!user){
            return next(
                new AppError(400,`Unauthorized please login again`)
            )
        }

        if(user.role === 'ADMIN'){
            return next(
                new AppError(400,`Admin cannot purchase a subscription`)
            )
        }

        const subscriptionID = user.subscription.id

        const subscription = razorpay.subscriptions.cancel(subscriptionID)

        user.subscription.status = subscription.status

        await user.save()
    } catch (error) {
        return next(
            new AppError(400,e.message)
        )
    }
}

const allPayments = async (req,res,next) =>{
    try {
       const {count} = req.query
       
       const subscriptions = await razorpay.subscriptions.all({
            count: count || 10
       })

       res.status(200).json({
            success: true,
            message: 'All payments',
            subscriptions
       })

    } catch (error) {
        return next(
            new AppError(400,e.message)
        )
    }
}


export {getRazorpayApiKey,buySubscription,verifySubscription,cancelSubscription,allPayments}