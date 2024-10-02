import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

(async function () {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
})();

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto" /* resource type like video, image etc */,
    });
    // file has been uploaded successfull
    console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(
      localFilePath
    ); /*remove the locally saved temporary file as the upload operation got failed*/
    return null;
  }
};
// Delete old uploades avatar and coverimage
const deleteFromCloudinary = async (imageUrl) => {
  const publicId = imageUrl.split("/").slice(-2)[0];
  console.log(publicId);
  if (!publicId) {
    throw new ApiError(400, "publicId is missing.");
  }
  await cloudinary.uploader.destroy(publicId, (error, result) => {
    if (error) {
      throw new ApiError(
        500,
        "existing file could not be deleted from cloudinary"
      );
    }
  });
};
export { uploadOnCloudinary, deleteFromCloudinary };
