// this is custom middlemare used to access of token of current logged in user

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

//  make function
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // token store req. cookie. aceestoken and if mobile user use website then all this information come in header name by Authorization and token name Bearer so we use replace the value of use replace starting name Bearer (space) to "" empty so get token ( eg bfore Bearer 29u9882 , after replace 29u9882 )
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    // if not get token then show error
    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    //  here we decode Token by using jwt verify and secret key from .env
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    //  here we get access oof refersh token then search _id of user and hide password and refersh token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    //  if not get show error
    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    //  here add .user in req the value of above user
    req.user = user;
    // next () method used to tell my work done u continue you next work
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
