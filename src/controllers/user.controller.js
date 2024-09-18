import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refersh and access token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation-not empty
  //check if user is already exist: username, email
  //check for image , check for avator
  // upload them to cloudinary, avator
  // create user object- create entry in DB
  //  remove password,and refresh token field from response
  // check for user creation
  //return response

  /* step get details- if get data from form, body of website use this.*/
  const { fullName, email, username, password } = req.body;
  console.log("email:", email);

  // step 2: validation
  if (fullName == "") {
    throw new ApiError(400, "fullName is required.");
  }
  if (password == "") {
    throw new ApiError(400, "password  is required.");
  }
  if (username == "") {
    throw new ApiError(400, "username is required.");
  }
  if (email == "") {
    throw new ApiError(400, "email is required.");
  }

  /* alternate method
  if([fullName,email,username,password].some((field)=>field?trim()==="")){
  throw new AprError(400, "All field are required .")
  }
  */
  if (!email.includes("@")) {
    throw new ApiError(400, "Enter valid email.");
  }

  // step 3 check user is not already exist.

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User is already exist.");
  }

  // Step4: check for avatar, image
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is reqired.");
  }

  // Step5: upload files on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // also check upload successfully or not.
  if (!avatar) {
    throw new ApiError(400, "Avatar file is reqired.");
  }
  // if (!coverImage) {
  // throw new ApiError(400, "CoverImage file is reqired.");
  // }

  // step6: create user object
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // Step 7: remove password and token while checking the user stored in Db or not
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user.");
  }

  // Step 8: return response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully ."));
});

// for login use AsyncHandler because it make connection with database
const loginUser = asyncHandler(async (req, res) => {
  // req.body->data
  // username or email
  // find the user
  // password check
  // if password wrong the error
  // access token and refresh token generate
  // send cookie
  // confirmation u login

  // fromm req.body we get all this information of login in user
  const { email, username, password } = req.body;
  console.log(email);
  //  if username or email value blank by user throw error
  if (!username && !email) {
    throw new ApiError(400, "username and email is required");
  }
  /* if you make logic for require one of them then here 
    if(!(username || email)){
    throw new ApiError(400," username or email is required.")}
  */
  //  then check username or email from data base if user input any of them

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  //  if user with that email or username doesn't exist in database then give error
  if (!user) {
    throw new ApiError(404, "user doesn't exist");
  }
  //  check password by using is passwordCorrect method by sending curr input password andd it check with saved password.
  const isPasswordValid = await user.isPasswordCorrect(password);
  // if it is not match with existed one give error
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  //  after this if both match then generate access token and refresh token by using  respective method.
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  //  send cookie by hiding password and refersh token
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //  options help to lock boundires of cookies by checking httponly means cookie shows the http status, and secure help to readonly mode on means no one edit cookie from frontend
  const options = {
    httpOnly: true,
    secure: true,
  };
  //  return status code successful logged in send cookies with options. and json data which show status , and messages
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

// to make function logoutuser need a middleware which help to get access of curr logged in user info
const logoutUser = asyncHandler(async (req, res) => {
  // here auth.middleware(custom made  middleware ) use and in routes of logged in user we use this verifyJWT middleware and insert user._id of currrent logged in user info so here we get all info current looged in user data and clear necessary data.

  // use findByAndUpdate method of monogodb method in which we fin d the value and use$set operation to set new value.
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  // cookiee save in looged in
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// get Access token again after expired
const refershAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refersh Token");
    }
    if (incomingRefreshToken != user.refreshToken) {
      throw new ApiError(401, "RefreshToken is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refersh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All field required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName: fullName, email: email } },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatarLocalPath.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.url },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const CoverImageLocalPath = req.file?.path;
  if (!CoverImageLocalPath) {
    throw new ApiError(400, "Cover Image is missing");
  }
  const coverImage = await uploadOnCloudinary(CoverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on coverImage");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: coverImage.url },
    },
    {
      new: true,
    }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated Successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refershAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
