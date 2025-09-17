import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import  {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


   /// generation of tokens methods 

 const generateAccessAndRefreshTokens = async(userId) => {

         try {
              
             const user = await User.findById(userId) 
             const accessToken = user.generateAccessToken()
             const refreshToken = user.generateRefreshToken()

             user.refreshToken = refreshToken

             await user.save({ validateBeforeSave: false }) 

             return {accessToken , refreshToken }

         } catch (error) {
              throw new ApiError(500, "Something went wrong while generating refreshToken")
         }
 }

const registerUser = asyncHandler( async (req, res) => {

         // 1. get user details from frontend
         // 2. validaton - not empty
         // 3. check if user already exists : username , email
         // 4. check from image , check fro avatar
         // 5. upload them to cloudinary , avatar
         // 6. create user object - create entry in db
         // 7. remove password and refresh token field from response
         // 8. check for user creation
         // 9. return res


           // 1. 
            const {fullName , username , email, password} = req.body
           // console.log("email:" , email);
         //   console.log(req.body);

            // 2.
            if(fullName === "" || username === "" || email ==="" || password === ""){
                throw new ApiError(400, "All filed is required")
            }
           
          // 3.
          const existedUser = await User.findOne({
                $or: [{ username } , { email }]
             })
           
             if(existedUser){
                 throw new ApiError(409 , "user with this username or email is already exist")
             } 

            // console.log(req.files);

           // 4.

            const avatarLocalPath =  req.files?.avatar[0]?.path;
           // const coverImageLocalPath = req.files?.coverImage[0]?.path;

            // secondWay of check for coverImagePath
            let coverImageLocalPath;
            if(req.files && Array.isArray(req.files.coverImage)
             && req.files.coverImage.length > 0) {
                coverImageLocalPath = req.files.coverImage[0].path
            }

            if(!avatarLocalPath){
               throw new ApiError(400, "Avatar file is required")
            }
          
          // 5.

               const avatar = await uploadOnCloudinary(avatarLocalPath) 

               const coverImage  = await uploadOnCloudinary(coverImageLocalPath)

               if(!avatar){
                   throw new ApiError(400, "Avatar file is required")
               }
             
               // 6.

             const user = await User.create({
                  fullName,
                  avatar: avatar.url,
                  coverImage : coverImage?.url || "",
                  email,
                  password,
                  username:username.toLowerCase()
        })

            const createdUser = await User.findById(user._id).select(
                "-password -refreshToken"
            )
          
            if(!createdUser){
               throw new ApiError(500, "Something went wrong while regstering the user")
            }
        
           return res.status(201).json(
              new ApiResponse(200, createdUser, "User Registered succefully")
           )
          
})


const loginUser = asyncHandler( async (req,res) => {
           
          /// 1. req body -> data
          // 2. username or email based login
          // 3. find the user
          // 4. password check
          // 5. access and refresh token generate
          // 6. send cookies 
          // 7. send req
        
          // 1.
            const {email , username , password} = req.body
           
            // 2.

            if(!email && !username){
              throw new ApiError(400 , "email or username is required")
           }

             // 3. 

             // User.findOne({email}) if we can find by email then this code write

            const user = await User.findOne({
                  $or: [{username} , {email}]      /// we find by the both optional can we find by any one
             })

             if(!user){
                throw new ApiError(404 , "user is not find")
             }

             // 4.

             const isPasswordValid = await user.isPasswordCorrect(password)

             if(!isPasswordValid){
                throw new ApiError(401 , "Password is incorrect")
             }

             /// 5. 

             const {accessToken , refreshToken } = await generateAccessAndRefreshTokens(user._id)

             const loggedIn = await User.findById(user._id).select("-password -refreshToken")

            /// 6. cookies  only generate by server not by frontend due by method run

              const options = {    
                  httpOnly: true,
                  secure: true
              } 
        
           return res
                   .status(200)
                   .cookie("accessToken" , accessToken, options)
                   .cookie("refreshToken", refreshToken, options)
                   .json(new ApiResponse(200, {
                         user: loggedIn , accessToken , refreshToken
                   }, "User logged in Successfully" ))
                  
})

    const logoutUser = asyncHandler( async (req,res) => {
          await User.findByIdAndUpdate(
              req.user._id,
              {
                $set:{
                   refreshToken : undefined
                }
              },

              {
                 new : true
              }
           )

            const options = {   
                  httpOnly: true,
                  secure: true
              }
            
            return res 
            .status(200)
            .clearCookie("accessToken" , options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged Out "))
    }) 

    const refreshAccessToken = asyncHandler(async (req,res) => {
           const incomingRefreshToken = req.cookies.
            refreshToken || req.body.refreshToken

            if(!incomingRefreshToken){
               throw new ApiError(401, "unauthorized request")
            }

              try {
               const decodedToken = jwt.verify(
                  incomingRefreshToken,
                  process.env.REFRESH_TOKEN_SECRET
               )
 
               const user = User.findById(decodedToken?._id) 
 
               if(!user){
                  throw new ApiError(401, "Invalid refresh token")
               }
 
               if(incomingRefreshToken != user?.refreshToken){
                  throw new ApiError(401, "Refresh token is expired or used") 
               } 
 
                const options = {
                     httpOnly: true,
                     secure:true
                }
 
                 const {accessToken ,  newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
                
                   return res
                    .status(200)
                    .cookies("accessToken" , accessToken , options)
                    .cookies("refreshToken" , newRefreshToken , options)
                    .json(
                        new ApiResponse(
                           200,
                           {accessToken, refreshToken: newRefreshToken},
                           "Access token refreshed"
                        )
                    )
              } catch (error) {
                 throw new ApiError(401, error?.message || "Invalid refresh token")
              }
    })

export {registerUser, loginUser, logoutUser , refreshAccessToken}