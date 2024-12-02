import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJwt} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
       {
          name: "avatar",
          maxCount: 1
       },
       {
          name: "coverImage",
          maxCount: 1
       }
    ]),    
    registerUser
) //hence when we got to userRouter we'll be directed to path /register.
//So, here we can have every routes after the users, which will be making the code cleaner.

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
//So here we can also push two methods in one route, as we needed to verify before logging Out the user, That's why we used next() method in verifyJwt so that after it gets executed, next method will be executed.

export default router