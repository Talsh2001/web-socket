import { DataTypes } from "sequelize";
import { sequelize } from "../../configs/db.js";
import User from "./User.js";
import GroupChat from "./GroupChat.js";

const GroupMessage = sequelize.define(
  "GroupMessage",
  {
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "group_messages",
    timestamps: false,
  }
);

GroupMessage.belongsTo(User, { as: "from", foreignKey: "fromId" });
GroupMessage.belongsTo(GroupChat, { foreignKey: "GroupChatId", onDelete: "CASCADE" });
GroupChat.hasMany(GroupMessage, { foreignKey: "GroupChatId", onDelete: "CASCADE" });

export default GroupMessage;
