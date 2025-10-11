// import multer from "multer";
// import path from "path";
// import { v4 as uuidv4 } from "uuid";

// const storage = multer.diskStorage({
//   destination: "public/uploads",
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, `${file.fieldname}-${uuidv4()}${ext}`);
//   },
// });

// const upload = multer({ storage });

// export default upload;


import multer from "multer";

// ✅ VERCEL COMPATIBLE: Use memory storage instead of disk storage
const storage = multer.memoryStorage(); // No file system writes

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // ✅ Allow only Excel files
    if (file.mimetype === 'application/vnd.ms-excel' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.match(/\.(xlsx|xls)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'), false);
    }
  }
});

export default upload;