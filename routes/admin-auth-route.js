import express from "express";
import {
  register,
  login,
  getAllAmins,
  getSingleAdmin,
  logout,
  updatePassword,
  forgetPassword,
  resetPassword
} from "../controllers/admin-auth-controller.js";
import { authMiddleware, adminMiddleWare } from "../middleware/admin-middle-ware.js";
const router = express.Router();


router.post("/register", register);
router.post("/login", login);
router.get("/get-all-admins", authMiddleware, getAllAmins);
router.get("/get-single-admin/:id", authMiddleware, getSingleAdmin);
router.get("/logout", logout);
router.post("/forget-password", forgetPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/update-password/:id", authMiddleware, updatePassword);


export default router;