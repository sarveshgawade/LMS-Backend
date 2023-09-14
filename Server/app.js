import cookieParser from 'cookie-parser'
import express from 'express'
import cors from 'cors'   
import morgan from 'morgan'
import connectToDB from './config/dbConnection.js'
import userRoute from './routes/userRoutes.js'
import courseRoute from './routes/courseRoutes.js'
import errorMiddleware from './middleware/errorMiddleware.js'
const app = express()



// CONNECTING WITH DB
connectToDB()



//  MIDDLEWARE
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials:true 
}))
app.use(morgan('dev'))



// ROUTES
app.use('/ping',(req,res)=>{
    res.send('pong')       // for testing purpose
})

app.use('/api/v1/user',userRoute)
app.use('/api/v1/courses',courseRoute)

app.all('*',(req,res)=>{    // if somebody enters url other than any route defined here 
    res.status(404).send(`Oops ! Page 404 not found !`)
})

// single middleware that can handle all the errors 
app.use(errorMiddleware)    





export default  app