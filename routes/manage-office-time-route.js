import express from "express";
import {
  createTime,
  getAllTime,
  getSingleTime,
  updateTime,
  deleteTime,
} from "../controllers/manage-office-time.js";

const router = express.Router();

router.post("/create-office-time", createTime);
router.get("/get-all-office-times", getAllTime);
router.get("/get-single-office-time/:officeTimeId", getSingleTime);
router.put("/update-office-time/:officeTimeId", updateTime);
router.delete("/delete-office-time/:officeTimeId", deleteTime);

export default router