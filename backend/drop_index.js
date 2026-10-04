require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await mongoose.connection.collection("teammembers").dropIndex("id_1");
    console.log("Index dropped");
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
}
run();
