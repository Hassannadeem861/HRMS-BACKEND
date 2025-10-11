import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true, // ek hi date ka holiday bar bar na ho
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["National", "Company", "Other"],
      default: "Company",
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

const Holiday = mongoose.model("Holiday", holidaySchema);
export default Holiday;
