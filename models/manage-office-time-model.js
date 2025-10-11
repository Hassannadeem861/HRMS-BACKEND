import mongoose from "mongoose";

const manageOfficeTimeSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
    },

    checkInTime: {
      type: String,
      required: true,
    },

    checkOutTime: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
    },

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

const manageOfficeTime = mongoose.model(
  "Manage-Office-Time",
  manageOfficeTimeSchema
);
export default manageOfficeTime;
