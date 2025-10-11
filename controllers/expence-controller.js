import Expence from "../models/expense-model.js";

const createExpence = async (req, res) => {
  try {
    const { date, reason, amount, type } = req.body;

    if (!date || !reason || !amount || !type) {
      return res.status(400).send(`
        ❌ Required fields are missing.

        👉 Required:
        date:
        reason:
        amount:
        type:
      `);
    }

    const newExpence = await Expence.create({
      date,
      reason,
      amount,
      type,
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "✅ Expence created successfully",
      newExpence,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error creating expence",
      error: error.message,
    });
  }
};

const getAllExpences = async (req, res) => {
  try {
    const expences = await Expence.find({ deleted_at: null });
      if (!expences) {
      return res.status(404).json({
        message: "✅ Expences not found",
      });
    }
    return res.status(200).json({
      message: "✅ All Expences fetched",
      expences,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error fetching expences",
      error: error.message,
    });
  }
};

const getSingleExpence = async (req, res) => {
  const { expenceId } = req.params;
  try {
    const expence = await Expence.findOne({
      _id: expenceId,
      deleted_at: null,
    });

    if (!expence) {
      return res.status(404).json({ message: "❌ Expence not found" });
    }

    return res.status(200).json({
      message: "✅ Single expence fetched",
      expence,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error fetching expence",
      error: error.message,
    });
  }
};

const updateExpence = async (req, res) => {
  const { expenceId } = req.params;
  try {
    const { date, reason, amount, type } = req.body;

    const updatedFields = {
      date,
      reason,
      amount,
      type,
      updated_at: new Date(),
    };

    const updatedExpence = await Expence.findOneAndUpdate(
      { _id: expenceId, deleted_at: null },
      updatedFields,
      { new: true }
    );

    if (!updatedExpence) {
      return res.status(404).json({
        message: "❌ Expence not found or already deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Expence updated successfully",
      updatedExpence,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error updating expence",
      error: error.message,
    });
  }
};

const deleteExpence = async (req, res) => {
  const { expenceId } = req.params;
  try {
    const deletedExpence = await Expence.findOneAndUpdate(
      { _id: expenceId, deleted_at: null },
      { deleted_at: new Date() },
      { new: true }
    );

    if (!deletedExpence) {
      return res
        .status(404)
        .json({ message: "❌ Expence not found or already deleted" });
    }

    return res.status(200).json({
      message: "✅ Expence deleted successfully (soft delete)",
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error deleting expence",
      error: error.message,
    });
  }
};

export {
  createExpence,
  getAllExpences,
  getSingleExpence,
  updateExpence,
  deleteExpence,
};
