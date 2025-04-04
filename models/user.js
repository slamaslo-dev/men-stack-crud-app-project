const mongoose = require("mongoose");

const assessmentSchema = require("./assessment.js");

const userSchema = mongoose.Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.virtual("assessments", {
  ref: "Assessment",
  localField: "_id",
  foreignField: "user",
});

const User = mongoose.model("User", userSchema);

module.exports = User;