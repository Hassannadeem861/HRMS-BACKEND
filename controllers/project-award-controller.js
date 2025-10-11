import ProjectAward from "../models/project-award-model.js";

const createProjectAward = async (req, res) => {
  try {
    const {
      projectName,
      projectDescription,
      budget,
      projectStack,
      projectNiche,
      notes,
      award
    } = req.body;

    if (!projectName || !budget || !projectStack || !projectNiche) {
      return res.status(400).send(`
        ❌ Required fields are missing.

        👉 Required:
        projectName
        budget
        projectStack
        projectNiche
      `);
    }

    const newProject = await ProjectAward.create({
      projectName,
      projectDescription,
      budget,
      projectStack,
      projectNiche,
      notes,
      award,
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "🎉 Project Award created successfully",
      newProject,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error creating project",
      error: error.message,
    });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectAward.find({ deleted_at: null });

    if (!projects) {
      return res.status(404).json({
        message: "✅ Project not found",
      });
    }

    return res.status(200).json({
      message: "✅ All Projects Fetched",
      projects,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error fetching projects",
      error: error.message,
    });
  }
};

const getSingleProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const project = await ProjectAward.findOne({
      _id: projectId,
      deleted_at: null,
    });

    if (!project) {
      return res.status(404).json({ message: "❌ Project not found" });
    }

    return res.status(200).json({
      message: "✅ Single project fetched",
      project,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error fetching project",
      error: error.message,
    });
  }
};

const updateProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const {
      projectName,
      projectDescription,
      budget,
      projectStack,
      projectNiche,
      notes,
      award,
    } = req.body;

    const updateFields = {
      projectName,
      projectDescription,
      budget,
      projectStack,
      projectNiche,
      notes,
      award,
      updated_at: new Date(),
    };

    const updatedProject = await ProjectAward.findOneAndUpdate(
      { _id: projectId, deleted_at: null },
      updateFields,
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({
        message: "❌ Project not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Project updated successfully",
      updatedProject,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error updating project",
      error: error.message,
    });
  }
};

const deleteProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    const deletedProject = await ProjectAward.findOneAndUpdate(
      { _id: projectId, deleted_at: null },
      { deleted_at: new Date() },
      { new: true }
    );

    if (!deletedProject) {
      return res
        .status(404)
        .json({ message: "❌ Project not found or already deleted" });
    }

    return res.status(200).json({
      message: "✅ Project deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error deleting project",
      error: error.message,
    });
  }
};

export {
  createProjectAward,
  getAllProjects,
  getSingleProject,
  updateProject,
  deleteProject,
};
