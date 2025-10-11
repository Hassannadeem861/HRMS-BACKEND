import Remote from "../models/remote-model.js";

export const createRemote = async (req, res) => {
  try {
    const { empNo, date, reason, workMode } = req.body;

    if (!empNo || !date || !reason) {
      return res.status(400).json({
        success: false,
        message: "❌ empNo, Date and Reason required",
      });
    }

    const remoteDateOnly = new Date(date).toISOString().split("T")[0];
    const existing = await Remote.findOne({ empNo, date: remoteDateOnly });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "❌ Remote already exists for this employee on this date",
      });
    }

    const remote = await Remote.create({
      empNo,
      date: remoteDateOnly,
      reason,
      workMode,
      created_at: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "✅ Leave created",
      remote,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error creating remote",
      error: error.message,
    });
  }
};

export const getAllRemote = async (req, res) => {
  try {
    const remote = await Remote.find({ deleted_at: null })
      // .populate("employee")
      .sort({ created_at: -1 });

    if (!remote) {
      return res
        .status(404)
        .json({ success: false, message: "✅ Remote not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "✅ Remotes fetched", remote });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching remote",
      error: error.message,
    });
  }
};

export const getRemote = async (req, res) => {
  const { remoteId } = req.params;
  try {
    const remote = await Remote.findOne({
      _id: remoteId,
      deleted_at: null,
    })
      // .populate("Employer")
      .sort({ created_at: -1 });

    if (!remote) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Remote not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Get single remote successfully", remote });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching remote",
      error: error.message,
    });
  }
};

export const updateRemote = async (req, res) => {
  const { remoteId } = req.params;
  try {
    const { date, reason, type, status } = req.body;
    const remote = await Remote.findByIdAndUpdate(
      remoteId,
      { date, reason, workMode, status, updated_at: new Date() },
      { new: true }
    );

    if (!remote) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Remote not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "✅ Remote updated", leave });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error updating remote",
      error: error.message,
    });
  }
};

export const deleteRemote = async (req, res) => {
  const { remoteId } = req.params;
  try {
    const remote = await Remote.findByIdAndUpdate(
      remoteId,
      { deleted_at: new Date() },
      { new: true }
    );

    if (!remote) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Remote not found" });
    }

    return res.status(200).json({ success: true, message: "✅ Remote deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error deleting remote",
      error: error.message,
    });
  }
};
