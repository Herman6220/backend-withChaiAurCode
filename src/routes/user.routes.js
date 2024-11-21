import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

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


export default router