import User from "../models/usersModel.js";

const findUser = async (params) => {
  return await User.findOne(params);
};

const findUser_id = async (username) => {
  const user = await User.findOne({ username });
  return user._id;
};

const getAllUsers = () => {
  return User.find({});
};

const getUserById = (id) => {
  return User.findById(id); // fixed: .find → .findById
};

const addUser = async (obj) => {
  const user = new User(obj);
  await user.save();
  return "User Created!";
};

const updateUser = async (id, obj) => {
  await User.findByIdAndUpdate(id, obj);
  return "User Updated!";
};

const deleteUser = async (id) => {
  await User.findByIdAndDelete(id);
  return "User Deleted!";
};

export {
  findUser,
  findUser_id,
  getAllUsers,
  getUserById,
  addUser,
  updateUser,
  deleteUser,
};
