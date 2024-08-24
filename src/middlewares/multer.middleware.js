// multer is used for uploading files.
import multer from "multer";
// we use diskStorage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // cb means callback function.
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage: storage,
});
