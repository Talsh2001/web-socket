import { DataTypes } from "sequelize";
import { sequelize } from "../../configs/db.js";
import User from "./User.js";
import PrivateChat from "./PrivateChat.js";

const PrivateMessage = sequelize.define(
  "PrivateMessage",
  {
    content: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "private_messages",
    timestamps: false,
  }
);

PrivateMessage.belongsTo(User, { as: "from", foreignKey: "fromId" });
PrivateMessage.belongsTo(PrivateChat, { foreignKey: "privateChatId" });

export default PrivateMessage;
