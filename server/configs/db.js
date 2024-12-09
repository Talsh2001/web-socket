const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect(
      "mongodb+srv://tomq5555:Talsh7410@cluster0.c3lnb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    )
    .then(() => {
      console.log("Connected to DB");
    })
    .catch((error) => console.log(error));
};

module.exports = connectDB;
