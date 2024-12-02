import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { json } from "express";


const generateAccessAndRefreshTokens = async(userId) => {
   try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false}) //here because user is coming through mongoose, it gets a save method,But when we use save what happens is it kicks in some fields , so it kicks in the password field as well as in it is trying to validate the user, but here we aren't giving password but one parameter only, hence we would be needing to false the validateBeforeSave. 

      return {accessToken, refreshToken}
      
   } catch (error) {
      throw new ApiError(500, "Something went wrong while generating tokens.")
   }
}


const registerUser = asyncHandler( async (req, res) => {
     //get user details from frontend(we can also do that with postman)
     //validation - not empty
     //check if user already exists: username & email
     //check for images,check for avatar
     //upload images to cloudinary, avatar double check
     //create user object- create entry in db
     //remove password, refresh token field from response
     //check for user creation
     //return response


     const {fullname, username, email, password} = req.body
     console.log(`username: ${username}, email: ${email}`);
     console.log(req.body);

     if (
        [fullname, email, username, password].some((field) => (
            field?.trim() === ""
        ))
     ) { 
        throw new ApiError(400,"All field are required")
     }
     
     const existedUser = await User.findOne({
        $or: [{ username }, { email }]
     })

     if(existedUser){
        throw new ApiError(409, "User with this username or email already exists, Please login.")
     }
     console.log(req.files);

     const avatarLocalPath = req.files?.avatar[0]?.path
     
   //   const coverImageLocalPath = req.files?.coverImage[0]?.path;
     
     let coverImageLocalPath;
     if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path
     }




     if(!avatarLocalPath){
        throw new ApiError(400,"You need to have an Avatar")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)
     
     if(!avatar){
        throw new ApiError(400,"You need to have an Avatar")
     }
 
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
     })
     const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
     ) 
     if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
     }

     return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
     )
     //here we are finding if the user has been created, MongoDb adds an _id field whenever we create an element.
     //also we are selecting the elements we don't want to select, as all the elements get selected as default.  

} )

const loginUser = asyncHandler( async(req, res) => {
    // req body -> data
    // username or email
    // find the user
    // validate password
    // access & refresh token
    // send cookies
    // send response that user has logged in

    const {email, username, password} = req.body
    console.log("email:",email);

    if(!username && !email){
      throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
      $or: [{username}, {email}] //here findOne will find property which is given in parameter and then come out of loop.
      // In normal cases it would have been written as User.findOne({username}) , if we had only one requirement , but here we want two, hence we can use $or operator where you can define an array which take object inside. 
      // here whichever property would be found first will be taken and loop ends.As we want only one - either username or email.
    })

    if (!user){
      throw new ApiError(404, "User doesn't exist!!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
      throw new ApiError(401, "You entered the wrong password!!, try again")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
      httpOnly: true,
      secure: true
    }//after doing httpOnly true and secure true, then cookies can only be modified through server side and not from the frontend side.It can be observed through frontend side but can only be modified through server side.

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
           { 
            user: loggedInUser, accessToken,
            refreshToken
           },
           "User logged In Successfully"
      )
    )

})

const logoutUser = asyncHandler (async (req, res) =>{
     await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: undefined
         }
      },
      {
         new: true
      }
     )

     const options = {
      httpOnly: true,
      secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandler(async (res, req) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
      throw new ApiError(401, "unauthorized request")
   }

   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )
   
      const user = await User.findById(decodedToken?._id)
      
      if(!user){
         throw new ApiError(401, "Invalid refresh token")
      }
   
      if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401, "Refresh token is expired or used")
      }
   
      const options = {
         httpOnly: true,
         secure: true
      }
   
      const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
   
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
         new ApiResponse(
            200,
            {accessToken, refreshToken: newRefreshToken},
            "Access Token refreshed successfully"
         )
      )
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid Refresh Token")
   }
})

const changeCurrentPassword = asyncHandler(async(re,res)  => {
   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect){
      throw new ApiError(400,"Invalid old passwprd")
   }

   user.password = newPassword
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(new ApiResponse(200, {}, "Password changed succcessfully"))
})

const getCurrentUser = asyncHandler(async(req,res) => {
   return res.status(200)
   .json(200, req.user, "Current User fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) => {
   const {fullname, email} = req.body

   if(!fullname || email){
      throw new ApiError(400, "All fields are required")
   }

   const user = User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullname,
            email: email
         }
      },
      {new: true}

   ).select("-password")

   return res
   .status(200)
   .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
      throw new ApiError(400, " Error while uploading avatar")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
         avatar: avatar.url
        }
      },
      {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(200, user, "Avatar updated successfully")
   )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
   const coverImageLocalPath = await req.file?.path

   if(!coverImageLocalPath){
      throw new  ApiError(400, "Cover Image file is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
      throw new ApiError(400, "Error while uploading cover Image")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url
         }
      },
      {new: true}
   ).select("-password")

   return res
   .status(200)
   .json(
      new ApiResponse(200, user, "Cover Image updated successfully")
   )
})


export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage
}