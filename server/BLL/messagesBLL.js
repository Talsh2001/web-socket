const GroupChat = require("../models/groupModel");
const PrivateChat = require("../models/privateModel");

const getAllGroupMessages = () => {
  return GroupChat.find();
};

const getAllPrivateMessages = () => {
  return PrivateChat.find();
};

const deletePrivateMessage = async (id) => {
  await PrivateChat.findByIdAndDelete(id);
  return "Chat Deleted!";
};

const deleteGroupMessage = async (id) => {
  await GroupChat.findByIdAndDelete(id);
  return "Group Chat Deleted!";
};

module.exports = {
  getAllGroupMessages,
  getAllPrivateMessages,
  deletePrivateMessage,
  deleteGroupMessage,
};
