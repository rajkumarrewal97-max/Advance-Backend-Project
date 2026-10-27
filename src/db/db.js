const mongoose = require("mongoose");




async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("server is connect to connectDB");
    
  } catch (err) {
    console.log("server error:" + err);
  }
}


module.exports = connectDB;
