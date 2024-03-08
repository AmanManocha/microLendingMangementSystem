require('dotenv').config();
const mongoose = require('mongoose');

const connectionUrl = 'mongodb://127.0.0.1:27017/micro_lending_company';

try {
  mongoose.connect(connectionUrl);
  const db = mongoose.connection;
  
  db.on("error", console.error.bind(console, "Connection error:"));
  db.once("open", function () {
    console.log("Connected successfully");
  });

  module.exports = db;
} catch (error) {
  console.error("Error connecting to the database:", error.message);
}
