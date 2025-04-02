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

// Constants
const port = process.env.PORT ? process.env.PORT : "3000";

// Import controllers
const authController = require("./controllers/auth.js");

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

// General Routes
app.get("/", async (req, res) => {
  res.render("home.ejs", {
    user: req.session.user,
  });
});

// Auth Routes
app.use("/auth", authController);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});
