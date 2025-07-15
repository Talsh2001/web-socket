import { DataTypes } from "sequelize";
import { sequelize } from "../../configs/db.js";
import User from "./User.js";
import GroupChat from "./GroupChat.js";

const GroupParticipant = sequelize.define(
  "GroupParticipant",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    tableName: "group_participants",
    timestamps: false,
  }
);

User.belongsToMany(GroupChat, { through: GroupParticipant });
GroupChat.belongsToMany(User, { through: GroupParticipant });

export default GroupParticipant;
