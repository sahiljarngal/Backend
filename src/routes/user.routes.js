import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
// here is route for logged in user
route.route("/login").post(loginUser);
// secured routes
// here route of logout we insert middle bare before loginuser function so middle ware have access of user so they do alls their work (auth.middleware when next() method trigger from this middleware then logout user trigger)
router.route("/logout").post(verifyJWT, logoutUser);
export default router;
