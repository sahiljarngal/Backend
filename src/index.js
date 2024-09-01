import dotenv from "dotenv";
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import app from "./app.js";
dotenv.config({
  path: "./.env",
});
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error : ", error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is connected on Port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(`MONGO DB failed to connect !! `, error);
  });

/*
// this is direct method to connect database to backend
import express from "express";
// give naming to express() function
const app = express();
// use auto call function ()() and make it async
(async () => {
  // always try to use try catch while connecting database
  try {
    // connect data base and after giving url of database write / database name also.
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    // if data base succesfully connected but error in backend so app.on call if any error in backend .
    app.on("error", (error) => {
      console.log("Error : ", error);
      throw error;
    });
    // if succesfully db connected and backend also run succesfully the it console port no of the server in which our app will run
    app.listen(process.env.PORT, () => {
      console.log("app is listening on Port no :", `${process.env.PORT}`);
    });
    //  in catch if the databse not connected succesfully then it return the error
  } catch (error) {
    console.error("ERROR :", error);
    throw error;
  }
})();
*/
