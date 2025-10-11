import mongoose from "mongoose";

const remoteSchema = new mongoose.Schema(
  {
    empNo: {
      type: Number,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    workMode: {
      type: String,
      enum: ["Office", "Remote", "Hybrid"],
      default: "Office",
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

const Remote = mongoose.model("Remote", remoteSchema);
export default Remote;
