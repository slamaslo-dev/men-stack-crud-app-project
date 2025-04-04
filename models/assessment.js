const mongoose = require("mongoose");

const matrixCellSchema = mongoose.Schema({
  from: { type: Number, required: true },
  to: { type: Number, required: true },
  value: { type: Number, required: false },
  sentiment: {
    type: String,
    enum: ["positive", "neutral", "negative"],
    required: true,
  },
});

const matrixSchema = mongoose.Schema({
    entries: [matrixCellSchema]
});

const groupResultsSchema = mongoose.Schema({
  groupTelicIndex: { type: Number, required: true },
});

const assessmentSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    // Reference to participants instead of embedding them
    participantCount: { type: Number, required: true},
    perceptionMatrix: matrixSchema,
    emmissionMatrix: matrixSchema,
    groupResults: groupResultsSchema,
    participants: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
      ],
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true } // Automatically populate createdAt and updatedAt fields
);

const Assessment = mongoose.model("Assessment", assessmentSchema);

module.exports = Assessment;