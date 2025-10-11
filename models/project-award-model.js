import mongoose from "mongoose";

const projectAwardSchema = mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
    },

    projectDescription: {
      type: String,
      default: "",
    },

    budget: {
      type: Number,
      required: true,
    },

    projectStack: {
      type: [String],
      enum: ["mern", "laravel", "php", "python", "react", "nextjs"],
      required: true,
    },

    projectNiche: {
      type: String,
      // enum: ["healthcare", "ecommerce", "lms", "ai", "education"],
      required: true,
    },

    notes: {
      type: String,
      default: "",
    },

    award: {
      type: Number,
      default: 0,
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

const projectAward = mongoose.model("project-award", projectAwardSchema);
export default projectAward;
