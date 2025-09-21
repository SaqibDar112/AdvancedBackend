import express from 'express'
import cookieParser from 'cookie-parser';
import cors from 'cors'


const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        credentials:true,
    }
))

// kahan kahan se data aayega
app.use(express.json({limit: "16kb"}))  //json format me agar aaya
app.use(express.urlencoded({extended:true, limit:'16kb'})) //agar url se aaya
app.use(express.static("public")) //form se agar aaya
app.use(cookieParser()) //cookies se agar aaya or bej diya

// router imports
import userRouter from './routes/user.routes.js'
// app.use("/users",userRouter)    //http://localhost:8000/users/
app.use("/api/v1/users/",userRouter)  //best practice http://localhost:8000/api/v1/users/


export default app;