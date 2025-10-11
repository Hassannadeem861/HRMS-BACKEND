import Holiday from "../models/holiday-model.js";
import Attendance from "../models/attendance-model.js";
// import Employee from "../models/employee-model.js";

export const createHoliday = async (req, res) => {
  try {
    const { date, title, type } = req.body;

    if (!date || !title) {
      return res
        .status(400)
        .json({ success: false, message: "❌ Date and Title required" });
    }

    const holidayDateOnly = new Date(date).toISOString().split("T")[0];

    // ✅ Duplicate holiday check
    const existing = await Holiday.findOne({ date: holidayDateOnly });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "❌ Holiday already exists on this date",
      });
    }

    // ✅ Save holiday in Holiday collection
    const holiday = await Holiday.create({
      date: holidayDateOnly,
      title,
      type,
      created_at: new Date(),
    });

    // ✅ Get all employees (unique empNo from Attendance OR Employees collection if exists)
    const employees = await Attendance.aggregate([
      {
        $group: {
          _id: "$empNo",
          empNo: { $first: "$empNo" },
          name: { $first: "$name" },
          department: { $first: "$department" },
        },
      },
    ]);

    const validEmployees = employees.filter(
      (e) => e.empNo !== null && e.empNo !== 0
    );

    console.log("employees: ", employees);
    // console.log("validEmployees: ", validEmployees);

    // ✅ Insert holiday attendance for each employee
    const holidayRecords = validEmployees.map((emp) => ({
      empNo: emp.empNo,
      department: emp.department || "N/A",
      name: emp.name || "N/A",
      date: holidayDateOnly,
      checkInCount: 0,
      checkOutCount: 0,
      status: "Holiday",
      isHoliday: true,
      created_at: new Date(),
    }));

    // ✅ Save in Attendance
    if (holidayRecords.length > 0) {
      await Attendance.insertMany(holidayRecords);
    }

    return res.status(201).json({
      success: true,
      message: "✅ Holiday created & attendance updated",
      holiday,
      holidayRecordsCount: holidayRecords.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error creating holiday",
      error: error.message,
    });
  }
};

export const getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find({
      deleted_at: null,
    });

    if (!holidays) {
      return res
        .status(404)
        .json({ success: false, message: "✅ Holidays not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "✅ Holidays fetched", holidays });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching holidays",
      error: error.message,
    });
  }
};

export const getHoliday = async (req, res) => {
  const { holidayId } = req.params;

  try {
    const holiday = await Holiday.findById({
      _id: holidayId,
      deleted_at: null,
    });

    if (!holiday) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Holiday not found" });
    }

    return res.status(200).json({ success: true, holiday });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error fetching holiday",
      error: error.message,
    });
  }
};

export const updateHoliday = async (req, res) => {
  const { holidayId } = req.params;

  try {
    const { date, title, type } = req.body;
    const holiday = await Holiday.findByIdAndUpdate(
      holidayId,
      { date, title, type, updated_at: new Date() },
      { new: true }
    );
    if (!holiday) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Holiday not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "✅ Holiday updated", holiday });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error updating holiday",
      error: error.message,
    });
  }
};

export const deleteHoliday = async (req, res) => {
  const { holidayId } = req.params;

  try {
    const holiday = await Holiday.findOneAndUpdate(
      { _id: holidayId },
      { deleted_at: new Date() },
      { new: true }
    );

    if (!holiday) {
      return res
        .status(404)
        .json({ success: false, message: "❌ Holiday not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "✅ Holiday deleted" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "❌ Error deleting holiday",
      error: error.message,
    });
  }
};
