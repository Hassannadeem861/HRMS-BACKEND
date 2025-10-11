import express from "express";
import {
  createLeave,
  getAllLeaves,
  getLeave,
  updateLeave,
  deleteLeave,
} from "../controllers/leave-controller.js";

const router = express.Router();

router.post("/create-leave", createLeave);
router.get("/get-leaves", getAllLeaves);
router.get("/get-leave/:leaveId", getLeave);
router.put("/update-leave/:leaveId", updateLeave);
router.delete("/delete-leave/:leaveId", deleteLeave);

export default router;
