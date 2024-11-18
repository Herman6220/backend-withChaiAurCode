//require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import connectDb from "./db/index.js";

dotenv.config({
    path: './env'
})


connectDb()


// const connectDb = () => {}

// connectDb()  ====> Here function is declared and executed , but we have read iffe which is faster than this method.

// ()()  ====> This is iffe. It's a good practice to start iffe with a semicolon cause if semicolon has not been used in previous line, it can cause problems.




/*
import express from "express";
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR: ",error);
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ",error)
        throw error
    }
})()

*/