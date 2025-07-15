import { DataTypes } from "sequelize";
import { sequelize } from "../../configs/db.js";

const GroupChat = sequelize.define(
  "GroupChat",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "group_chats",
    timestamps: false,
  }
);

export default GroupChat;
