const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  index: { type: Number, required: true }
});

const participantPreferenceSchema = new mongoose.Schema({
  from: { type: Number, required: true },
  to: { type: Number, required: true },
  value: { type: Number, required: true },
  sentiment: { type: String, enum: ["positive", "neutral", "negative"], required: true }
});

const perceivedByOthersSchema = new mongoose.Schema({
  from: { type: Number, required: true },
  to: { type: Number, required: true },
  sentiment: { type: String, enum: ["positive", "neutral", "negative"], required: true }
});

const participantPreferencesMatrixSchema = new mongoose.Schema({
  entries: [participantPreferenceSchema],
  isComplete: { type: Boolean, default: false }
});

const perceivedByOthersMatrixSchema = new mongoose.Schema({
  entries: [perceivedByOthersSchema],
  isComplete: { type: Boolean, default: false }
});

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  participants: [participantSchema],
  participantCount: { type: Number, required: true },
  
  // Clear naming
  participantPreferences: participantPreferencesMatrixSchema,
  perceivedByOthers: perceivedByOthersMatrixSchema,
  
  status: { 
    type: String, 
    enum: ["draft", "participants_added", "preferences_complete", "analysis_ready"], 
    default: "draft" 
  },
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

const Assessment = mongoose.model("Assessment", assessmentSchema);
module.exports = Assessment;