import User from "../models/sequelize/User.js";

const findUser = async (params) => {
  return await User.findOne({ where: params });
};

const findUser_id = async (username) => {
  const user = await User.findOne({ where: { username } });
  return user.id;
};

const getAllUsers = () => {
  return User.findAll({
    include: [
      {
        association: "BlockedUsers",
        attributes: ["username"],
      },
      {
        association: "BlockedBy",
        attributes: ["username"],
      },
    ],
  });
};

const getUserById = (id) => {
  return User.findByPk(id);
};

const addUser = async (obj) => {
  await User.create(obj);
  return "User Created!";
};

const updateUser = async (id, obj) => {
  await User.update(obj, { where: { id } });
  return "User Updated!";
};

const deleteUser = async (id) => {
  await User.destroy({ where: { id } });
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
