import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();
// COrs used to setting up the middlewares means give access to which origin, whitelisting and other
app.use(
  cors({
    origin: process.env.CORE_ORIGIN,
    credentials: true,
  })
);
// this use method used to use middleware who take json data from anywhere Like forms submmition etc and take only till certain limit which i set 16kb you set which u want which compartible for ur server and handle data easily.
app.use(express.json({ limit: "16kb" }));

// to access url data we use |
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// to reserve some file public(set public name u select any) to access anyone like some pdfs,images.
app.use(express.static("public"));
app.use(cookieParser());

//  routes import
import userRouter from "./routes/user.routes.js";

// route declaration

// use middle ware instead of direct use .get("route", function) beacause here we define route in diff. file . 

//  this middle tells when this route hits forward next work userRouter(which is custom name of our Route file of user.routes.js file)
app.use("/api/v1/users", userRouter);
export default app;
