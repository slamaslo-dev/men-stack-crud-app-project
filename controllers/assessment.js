const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const Participant = require("../models/participant.js");
const Assessment = require("../models/assessment.js");
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
  res.render("assessments/create.ejs");
});

router.post("/", async (req, res) => {
  try {
    // Look up the user from req.session
    const currentUser = await User.findById(req.session.user._id);

    // Get data from req.body
    const title = req.body.title;
    const participantCount = req.body.participantCount;

    // Create new assessment
    const newAssessment = new Assessment({
      title,
      participantCount,
      perceptionMatrix: { entries: [] },
      emmissionMatrix: { entries: [] },
      groupResults: { groupTelicIndex: 0 },
      therapist: req.session.user._id,
    });

    // Save the assessment
    const savedAssessment = await newAssessment.save();
    // Redirect to participant setup
    res.redirect(
      `/users/${currentUser._id}/assessments/${savedAssessment._id}/participants`
    );
  } catch (error) {
    // If any errors, log them and redirect back home
    console.log(error);
    res.redirect("/assessments/create");
  }
});

router.get("/:assessmentId/participants", async (req, res) => {
  try {
    // Find the assessment
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect(`/assessments`);
    }

    res.render("assessments/participants.ejs", {
      assessment,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/assessments`);
  }
});

router.post("/:assessmentId/participants", async (req, res) => {
  try {
    // Look up the user from req.session
    const currentUser = await User.findById(req.session.user._id);

    // Find the assessment
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect("/assessments");
    }

    // Extract participant names from the form
    const keys = Object.keys(req.body);
    const participantNames = keys.filter((key) => key.startsWith("name_"));

    // Create participant documents and collect their IDs
    const participantIds = [];

    for (let i = 0; i < participantNames.length; i++) {
      const name = req.body[participantNames[i]].trim();

      if (name) {
        // Create a new participant document
        const participant = new Participant({
          fullName: name,
          positiveTotal: 0,
          negativeTotal: 0,
          neutralTotal: 0,
          mutualitiesCount: 0,
          incongruitiesCount: 0,
          perceptionIndex: 0,
          emissionIndex: 0,
          telicIndex: 0,
          assessment: assessment._id,
        });

        const savedParticipant = await participant.save();
        participantIds.push(savedParticipant._id);
      }
    }

    // Update assessment with participant references
    assessment.participants = participantIds;
    await assessment.save();

    // Redirect to perception matrix
    res.redirect(
      `/users/${currentUser._id}/assessments/${assessment._id}/perception-matrix`
    );
  } catch (error) {
    console.log(error);
    res.redirect(
      `/users/${currentUser._id}/assessments/${assessment._id}/participants`
    );
  }
});

router.get("/:assessmentId/perception-matrix", async (req, res) => {
    try {
        // Find the assessment
        const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
    
        if (!assessment) {
          return res.redirect(`/assessments`);
        }
    
        res.render("assessments/perception-matrix.ejs", {
          assessment,
        });
      } catch (error) {
        console.log(error);
        res.redirect(`/assessments`);
      }
});

router.post("/:assessmentId/perception-matrix", async (req, res) => {
    res.send("POST Emission-matrix");
});

router.get("/:assessmentId/emission-matrix", async (req, res) => {
    res.send("GET Emission-matrix");
});

router.post("/:assessmentId/emission-matrix", async (req, res) => {
    res.send("POST Emission-matrix");
});

module.exports = router;
