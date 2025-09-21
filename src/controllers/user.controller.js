import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import{ User} from '../models/user.model.js';
import{uploadOnCloudinary} from '../utils/CloudinaryfileUpload.js'
import {ApiResponse } from '../utils/ApiResponse.js';

/* 
**********Breakdown***********
get user details
validation - fields should not be empty
check email, username is unique
check if user already exists - username, email
check for images and avatars
upload them to cloudinary
create user object - create entry to db
remove password and refresh token field from response
check for user creation
return res || error user not created
*/

const registerUser = asyncHandler( async(req,res) => {

    const{fullname,username,email,password}=req.body;  // Get user details
    // console.log(email,password);

    if([fullname,username,email,password].some((field)=> field?.trim() === "")){//yahan par hum sab fields ko ek hee saath check krr rhe hai ki woh empty hai ya nh or we can check by one by one using if condition
        throw new ApiError(400, "all fields are required"); //validation
    }

    const existedUser = User.findOne({  
        $or:[{username},{email}]
    })

    if(existedUser){  //validation for username and email
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;   //files is the multer function like req.body is of express.
    const coverImageLocalPath= req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required"); 
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400," Avatar file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select("-password -refreshToken"); // select ka use yahan par koun koun se field select hoke nh aayege

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered Successfully!!")
    )


})

export {registerUser}