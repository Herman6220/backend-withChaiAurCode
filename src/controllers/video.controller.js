import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { application } from "express"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description} = req.body
        // TODO: get video, upload to cloudinary, create video
        if(!title && !description){
            throw new ApiError(400, "Title and description are required for video.")
        }

        const videoFileLocalPath = req.files?.videoFile[0]?.path
        
        let thumbnailLocalPath;
        if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0){
            thumbnailLocalPath = req.files.thumbnail[0].path
        }
    
        if(!videoFileLocalPath){
            throw new ApiError(400, "You need to provide a video file.")
        }
    
        const videoFile = await uploadOnCloudinary(videoFileLocalPath)
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        
        // console.log(videoFile);
    
        if(!videoFile){
            throw new ApiError(400, "You need to have a video file in order to upload.")
        }
    
        const video = await Video.create({
            videoFile: videoFile.url,
            thumbnail: thumbnail?.url || "",
            title,
            description,
            duration: videoFile.duration,
            owner: req.user?._id
        })
        
        if(!video){
            throw new ApiError(500, "There has been some internal server error while creating the video")
        }

        const createdVideo = await Video.findById(video._id).populate("owner", "-password -watchHistory -createdAt -updatedAt -refreshToken")
    
        
        return res
        .status(200)
        .json(new ApiResponse(200, createdVideo, "Video has been uploaded successfully."))
    } catch (error) {
        console.error("Error while creating video:", error);
        throw new ApiError(500, "There has been some internal server issue.")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        //TODO: get video by id
        if(!videoId){
            throw new ApiError(400, "Please provide video id in order to get the video.")
        }
    
        const video = await Video.findById(videoId)
    
        if(!video){
            throw new ApiError(500, "There has been some internal server issue while fetching the video.")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, video, "The video has been fetched succesfully"))
    } catch (error) {
        throw new ApiResponse(500, "There has been some internal server issue.")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        //TODO: update video details like title, description, thumbnail
        if(!videoId){
            throw new ApiError(400, "Video Id is required to update the video.")
        }
    
        const { title, description } = req.body
        if(!title && !description){
            throw new ApiError(400, "Title and Description are required to update the video.")
        }
    
        // const thumbnailLocalPath = req.files?.thumbnail[0]?.path
        let thumbnailLocalPath;
        if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0){
            thumbnailLocalPath = req.files.thumbnail[0].path
        }
        
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
        console.log(thumbnail);
    
        const updatedVideo = await Video.findOneAndUpdate(
            {_id: videoId},
            {$set: {
                title: title,
                description: description,
                thumbnail: thumbnail?.url
            }},
            {new: true}
        )
    
        if(!updatedVideo){
            throw new ApiError(500, "There has been some internal server error while updating the video.")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "The video has been updated succesfully."))
    } catch (error) {
        throw new ApiError(500, "there has been some internal server error.")
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        //TODO: delete video
        if(!videoId){
            throw new ApiError(400, "Please provide the Id of the video that has to be deleted.")
        }
    
        const deletedVideo = await Video.findByIdAndDelete(new mongoose.Types.ObjectId(videoId))
    
        if(!deletedVideo){
            throw new ApiError(500, "there has been some internal server issue while delwting the video.")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, deletedVideo, "The video has been deleted succesfully"))
    } catch (error) {
        throw new ApiError(500, "there has been some internal sever error.")
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}