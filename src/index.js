// require('dotenv').config({path: './env})
import dotenv from 'dotenv'
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/connectMongo.js";

dotenv.config({
    path:'./env'
}) 

connectDB()


// import express from "express";

// const app = express();

// ;(async () => {
//      try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error" , (error) => {
//             console.log("ERROR:", error);
//         })

//         app.listen(process.env.PORT, () => {
//              console.log(`Server is listen at port ${process.env.port}`);
//         })
//      } catch (error) {
//          console.error("ERROR",error)
//          throw err 
//      }
// })()