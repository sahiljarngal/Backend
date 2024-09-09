import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,

      trim: true,
      index: true,
    },
    avatar: {
      type: String /* cloudinary url*/,
      required: true,
    },
    coverImage: {
      type: String /* cloudinary url*/,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
//  this middleware do something just before the save the data it encrypt the password in hash code by using this.password= bcrypt.hash(this.password, 10(this the total number  of times  to performing hashing on your password use select any no of times but more no will also decrease the performace so  use appropriate ))
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
//  this custom method used to check the password entered is same as the actual method which is stored in DB very first in hashCode language this is time atken process thenit is we used asyn await
userSchema.methods.isPasswordCorrect = async function (password) {
  //  compare the password and the actual hash password  it return true or false
  return await bcrypt.compare(password, this.password);
};
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      fullName: this.fullName,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
/* export user schema by the name of User which is write in " " commas in data base it save in plural form Users*/
export const User = mongoose.model("User", userSchema);
