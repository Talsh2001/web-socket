import mongoose from "mongoose";

const { Schema } = mongoose;

const privateChatSchema = new Schema(
  {
    customId: { type: String, required: true, unique: true },
    messages: [
      {
        from: { type: String, required: true },
        content: { type: String, required: true },
        date: { type: String, required: true },
      },
    ],
  },
  { versionKey: false }
);

const PrivateChat = mongoose.model("privateChat", privateChatSchema, "privateChats");

export default PrivateChat;
