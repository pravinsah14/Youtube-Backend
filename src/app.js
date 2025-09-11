import express from "express"
import cors from "cors"
import cookieParser  from "cookie-parser"

const app = express()
 
/// middlewares 
 app.use(cors({
     origin: process.env.Cors_origin   /// allow to use this port only from frontend
 })) 

 app.use(express.json({limit:"16kb"}))
 app.use(express.urlencoded({extended:true , limit:"16kb"}))  
 app.use(express.static("Public")) 
 app.use(cookieParser())

export {app}