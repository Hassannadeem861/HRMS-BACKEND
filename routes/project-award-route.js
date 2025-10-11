import express from "express";
import {
  createProjectAward,
  getAllProjects,
  getSingleProject,
  updateProject,
  deleteProject,
} from "../controllers/project-award-controller.js";

const router = express.Router();

router.post("/create-project", createProjectAward);
router.get("/get-all-projects", getAllProjects);
router.get("/get-single-project/:projectId", getSingleProject);
router.put("/update-project/:projectId", updateProject);
router.delete("/delete-project/:projectId", deleteProject);

export default router;
