const mongoose = require("mongoose");

const matrixSchema = mongoose.Schema({
  from: { type: Number, required: true },
  to: { type: Number, required: true },
  value: {
    type: String,
    enum: ["positive", "neutral", "negative"],
    required: true,
  },
});

const groupResultsSchema = mongoose.Schema({
  groupTelicIndex: { type: Number, required: true },
});

const assessmentSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    // Reference to participants instead of embedding them
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
    ],
    perceptionMatrix: matrixSchema,
    emmissionMatrix: matrixSchema,
    groupResults: groupResultsSchema,
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } // Automatically populate createdAt and updatedAt fields
);

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = { Assessment, assessmentSchema };
