import { DataTypes } from "sequelize";
import { sequelize } from "../../configs/db.js";
import User from "./User.js";

const BlockedUser = sequelize.define(
  "BlockedUser",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
  },
  {
    tableName: "blocked_users",
    timestamps: false,
  }
);

User.belongsToMany(User, {
  as: "BlockedUsers",
  through: BlockedUser,
  foreignKey: "userId",
  otherKey: "blockedUserId",
});

User.belongsToMany(User, {
  as: "BlockedBy",
  through: BlockedUser,
  foreignKey: "blockedUserId",
  otherKey: "userId",
});

export default BlockedUser;
