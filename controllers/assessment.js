const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const Assessment = require("../models/assessment.js");
const calculations = require("../utils/calculations");

const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  try {
    const assessments = await Assessment.find({
      therapist: req.session.user._id,
    });

    res.render("assessments/index.ejs", { assessments });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

router.get("/create", async (req, res) => {
  try {
    res.render("assessments/create/index.ejs");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

router.post("/create", async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const { title, participantCount } = req.body;

    const newAssessment = new Assessment({
      title,
      participantCount,
      // ✅ Fixed field names and structure
      participantPreferences: { entries: [], isComplete: false },
      perceivedByOthers: { entries: [], isComplete: false },
      therapist: req.session.user._id,
      participants: [], // Will be added in next step
    });

    const savedAssessment = await newAssessment.save();

    res.redirect(
      `/users/${currentUser._id}/assessments/${savedAssessment._id}/create/participants`
    );
  } catch (error) {
    console.log(error);
    res.redirect("/assessments/create");
  }
});

router.delete("/:assessmentId", async (req, res) => {
  try {
    const assessmentId = req.params.assessmentId;

    await Assessment.findByIdAndDelete(assessmentId);

    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

router.get("/:assessmentId/edit/title", async (req, res) => {
  try {
    // Find the assessment
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect(`/`);
    }

    res.render("assessments/edit/title.ejs", {
      assessment,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/`);
  }
});

router.put("/:assessmentId/edit/title", async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const assessment = await Assessment.findById(req.params.assessmentId);

    assessment.title = req.body.title;
    await assessment.save();
    // Redirect back to the show view of the current application
    res.redirect(`/users/${currentUser._id}/assessments/`);
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

router.get("/:assessmentId/create/participants", async (req, res) => {
  try {
    // Find the assessment
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect(`/`);
    }

    res.render("assessments/create/participants.ejs", {
      assessment,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/`);
  }
});

router.post("/:assessmentId/create/participants", async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.user._id);
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect("/");
    }

    // Extract participant names from form
    const keys = Object.keys(req.body);
    const participantNames = keys.filter((key) => key.startsWith("name_"));

    // Create embedded participant data (NO separate documents)
    const participants = [];
    for (let i = 0; i < participantNames.length; i++) {
      const name = req.body[participantNames[i]].trim();
      if (name) {
        participants.push({
          name: name,
          index: i,
        });
      }
    }

    // Update assessment with embedded participants
    assessment.participants = participants;
    assessment.status = "participants_added";
    await assessment.save();

    // Redirect to next step (with corrected naming)
    res.redirect(
      `/users/${currentUser._id}/assessments/${assessment._id}/create/participant-preferences`
    );
  } catch (error) {
    console.log(error);
    res.redirect(
      `/users/${req.session.user._id}/assessments/${req.params.assessmentId}/create/participants`
    );
  }
});

router.get(
  "/:assessmentId/create/participant-preferences",
  async (req, res) => {
    try {
      const assessment = await Assessment.findById(req.params.assessmentId);

      if (!assessment) {
        return res.redirect(`/`);
      }

      res.render("assessments/create/participant-preferences.ejs", {
        assessment,
      });
    } catch (error) {
      console.log(error);
      res.redirect(`/`);
    }
  }
);

router.post(
  "/:assessmentId/create/participant-preferences",
  async (req, res) => {
    try {
      const assessment = await Assessment.findById(req.params.assessmentId);

      if (!assessment) {
        return res.redirect("/");
      }

      const participantPreferenceEntries = [];
      const participantCount = assessment.participants.length;

      // Process form data (same logic as before)
      for (const key in req.body) {
        if (!isNaN(parseInt(key))) {
          let cellIndex = parseInt(key);
          let value = req.body[key];
          let sentiment;

          if (!value) continue;

          const fromIndex = Math.floor(cellIndex / participantCount);
          const toIndex = cellIndex % participantCount;

          if (fromIndex === toIndex) continue;

          if (value.startsWith("+") || value.startsWith("-")) {
            sentiment = value.startsWith("+") ? "positive" : "negative";
            value = Math.abs(parseInt(value.slice(1), 10));
          } else {
            sentiment = "neutral";
            value = parseInt(value, 10);
          }

          participantPreferenceEntries.push({
            from: fromIndex,
            to: toIndex,
            value,
            sentiment,
          });
        }
      }

      // Update with new field name, NO calculations stored
      assessment.participantPreferences = {
        entries: participantPreferenceEntries,
        isComplete: true,
      };
      assessment.status = "preferences_complete";
      await assessment.save();

      // Redirect to next step
      res.redirect(
        `/users/${req.session.user._id}/assessments/${assessment._id}/create/perceived-by-others`
      );
    } catch (error) {
      console.log(error);
      res.redirect(
        `/users/${req.session.user._id}/assessments/${req.params.assessmentId}/create/participant-preferences`
      );
    }
  }
);

router.get("/:assessmentId/create/perceived-by-others", async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect(`/`);
    }

    res.render("assessments/create/perceived-by-others.ejs", {
      assessment,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/`);
  }
});

router.post("/:assessmentId/create/perceived-by-others", async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect("/");
    }

    const perceivedByOthersEntries = [];
    const participantCount = assessment.participants.length;

    // Process form data (same logic as before)
    for (const key in req.body) {
      let sentiment = req.body[key];
      let index = parseInt(key);

      const fromIndex = Math.floor(index / participantCount);
      const toIndex = index % participantCount;

      if (fromIndex === toIndex) continue;

      perceivedByOthersEntries.push({
        from: fromIndex, // Keep existing field names for now
        to: toIndex,
        sentiment: sentiment,
      });
    }

    // Update with new field name, NO calculations stored
    assessment.perceivedByOthers = {
      entries: perceivedByOthersEntries,
      isComplete: true,
    };
    assessment.status = "analysis_ready"; // Final status
    await assessment.save();

    // ✅ Redirect to results
    res.redirect(
      `/users/${req.session.user._id}/assessments/${assessment._id}/group-results`
    );
  } catch (error) {
    console.log(error);
    res.redirect(
      `/users/${req.session.user._id}/assessments/${req.params.assessmentId}/create/perceived-by-others`
    );
  }
});

router.get("/:assessmentId/group-results", async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect("/assessments");
    }

    // ✅ Check if both matrices are complete before calculating
    if (
      !assessment.participantPreferences?.isComplete ||
      !assessment.perceivedByOthers?.isComplete
    ) {
      return res.redirect(
        `/users/${req.session.user._id}/assessments/${assessment._id}/create/participants`
      );
    }

    // ✅ Single function call for all calculations
    const calculatedResults = calculations.calculateAllMetrics(
      assessment.participantPreferences.entries,
      assessment.perceivedByOthers.entries,
      assessment.participants
    );

    res.render("assessments/group-results.ejs", {
      assessment,
      participants: calculatedResults.participants,
      groupResults: calculatedResults.groupResults,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

router.get("/:assessmentId/participant/:participantIndex", async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);
    const participantIndex = parseInt(req.params.participantIndex);

    if (
      !assessment ||
      participantIndex >= assessment.participants.length ||
      participantIndex < 0
    ) {
      return res.redirect("/");
    }

    // ✅ Check if both matrices are complete
    if (
      !assessment.participantPreferences?.isComplete ||
      !assessment.perceivedByOthers?.isComplete
    ) {
      return res.redirect(
        `/users/${req.session.user._id}/assessments/${assessment._id}/group-results`
      );
    }

    // ✅ Single function call for all calculations
    const calculatedResults = calculations.calculateAllMetrics(
      assessment.participantPreferences.entries,
      assessment.perceivedByOthers.entries,
      assessment.participants
    );

    // ✅ Extract specific participant data
    const participant = calculatedResults.participants[participantIndex];

    res.render("assessments/participant-results.ejs", {
      assessment,
      participant,
      participantIndex,
    });
  } catch (error) {
    console.log(error);
    res.redirect(
      `/users/${req.session.user._id}/assessments/${req.params.assessmentId}/group-results`
    );
  }
});

module.exports = router;
