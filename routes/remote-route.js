import express from "express";
import {
  createRemote,
  getAllRemote,
  getRemote,
  updateRemote,
  deleteRemote,
} from "../controllers/remote-controller.js";

const router = express.Router();

router.post("/create-remote", createRemote);
router.get("/get-remote", getAllRemote);
router.get("/get-remote/:remoteId", getRemote);
router.put("/update-remote/:remoteId", updateRemote);
router.delete("/delete-remote/:remoteId", deleteRemote);

export default router;
