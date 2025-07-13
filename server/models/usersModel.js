import mongoose from "mongoose";

const usersSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    blockedUsers: [{ type: String }],
    blockedBy: [{ type: String }],
  },
  { versionKey: false }
);

const User = mongoose.model("user", usersSchema, "users");

export default User;
