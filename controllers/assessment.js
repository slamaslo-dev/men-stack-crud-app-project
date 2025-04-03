const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const mongoose = require("mongoose");

router.get("/", async (req, res) => {
  try {
    res.render("assessments/index.ejs");
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

    // Create new assessment object
    const newAssessment = {
      title,
      dateCreated: new Date(),
      participants: [],
      perceptionMatrix: { entries: [] },
      emissionMatrix: { entries: [] },
    };

    // Pre-generate the ObjectId (Asessment) for redirect
    const objectId = new mongoose.Types.ObjectId(); // Creates a new MongoDB ObjectId
    newAssessment._id = objectId;
    const assessmentId = objectId;

    currentUser.assessments.push(newAssessment);
    await currentUser.save();

    res.redirect(`/users/${currentUser._id}/assessments/${assessmentId}/participants?count=${participantCount}`);
  } catch (error) {
    // If any errors, log them and redirect back home
    console.log(error);
    res.redirect("/");
  }
});

router.get("/create", async (req, res) => {
    res.render("assessments/create.ejs");
  });

module.exports = router;
