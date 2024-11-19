import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res) => {
     //get user details from frontend(we can also do that with postman)
     //validation - not empty
     //check if user already exists: username & email
     //check for images,check for avatar
     //upload images to cloudinary, avatar double check
     //create user object- create entry in db
     //remove password, refreah token field from response
     //check for user creation
     //return response


     const {fullname, username, email, password} = req.body
     console.log(`username: ${username}, email: ${email}`);

     if (
        [fullname, email, username, password].some((field) => (
            field?.trim() === ""
        ))
     ) { 
        throw new ApiError(400,"All field are required")
     }
     
     const existedUser = User.findOne({
        $or: [{ username }, { shift }]
     })

     if(existedUser){
        throw new ApiError(409, "User with this username or email already exists, Please login.")
     }

     const avatarLocalPath = req.files?.avatar[0]?.path
     const coverImageLocalPath = req.files?.coverImage[0]?.path

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

export {registerUser}