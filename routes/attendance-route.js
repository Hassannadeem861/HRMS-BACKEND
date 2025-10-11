import express from "express";
import upload from "../middleware/multer.js";
import { uploadAttendanceExcel, getAllAttendance, getSingleAttendance,getAllAttendance1 } from "../controllers/attendance-controller.js";

const router = express.Router();

router.post(
  "/upload-attendance",
  upload.single("excelFile"),
  uploadAttendanceExcel
);

router.get("/get-all-attendance", getAllAttendance);
router.get("/get-single-attendance/:empNo", getSingleAttendance);
router.get("/get-all-attendance1", getAllAttendance1);

export default router;
