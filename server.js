// Load environment variables from .env file
const dotenv = require("dotenv");
dotenv.config();

// Import dependencies
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require('path');

const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToView = require("./middleware/pass-user-to-view.js");

// Constants
const port = process.env.PORT ? process.env.PORT : "3000";

// Import controllers
const authController = require("./controllers/auth.js");
const assessmentController = require('./controllers/assessment.js');

// Import models

// Initialize Express app
const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

// Middleware
app.use(express.urlencoded({ extended: false })); // To parse URL-encoded data from forms
app.use(methodOverride("_method")); // For using HTTP verbs such as PUT or DELETE
app.use(morgan("dev")); // For logging HTTP requests
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
    }),
  })
); // Integrates session management into our application 

app.use(passUserToView); // Make the user session available to all views

// General Routes


// Auth Routes
app.use("/auth", authController);
app.use(isSignedIn);

app.get('/', (req, res) => {
  // Check if the user is signed in
  if(req.session.user) {
    // Redirect signed-in users to their applications index
    res.redirect(`/users/${req.session.user._id}/assessments`)
  } else {
    res.render('/sign-in.ejs');
  };
});

app.use('/users/:userId/assessments', assessmentController);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});
