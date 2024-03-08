const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true , index: true},
  password: { type: String, required: true }
});

const Users = mongoose.model('users', userSchema);

module.exports = Users;
