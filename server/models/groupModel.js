const mongoose = require("mongoose");
const { Schema } = mongoose;

const groupChatSchema = new Schema(
  {
    customId: { type: String, required: true, unique: true },
    participants: { type: [String], required: true },
    messages: [
      {
        from: { type: String, required: true },
        content: { type: String, required: true },
        action: { type: String, required: true },
        date: { type: String, required: true },
      },
    ],
  },
  { versionKey: false }
);

const GroupChat = mongoose.model("groupChat", groupChatSchema, "groupChats");

module.exports = GroupChat;
