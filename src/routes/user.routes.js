import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refershAccessToken,
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
router.route("/login").post(loginUser);
// here route of logout we insert middle bare before loginuser function so middle ware have access of user so they do alls their work (auth.middleware when next() method trigger from this middleware then logout user trigger)
// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("refresh-Token").post(refershAccessToken);
export default router;
