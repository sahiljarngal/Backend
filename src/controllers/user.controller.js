import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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
export { registerUser };
