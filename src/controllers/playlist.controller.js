import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    try {
        const {name, description} = req.body
    
        //TODO: create playlist
    
        if(!name || !description){
            throw new ApiError(400, "Name and Description are required to create a playlist")
        }
    
        const playlist = await Playlist.create({
            name,
            description,
            owner: req.user?._id
        })
    
        if(!playlist){
            throw new ApiError(500, "There has been some internal server issues while creating your playlist")
        }

        const newPlaylist = await Playlist.findById(playlist._id).populate("owner", "-password -watchHistory -createdAt -updatedAt -refreshToken")
    
        return res
        .status(200)
        .json(new ApiResponse(200, newPlaylist, "Your playlist has been created successfully"))
    } catch (error) {
        throw new ApiError(500, "There has been some internal server issue")
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    try {
        const {userId} = req.params
        //TODO: get user playlists
    
        if(!userId){
            throw new ApiError(400, "Please provide user Id to get users playlist")
        }
    
        const realUserId = new mongoose.Types.ObjectId(userId)
    
        const playlist = await User.aggregate([
            {
                $match: {
                    _id: realUserId
                }
            },
            {
                $lookup: {
                    from: "playlists",
                    localField: "_id",
                    foreignField: "owner",
                    as: "totalPlaylist"
                }
            },
            {
                $addFields: {
                    usersPlaylist: "$totalPlaylist"
                }
            },
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    email: 1,
                    usersPlaylist: 1,
                    avatar: 1
                }
            }
        ])
    
        if(!playlist?.length){
            throw new ApiError(404, "This user has never created a playlist")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, playlist[0], "Playlists have been fetched successfully"))
    } catch (error) {
        throw new ApiError(500, error, "There has been some internal server error while fetching the playlist");
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    try {
        const {playlistId} = req.params
        //TODO: get playlist by id
    
        if(!playlistId){
            throw new ApiError(404, "Please provide valid playlist Id")
        }
    
        // const realPlaylistId = new mongoose.Types.ObjectId(playlistId)
        
        const playlist = await Playlist.findById(playlistId).populate("owner", "-password -watchHistory -createdAt -updatedAt -refreshToken")
    
        return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Required playlist has been fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "There has been some internal server error while fething required playlist.")
    }

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400, "Please provide the Video Id and playlist Id.")
    }

    const playlist = await User.aggregate([
        {
            $match: {
                // _id: 
            }
        }
    ])
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId} = req.params
        // TODO: delete playlist
        if(!playlistId){
            throw new ApiError(400, "Please provide the Id of the playlist you would like to delete")
        }
    
        const deletedPlaylist = await Playlist.findByIdAndDelete({_id: new mongoose.Types.ObjectId(playlistId)})
    
        if(!deletedPlaylist){
            throw new ApiError(400, "Given Id is incorrect")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, deletedPlaylist, "Playlist has been deleted successfully."))
    } catch (error) {
        throw new ApiError(500, "There has been some internal server error while deleting the playlist.")
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    try {
        const {playlistId} = req.params
        const {name, description} = req.body
        //TODO: update playlist
    
        if(!playlistId){
            throw new ApiError(400, "Please provide the Id of playlist which has to be updated")
        }
        if(!name && !description){
            throw new ApiError(400, "Please give the fields that need to be updated.")
        }
    
        const updatedPlaylist = await Playlist.findOneAndUpdate(
            {_id: new mongoose.Types.ObjectId(playlistId)},
            { $set: {
                name: name,
                description: description
            }},
            {new: true}
        )
        console.log(updatedPlaylist);
    
        if(!updatedPlaylist){
            throw new ApiError(400, "Given playlist Id is incorrect.")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Playlist has been updated succesfully"))
    } catch (error) {
        throw new ApiError(500, "There has been some internal server error while updating the playlist.")
    }
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}