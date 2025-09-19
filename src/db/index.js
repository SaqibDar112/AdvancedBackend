import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async() =>{
    try {
        const connectionInstance  = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MongoDB connected✅ DB Host : ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("error connecting to db",error);
        throw error;
    }
}

export default connectDB;