const mongoose = require("mongoose");

const participantSchema = mongoose.Schema(
  {
    fullName: { type: String, required: true },
    positiveTotal: { type: Number, required: true },
    negativeTotal: { type: Number, required: true },
    neutralTotal: { type: Number, required: true },
    mutualitiesCount: { type: Number, required: true },
    incongruitiesCount: { type: Number, required: true },
    perceptionIndex: { type: Number, required: true },
    emissionIndex: { type: Number, required: true },
    telicIndex: { type: Number, required: true },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },
  },
  { timestamps: true }
);

const Participant = mongoose.model("Participant", participantSchema);

module.exports = Participant;
