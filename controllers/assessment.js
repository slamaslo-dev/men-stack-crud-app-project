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
    try {
      // Find the assessment
      const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
      
      if (!assessment) {
        return res.redirect("/assessments");
      }
      
      // Create an array to store matrix entries
      const matrixEntries = [];
      const participantCount = assessment.participants.length;
      
      // Process the form data
      for (const key in req.body) {
        // Check if the key is a number
        if (!isNaN(parseInt(key))) {
          const cellIndex = parseInt(key);
          const value = req.body[key];
          console.log(key, value);
          // Skip if no value provided
          if (!value) continue;
          
          // Reverse the mapping to recover the original coordinates:
          const fromIndex = Math.floor(cellIndex / participantCount);
          const toIndex = cellIndex % participantCount;
          
          // Skip diagonal (self-references)
          if (fromIndex === toIndex) continue;
          
          if (value.startsWith('+') || value.startsWith('-')) {
            sentiment = value.startsWith('+') ? "positive" : "negative";
            value = Math.abs(parseInt(value.slice(1), 10));
          } else {
            sentiment = "neutral";
            value = parseInt(value, 10);
          }
          
          // Add entry to matrix
          matrixEntries.push({
            from: fromIndex,
            to: toIndex,
            value,
            sentiment,
          });
        }
      }
      
      // Update the assessment with the matrix entries
      assessment.perceptionMatrix = { entries: matrixEntries };
      await assessment.save();
      
      // Redirect to emission matrix
      res.redirect(`/users/${req.session.user._id}/assessments/${assessment._id}/emission-matrix`);
    } catch (error) {
      console.log(error);
      res.redirect(`/users/${req.session.user._id}/assessments/${req.params.assessmentId}/perception-matrix`);
    }
  });

  router.get("/:assessmentId/emission-matrix", async (req, res) => {
    try {
        // Find the assessment
        const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
    
        if (!assessment) {
          return res.redirect(`/assessments`);
        }
    
        res.render("assessments/emission-matrix.ejs", {
          assessment,
        });
      } catch (error) {
        console.log(error);
        res.redirect(`/assessments`);
      }
});

router.post("/:assessmentId/emission-matrix", async (req, res) => {
        try {
          // Find the assessment
          const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
          
          if (!assessment) {
            return res.redirect("/assessments");
          }
          
          // Create an array to store matrix entries
          const matrixEntries = [];
          const participantCount = assessment.participants.length;
          
          // Process the form data          
          for (const key in req.body) {
            const sentiment = req.body[key];
            const index = parseInt(key); 
          
            const fromIndex = Math.floor(index / participantCount);
            const toIndex = index % participantCount;
          
            if (fromIndex === toIndex) continue;
          
            matrixEntries.push({
              from: fromIndex,
              to: toIndex,
              sentiment: sentiment
            });
          }
          
          assessment.emmissionMatrix = { entries: matrixEntries };
          await assessment.save();
          
          // Redirect to emission matrix
          res.redirect(`/users/${req.session.user._id}/assessments/${assessment._id}/results`);
        } catch (error) {
          console.log(error);
          res.redirect(`/users/${req.session.user._id}/assessments/${req.params.assessmentId}/emission-matrix`);
        }

});

router.get("/:assessmentId/results", async (req, res) => {
    res.send("GET Results");
});

module.exports = router;
