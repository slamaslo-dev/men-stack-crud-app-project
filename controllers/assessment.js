const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const Participant = require("../models/participant.js");
const Assessment = require("../models/assessment.js");
const calculations = require('../utils/calculations');

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
      `/users/${currentUser._id}/assessments/${savedAssessment._id}/create/participants`
    );
  } catch (error) {
    // If any errors, log them and redirect back home
    console.log(error);
    res.redirect("/assessments/create");
  }
});

router.delete("/:assessmentId", async (req, res) => {
  try {
    const assessmentId = req.params.assessmentId;

    // Delete all participants linked to the assessment
    await Participant.deleteMany({ assessment: assessmentId });

    // Delete the assessment
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
    res.redirect(
      `/users/${currentUser._id}/assessments/`
    );
  } catch (error) {
    console.log(error);
    res.redirect('/');
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
    // Look up the user from req.session
    const currentUser = await User.findById(req.session.user._id);

    // Find the assessment
    const assessment = await Assessment.findById(req.params.assessmentId);

    if (!assessment) {
      return res.redirect("/");
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
      `/users/${currentUser._id}/assessments/${assessment._id}/create/perception-matrix`
    );
  } catch (error) {
    console.log(error);
    res.redirect(
      `/users/${currentUser._id}/assessments/${assessment._id}/create/participants`
    );
  }
});

router.get("/:assessmentId/create/perception-matrix", async (req, res) => {
    try {
        // Find the assessment
        const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
    
        if (!assessment) {
          return res.redirect(`/`);
        }
    
        res.render("assessments/create/perception-matrix.ejs", {
          assessment,
        });
      } catch (error) {
        console.log(error);
        res.redirect(`/`);
      }
});

router.post("/:assessmentId/create/perception-matrix", async (req, res) => {
    try {
      // Find the assessment
      const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
      
      if (!assessment) {
        return res.redirect("/");
      }
      
      // Create an array to store matrix entries
      const perceptionEntries = [];
      const participantCount = assessment.participants.length;
      
      // Process the form data
      for (const key in req.body) {
        // Check if the key is a number
        if (!isNaN(parseInt(key))) {
          let cellIndex = parseInt(key);
          let value = req.body[key];
          let sentiment;

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
          perceptionEntries.push({
            from: fromIndex,
            to: toIndex,
            value,
            sentiment,
          });
        }
      }
      
      // Update the assessment with the matrix entries
      assessment.perceptionMatrix = { entries: perceptionEntries };
      await assessment.save();

    // Calculate column totals using the utility function
      const participantTotals = calculations.calculateColumnTotals(
        perceptionEntries, 
        assessment.participants.length
      );
    
    // Update each participant with their totals and save
    for (let i = 0; i < assessment.participants.length; i++) {
      const participant = assessment.participants[i];
      const totals = participantTotals[i];
      
      participant.positiveTotal = totals.positiveTotal;
      participant.negativeTotal = totals.negativeTotal;
      participant.neutralTotal = totals.neutralTotal;
      
      await participant.save();
    }
      
      // Redirect to emission matrix
      res.redirect(`/users/${req.session.user._id}/assessments/${assessment._id}/create/emission-matrix`);
    } catch (error) {
      console.log(error);
      res.redirect(`/users/${req.session.user._id}/assessments/${req.params.assessmentId}/create/perception-matrix`);
    }
  });

  router.get("/:assessmentId/create/emission-matrix", async (req, res) => {
    try {
        // Find the assessment
        const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
    
        if (!assessment) {
          return res.redirect(`/`);
        }
    
        res.render("assessments/create/emission-matrix.ejs", {
          assessment,
        });
      } catch (error) {
        console.log(error);
        res.redirect(`/`);
      }
});

router.post("/:assessmentId/create/emission-matrix", async (req, res) => {
        try {
          // Find the assessment
          const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
          
          if (!assessment) {
            return res.redirect("/");
          }
          
          // Create an array to store matrix entries
          const emissionEntries = [];
          const participantCount = assessment.participants.length;
          
          // Process the form data          
          for (const key in req.body) {
            let sentiment = req.body[key];
            let index = parseInt(key); 
          
            const fromIndex = Math.floor(index / participantCount);
            const toIndex = index % participantCount;
          
            if (fromIndex === toIndex) continue;
          
            emissionEntries.push({
              from: fromIndex,
              to: toIndex,
              sentiment: sentiment
            });
          }
          
          assessment.emissionMatrix = { entries: emissionEntries };
          await assessment.save();

          // Get both matrices' entries
    const perceptionEntries = assessment.perceptionMatrix.entries;
    
    // Calculate all indices
    
    const mutualities = calculations.calculateMutualities(perceptionEntries, participantCount);
    const incongruities = calculations.calculateIncongruities(perceptionEntries, emissionEntries, participantCount);
    const perceptionIndices = calculations.calculatePerceptionIndices(perceptionEntries, emissionEntries, participantCount);
    const emissionIndices = calculations.calculateEmissionIndices(perceptionEntries, emissionEntries, participantCount);
    const telicIndices = calculations.calculateTelicIndices(perceptionIndices, emissionIndices);
    const groupTelicIndex = calculations.calculateGroupTelicIndex(telicIndices);
    
    // Update each participant with their indices
    for (let i = 0; i < assessment.participants.length; i++) {
      const participant = assessment.participants[i];
      
      participant.mutualitiesCount = mutualities[i] || 0;
      participant.incongruitiesCount = incongruities[i] || 0;
      participant.perceptionIndex = perceptionIndices[i] || 0;
      participant.emissionIndex = emissionIndices[i] || 0;
      participant.telicIndex = telicIndices[i] || 0;
      
      await participant.save();
    }
    
    // Update the assessment with the group telic index
    assessment.groupResults = { groupTelicIndex };
    await assessment.save();
    
          
          // Redirect to results page
          res.redirect(`/users/${req.session.user._id}/assessments/${assessment._id}/group-results`);
        } catch (error) {
          console.log(error);
          res.redirect(`/users/${req.session.user._id}/assessments/${req.params.assessmentId}/create/emission-matrix`);
        }

});

router.get("/:assessmentId/group-results", async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
    
    if (!assessment) {
      return res.redirect("/assessments");
    }
    
    res.render("assessments/group-results.ejs", {
      assessment,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

router.get("/:assessmentId/participant/:participantId", async (req, res) => {
  try {
    // Find the assessment and populate participants
    const assessment = await Assessment.findById(req.params.assessmentId).populate('participants');
    
    if (!assessment) {
      return res.redirect("/");
    }
    
    // Find the specific participant
    const participant = assessment.participants.find(p => 
      p._id.toString() === req.params.participantId
    );
    
    if (!participant) {
      return res.redirect(`/users/${req.session.user._id}/assessments/${req.params.assessmentId}/results`);
    }
    
    // Get the participant's index in the array (important for matrix lookups)
    const participantIndex = assessment.participants.findIndex(p => 
      p._id.toString() === req.params.participantId
    );
    
    res.render("assessments/participant-results.ejs", {
      assessment,
      participant,
      participantIndex,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/users/${req.session.user._id}/assessments/${req.params.assessmentId}/results`);
  }
});

module.exports = router;
