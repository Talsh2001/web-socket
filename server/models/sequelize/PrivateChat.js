import { DataTypes } from "sequelize";
import { sequelize } from "../../configs/db.js";
import User from "./User.js";

const PrivateChat = sequelize.define(
  "PrivateChat",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    tableName: "private_chats",
    timestamps: false,
  }
);

PrivateChat.belongsToMany(User, { through: "private_chat_users" });
User.belongsToMany(PrivateChat, { through: "private_chat_users" });

export default PrivateChat;
