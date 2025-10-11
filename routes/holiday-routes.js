import express from "express";
import {
  createHoliday,
  getAllHolidays,
  getHoliday,
  updateHoliday,
  deleteHoliday,
} from "../controllers/holiday-controller.js";

const router = express.Router();

router.post("/create-holiday", createHoliday);
router.get("/get-holidays", getAllHolidays);
router.get("/get-holiday/:holidayId", getHoliday);
router.put("/update-holiday/:holidayId", updateHoliday);
router.delete("/delete-holiday/:holidayId", deleteHoliday);

export default router;
