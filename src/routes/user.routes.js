import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()
router.route("/register").post(registerUser) //hence when we got to userRouter we'll be directed to path /register.
//So, here we can have every routes after the users, which will be making the code cleaner.


export default router