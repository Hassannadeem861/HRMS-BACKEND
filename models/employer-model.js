import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    empNo: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      // unique: true,
      trim: true,
    },

    // password: {
    //   type: String,
    //   required: true,
    // },

    status: {
      type: Number,
      default: 1,
    },

    mobile_number: {
      type: String,
      required: true,
    },

    designation: {
      type: String,
      required: true,
    },

    account_number: {
      type: String,
      required: true,
    },

    permanent_address: {
      type: String,
      required: true,
    },

    salary: {
      type: Number,
      required: true,
    },

    date_of_birth: {
      type: Date,
      required: true,
    },

    date_of_joining: {
      type: Date,
      required: true,
    },

    // fileUpload: {
    //   data: String,
    //   mimetype: String,
    //   originalname: String,
    // },
    // pdfUpload: {
    //   data: String,
    //   mimetype: String,
    //   originalname: String,
    // },

    pdfUpload: {
      type: Buffer,
      // type: String,
      default: null,
      // required: true,
    },

    fileUpload: {
      type: Buffer,
      // type: String,
      default: null,
      // required: true,
    },

    created_at: {
      type: Date,
      default: () => new Date(),
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
  {
    timestamps: false,
  }
);

const User = mongoose.model("Employer", userSchema);
export default User;
