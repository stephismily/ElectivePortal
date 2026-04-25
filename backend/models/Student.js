const mongoose = require("mongoose");

const electivesSchema = new mongoose.Schema(
  {
    electiveII: {
      type: String,
      enum: [
        "Human Computer Interaction",
        "Computer Networks",
        "DevOps",
        "Data Mining",
        "Smart Computing using Python",
      ],
      default: null,
    },
    electiveIII: {
      type: String,
      enum: [
        "Human Computer Interaction",
        "Computer Networks",
        "DevOps",
        "Data Mining",
        "Smart Computing using Python",
      ],
      default: null,
    },
    electiveIV: {
      type: String,
      enum: [
        "Human Computer Interaction",
        "Computer Networks",
        "DevOps",
        "Data Mining",
        "Smart Computing using Python",
      ],
      default: null,
    },
    electiveV: {
      type: String,
      enum: ["Entrepreneurship", "Principles of Management"],
      default: null,
    },
  },
  { _id: false },
);

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      uppercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required"],
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^\d{2}[A-Z]{2}\d{3}$/,
        "Invalid roll number format (e.g., 25MX125)",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@psgtech\.ac\.in$/, "Email must be @psgtech.ac.in"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    role: {
      type: String,
      default: "student",
      immutable: true,
    },
    electives: {
      type: electivesSchema,
      default: () => ({}),
    },
    electivesSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Student", studentSchema);
