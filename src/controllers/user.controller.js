import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import{ User} from '../models/user.model.js';
import{uploadOnCloudinary} from '../utils/CloudinaryfileUpload.js'
import {ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId);
        const AccessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {AccessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500, "Token Error : Error while generating Tokens")
    }
}

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

    const existedUser = await User.findOne({  
        $or:[{username},{email}] //check in db whether user exists or not
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
        throw new ApiError(400," Avatar file is required to upload");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken"); // select ka use yahan par hai ki koun koun se field select hoke nh aayege

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, "User registered Successfully!!")
    )
})

const loginUser = asyncHandler( async (req,res)=>{
    // req.body -> data
    // email or username
    // validate username or email
    // validate password
    // access and refresh token
    // send cookie

    const {email,password,username} = req.body

    if(!username && !email){
        throw new ApiError(400," Username or email is required");
    }

    const user = await User.findOne({
        $or:[{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401," User or password is incorrect.Try again");
    }
    
    const {AccessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedIn = await User.findById(user._id).select("-password -refreshToken")

    // ab cookies ko agar data bejna hoga then.....
    
    const options={
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", AccessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json( new ApiResponse(
        200,
        {
            user: loggedIn, AccessToken,refreshToken
        },
        {
            message: "User logged in successfully"
        }
    ))
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true,
        }
    )

     const options={
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{}," User logged Out "))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken  = req.cookies.refreshToken || req.body.refreshToken   //here req.body is used if anyone is using mobile

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized access");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401," Invalid refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Tokens are expired or being used")
        }
    
        const {AccessToken,NewrefreshToken} = await generateAccessAndRefreshToken(user?._id)
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",AccessToken,options)
        .cookie("refreshToken",NewrefreshToken,options)
        .json(
            new ApiResponse(200,{AccessToken, refreshToken : NewrefreshToken},"Access token refreshed")
        )
    } catch (error) {
        throw new ApiError(error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler (async(req,res)=>{
    const{OldPassword,NewPassword}=req.body

    const user = await User.findById(req.user?._id);
    const isPasswordValid = await user.isPasswordCorrect(OldPassword)

    if(!isPasswordValid){
        throw new ApiError(401,"Old Password is invalid")
    }
    user.password= NewPassword;
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"));
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.
    status(200)
    .json(new ApiResponse(200,req.user,"User fetched successfully"));
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){  //check here 
        throw new ApiError(400, "All the above fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,   //es6 syntax here actually it is fullname:fullname
                email: email,  //we can also write email es6 syntax                          
            }
        },
        {
            new:true  ///here it gives info about updates or changes we have made 
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"));
})

const updateAvatar = asyncHandler(async(req,res)=>{

    const avatarlocalPath = req.file?.path;

    if(!avatarlocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarlocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar to cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {
            new:true
        }).select("-password"); 

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateCoverImg = asyncHandler(async(req,res)=>{

    const coverImagelocalPath = req.file?.path;

    if(!coverImagelocalPath){
        throw new ApiError(400,"coverimg file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImagelocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImg to cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {
            new:true
        }).select("-password"); 

        return res
        .status(200)
        .json(new ApiResponse(200,user,"Cover Image updated successfully"));
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username } = req.params

    if(!username?.trim()){
        throw new ApiError(400,"Username is missing");
    }


    //These are pipelines 
    const channel = await User.aggregate([
        //pipeline 1
        {
            $match:{
                username: username?.toLowerCase()
            },
        },
        // pipeline 2
        {
            $lookup: {
                from:"subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            },
        },
        //pipeline 3
        {
            $lookup:{
                from:"subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTO"
            }
        },

        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id,"$subscibers.subscriber"]},  //in checks whether subscribed or not  & $in works on both array as well as on objects
                        then:true,
                        else:false,
                    }
                }
            }
        },
        //Iss pipeline mai koun koun se fields or objects ko lena hai and 1 is for flag yes (will give selected values)
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }

    ])
    console.log("aggregate channel returns : ",channel);

    if(!channel?.length){
        throw ApiError(404,"channel doesn't exist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,channel[0]," User channel fetched successfully"));  //channel[0] to give only one object of array as it has a lot.....frontend wala bhi khush hojaye ga

})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField: "_id",
                as:" watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "owner"
                            }
                        }
                    }
                ]

            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory, "Watch history fetched successfully!! "))
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImg,
    getUserChannelProfile,
    getWatchHistory,
}