import ManageOfficeTime from "../models/manage-office-time-model.js";

const createTime = async (req, res) => {
  try {
    const { date, checkInTime, checkOutTime, reason } = req.body;

    if (!date || !checkInTime || !checkOutTime) {
      return res.status(400).json({
        message: "Fields are required",
        date: "2025-09-01",
        checkInTime: "9:00 AM",
        checkOutTime: "5:00 PM",
      });
    }

    const timeAlreadyExist = await ManageOfficeTime.findOne({
      checkInTime,
      checkOutTime,
    });

    if (timeAlreadyExist) {
      return res.status(400).json({
        message: "❌ Office time already exists for these hours",
      });
    }

    const newTime = await ManageOfficeTime.create({
      date,
      checkInTime,
      checkOutTime,
      reason,
      created_at: new Date(),
    });

    return res
      .status(200)
      .json({ message: "Time created successfully", newTime });
  } catch (error) {
    return res
      .status(200)
      .json({ message: "Time created error", error: error.message });
  }
};

const getAllTime = async (req, res) => {
  try {
    const getAllOfficeTimes = await ManageOfficeTime.find({
      deleted_at: null,
    })
      .sort({ created_at: -1 })
      .lean();

    if (!getAllOfficeTimes) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    return res
      .status(200)
      .json({ message: "Get all records successfully", getAllOfficeTimes });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in get all times", error: error.message });
  }
};

const getSingleTime = async (req, res) => {
  const { officeTimeId } = req.params;

  if (!officeTimeId) {
    return res.status(400).json({
      success: false,
      message: "❌ officeTimeId is required in params",
    });
  }

  try {
    const getTime = await ManageOfficeTime.findOne({
      _id: officeTimeId,
      deleted_at: null,
    })
      .sort({ created_at: -1 })
      .lean();

    if (!getTime) {
      return res.status(404).json({
        message: "Record not found",
      });
    }

    return res
      .status(200)
      .json({ message: "Get single record successfully", getTime });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in get single time", error: error.message });
  }
};

const updateTime = async (req, res) => {
  const { officeTimeId } = req.params;

  if (!officeTimeId) {
    return res.status(400).json({
      success: false,
      message: "❌ officeTimeId is required in params",
    });
  }

  try {
    // 🔍 Step 1: Check record exists and is not already deleted
    const existingTime = await ManageOfficeTime.findOne({
      _id: officeTimeId,
      deleted_at: null,
    });

    if (!existingTime) {
      return res.status(404).json({
        success: false,
        message: "❌ Record not found or already deleted",
      });
    }

    const { date, checkInTime, checkOutTime, reason } = req.body;
    const getTime = await ManageOfficeTime.findByIdAndUpdate(
      officeTimeId,
      { date, checkInTime, checkOutTime, reason, updated_at: new Date() },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: "Time updated successfully", getTime });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in update time", error: error.message });
  }
};

const deleteTime = async (req, res) => {
  const { officeTimeId } = req.params;

  if (!officeTimeId) {
    return res.status(400).json({
      success: false,
      message: "❌ officeTimeId is required in params",
    });
  }

  try {
    // 🔍 Step 1: Check record exists and is not already deleted
    const existingTime = await ManageOfficeTime.findOne({
      _id: officeTimeId,
      deleted_at: null,
    });

    if (!existingTime) {
      return res.status(404).json({
        success: false,
        message: "❌ Record not found or already deleted",
      });
    }

    const getTime = await ManageOfficeTime.findByIdAndUpdate(
      officeTimeId,
      { deleted_at: new Date() },
      {
        new: true,
      }
    );
    
    return res
      .status(200)
      .json({ message: "Time deleted successfully", getTime });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error in delete time", error: error.message });
  }
};

export { createTime, getAllTime, getSingleTime, updateTime, deleteTime };
