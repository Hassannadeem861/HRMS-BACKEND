import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    department: {
      type: String,
      trim: true,
    },

    name: {
      type: String,
      // required: true,
      trim: true,
    },

    empNo: {
      type: Number,
      // required: true,
    },

    date: {
      type: String,
      //   required: true,
    },

    // time: {
    //   type: String,
    // },

    isSunday: { type: Boolean, default: false }, // ✅ Sunday check
    isHoliday: { type: Boolean, default: false }, // ✅ Holiday check
    isLeave: { type: Boolean, default: false }, // ✅ Leave check
    isRemote: { type: Boolean, default: false }, // ✅ Remote check

    status: {
      type: String,
      enum: ["In", "Out", "Off","Holiday", "Leave", "Remote"],
      required: true,
    },

    // rawDateTime: {
    //   type: String, // e.g. "01/08/2021:C/In"  (backup ke liye pura store kar lo)
    // },

    created_at: {
      type: Date,
      default: null,
    },

    updated_at: {
      type: Date,
      default: null,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: false }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
