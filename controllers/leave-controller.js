import Leave from "../models/leave-model.js";

export const createLeave = async (req, res) => {
  try {
    const { empNo, date, reason, type } = req.body;

    if (!empNo || !date || !reason) {
      return res.status(400).json({
        success: false,
        message: "❌ empNo, Date and Reason required",
      });
    }

    const holidayDateOnly = new Date(date).toISOString().split("T")[0];
    const existing = await Leave.findOne({ empNo, date: holidayDateOnly });
    
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "❌ Leave already exists for this employee on this date",
      });
    }

    const leave = await Leave.create({
      empNo,
      date: holidayDateOnly,
      reason,
      type,
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "✅ Leave created",
      leave,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error creating leave",
      error: error.message,
    });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ deleted_at: null })
      // .populate("employee")
      .sort({ created_at: -1 });

    if (!leaves) {
      return res
        .status(404)
        .json({ success: false, message: "✅ Leaves not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "✅ Leaves fetched", leaves });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching leaves",
      error: error.message,
    });
  }
};

export const getLeave = async (req, res) => {
  const { leaveId } = req.params;
  try {
    const leave = await Leave.findOne({
      _id: leaveId,
      deleted_at: null,
    })
      // .populate("Employer")
      .sort({ created_at: -1 });

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Leave not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Get single leave successfully", leave });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching leave",
      error: error.message,
    });
  }
};

export const updateLeave = async (req, res) => {
  const { leaveId } = req.params;
  try {
    const { date, reason, type, status } = req.body;
    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      { date, reason, type, status, updated_at: new Date() },
      { new: true }
    );

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Leave not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "✅ Leave updated", leave });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error updating leave",
      error: error.message,
    });
  }
};

export const deleteLeave = async (req, res) => {
  const { leaveId } = req.params;
  try {
    const leave = await Leave.findByIdAndUpdate(
      leaveId,
      { deleted_at: new Date() },
      { new: true }
    );

    if (!leave) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Leave not found" });
    }

    return res.status(200).json({ success: true, message: "✅ Leave deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error deleting leave",
      error: error.message,
    });
  }
};
