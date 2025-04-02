const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    firstName: {type: String, required: true},
    // assessments: [assessmentSchema],

});

module.exports = mongoose.model('User', userSchema);