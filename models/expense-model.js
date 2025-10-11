import mongoose from "mongoose";

const expenceSchema = mongoose.Schema(
  {
    date: {
      type: Date,
      required:true
    },

    reason: {
      type: String,
      required:true
    },

    amount: {
      type: Number,
      required:true
    },

    type: {
      type: String,
      required:true
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

const expence = mongoose.model("expence", expenceSchema);
export default expence;
