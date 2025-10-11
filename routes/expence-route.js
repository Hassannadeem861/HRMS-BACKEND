import express from "express";
import {
  createExpence,
  getAllExpences,
  getSingleExpence,
  updateExpence,
  deleteExpence,
} from "../controllers/expence-controller.js";

const router = express.Router();

router.post("/create-expence", createExpence);
router.get("/get-all-expences", getAllExpences);
router.get("/get-single-expence/:expenceId", getSingleExpence);
router.put("/update-expence/:expenceId", updateExpence);
router.delete("/delete-expence/:expenceId", deleteExpence);

export default router;
