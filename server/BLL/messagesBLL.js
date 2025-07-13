import GroupChat from "../models/groupModel.js";
import PrivateChat from "../models/privateModel.js";

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

export {
  getAllGroupMessages,
  getAllPrivateMessages,
  deletePrivateMessage,
  deleteGroupMessage,
};
