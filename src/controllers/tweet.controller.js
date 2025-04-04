import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    //get user and tweet
    //validate user
    //validate tweet
    //create tweet
    try {
        const {owner, content} = req.body

        if(!owner || !content){
            throw new ApiError(400, "username and content is required")
        }

        const user = await User.findOne({username: owner})
        if(!user){
            throw new ApiError(400, "user not found or doesn't have an account, so create it")
        }

        const tweet = await Tweet.create({
            owner: user._id,
            content
        })
        
        const newTweet = await Tweet.findById(tweet._id).populate("owner", "-password -watchHistory -refreshToken")

        return res
        .status(200)
        .json(new ApiResponse(200,newTweet, "Your tweet has been created succesfully"))
    } catch (error) {
        throw new ApiError(500,error, "Some error occured while creating tweets.")
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    try {
        const {userId} = req.params
    
        const realUserId = new mongoose.Types.ObjectId(userId)

    
        const tweet = await User.aggregate([
            {
                $match: {
                    _id: realUserId
                }
            },
            {
                $lookup: {
                    from: "tweets",
                    localField: "_id",
                    foreignField: "owner",
                    as: "allTweets"
                }
            },
            {
                $addFields: {
                    totalTweets: "$allTweets"
                }
            },
            {
                $project: {
                    fullname: 1,
                    username: 1,
                    totalTweets: 1,
                    avatar: 1,
                    email: 1
                }
            }
        ])
        console.log(tweet[0]);
    
        if(!tweet?.length){
            throw new ApiError(400, "You have never tweeted, Please tweet")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, tweet[0], "All tweets have been fetched successfully"))
    } catch (error) {
        throw new ApiError(500, error, "There has been some internal server issue while fetching your tweets")   
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {tweetId} = req.params
    const {updatedTweet} = req.body

    if(!tweetId || !updatedTweet){
        throw new ApiError("Tweet or which tweet to update is not defined.")
    }

    const realTweetId = new mongoose.Types.ObjectId(tweetId)
    
    const tweet = await Tweet.findByIdAndUpdate(
        realTweetId,
        {
            $set: {
                content: updatedTweet
            }
        }
    )
    
    return res.status(200).json(new ApiResponse(200, tweet, "Your tweet has been updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    try {
        const {tweetId} = req.params
    
        if(!tweetId){
            throw new ApiError(400, "Please give the id of the tweet you would like to delete")
        }
        //const deletedTweet = await Tweet.deleteOne({tweetId}) >>> this will not work as the _id that we get is a string which is then converted by mongoose through its ObjectId method in it's backend, but this time it wasn't working so we had to change it explicitely from our side.
        const deletedTweet = await Tweet.deleteOne({_id: new mongoose.Types.ObjectId(tweetId)})
    
        if(!deletedTweet){
            throw new ApiError(500, "There has been some error while deleting the tweet")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200, deletedTweet, "Your tweet has been deleted succesfully"))
    } catch (error) {
        throw new ApiError(500,error, "There has been some server issues while deleting your tweet.")
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}