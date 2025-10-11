import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    empNo: {
      // ✅ direct empNo save hoga
      type: Number,
      required: true,
    },

    // employee: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Employer",
    //   required: true,
    // },

    date: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["Paid", "Unpaid", "Sick", "Casual", "HalfDay"],
      default: "Other",
    },

    // status: {
    //   type: String,
    //   enum: ["Pending", "Approved", "Rejected"],
    //   default: "Pending",
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

const Leave = mongoose.model("Leave", leaveSchema);
export default Leave;
