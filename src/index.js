import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import app from './app.js';


dotenv.config({
  path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
      console.log(`App at ${process.env.PORT}`);
    });
})
.catch(error,()=>{
  console.log("MongoDB connection failed ❌",error);
  throw error;
})

































/* 
import express from 'express'
const app = express();

(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

       app.on("error",(error)=>{
        console.log("Error",error);
        throw error;
       })

       app.listen(process.env.PORT,()=>{
        console.log(`App is running at localhost: ${process.env.PORT}`);
       });

    } catch (error) {
        console.log("Error connecting to DB",error)
    }
})()  //using iffy ()() function here for fatser execution learned at js  
  another approach at db folder 
*/