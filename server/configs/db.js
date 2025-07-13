import mongoose from "mongoose";

const connectDB = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017/websocket")
    .then(() => {
      console.log("Connected to DB");
    })
    .catch((error) => console.log(error));
};

export default connectDB;
