import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";
import fs from "fs";
import dotenv from "dotenv";
import { Server } from "socket.io";

import connectDB, { sequelize } from "./configs/db.js";
import PrivateChat from "./models/sequelize/PrivateChat.js";
import GroupChat from "./models/sequelize/GroupChat.js";
import User from "./models/sequelize/User.js";
import PrivateMessage from "./models/sequelize/PrivateMessage.js";
import GroupMessage from "./models/sequelize/GroupMessage.js";
import BlockedUser from "./models/sequelize/BlockedUser.js";
import GroupParticipant from "./models/sequelize/GroupParticipant.js";
import { requireAuth, verifyToken } from "./middlewares/auth-middleware.js";
import usersRouter from "./routers/usersRouter.js";
import messagesRouter from "./routers/messagesRouter.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

connectDB();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use("/users", usersRouter);
app.use("/chats", requireAuth, messagesRouter);

// HTTP or HTTPS setup
let server;
if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
  };
  server = https.createServer(options, app);
} else {
  server = http.createServer(app);
}

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = {};
const groupUsers = {};

const updateOnlineUsers = () => {
  io.emit("online_users", Object.values(onlineUsers));
};

const setUserToOffline = (socketId) => {
  const userId = Object.keys(onlineUsers).find(
    (key) => onlineUsers[key].socketId === socketId
  );

  if (userId) {
    delete onlineUsers[userId];
    updateOnlineUsers();
  }
};

io.on("connection", (socket) => {
  console.log("connection", socket.id);

  socket.on("enter_chat", ({ username, userId }) => {
    console.log("enter_chat", username);

    onlineUsers[userId] = { socketId: socket.id, username };

    updateOnlineUsers();
  });

  socket.on("exit_chat", () => {
    setUserToOffline(socket.id);
  });

  socket.on("send_message", async (messageData) => {
    const { content, from, to, token, receiverId, date } = messageData;
    console.log("Received send_message:", { content, from, to, receiverId });

    const validToken = await verifyToken(token);

    if (!validToken) {
      console.log("Invalid token");
      return;
    }

    const fromUser = await User.findOne({ where: { username: from } });
    const toUser = await User.findOne({ where: { username: to } });

    if (!fromUser || !toUser) {
      console.log("User not found:", { fromUser: !!fromUser, toUser: !!toUser });
      return;
    }

    // Find existing chat between these two users
    const existingChats = await PrivateChat.findAll({
      include: [
        {
          model: User,
          where: { id: [fromUser.id, toUser.id] },
          through: { attributes: [] },
        },
      ],
    });

    // Find chat that has exactly these two users
    let chat = null;
    for (const existingChat of existingChats) {
      const users = await existingChat.getUsers();
      if (
        users.length === 2 &&
        users.some((u) => u.id === fromUser.id) &&
        users.some((u) => u.id === toUser.id)
      ) {
        chat = existingChat;
        break;
      }
    }

    // If no chat exists, create one
    if (!chat) {
      chat = await PrivateChat.create();
      await chat.addUsers([fromUser, toUser]);
    }

    await PrivateMessage.create({
      content,
      date,
      fromId: fromUser.id,
      privateChatId: chat.id,
    });

    io.emit("last_message_sent", { content });

    const receiver = onlineUsers[receiverId];
    if (receiver) {
      io.to(receiver.socketId).emit("receive_message", {
        content,
        from,
        date,
      });
    }

    // Also emit back to sender for confirmation (in case they have multiple tabs open)
    const sender = Object.values(onlineUsers).find((user) => user.username === from);
    if (sender && sender.socketId !== socket.id) {
      io.to(sender.socketId).emit("receive_message", {
        content,
        from,
        date,
      });
    }
  });

  socket.on("delete_chat", ({ chatId, receiverUsername }) => {
    const receiver = Object.values(onlineUsers).find(
      (user) => user.username === receiverUsername
    );
    if (receiver) {
      io.to(receiver.socketId).emit("chat_deleted", chatId);
    }
  });

  socket.on("join_group", async ({ groupName, groupMembers, token, from, date }) => {
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    const [group, created] = await GroupChat.findOrCreate({
      where: { name: groupName },
    });

    const users = await User.findAll({
      where: {
        username: groupMembers,
      },
    });

    await group.addUsers(users);

    if (created) {
      const fromUser = await User.findOne({ where: { username: from } });
      await GroupMessage.create({
        content: `${from} has created the group`,
        action: "group_creation",
        date,
        fromId: fromUser.id,
        GroupChatId: group.id,
      });
    }

    io.emit("last_message_sent", { from });

    const groupChatsData = await GroupChat.findAll({
      include: [User, GroupMessage],
    });

    io.emit("send_group_chats", groupChatsData);

    groupMembers.forEach((memberUsername) => {
      const user = Object.values(onlineUsers).find((u) => u.username === memberUsername);

      if (user && user.socketId) {
        io.to(user.socketId).emit("send_group_chats", groupChatsData);
      }
    });

    groupUsers[groupName] = new Set();

    groupMembers.forEach((username) => {
      const user = Object.values(onlineUsers).find((u) => u.username === username);
      if (user) {
        socket.join(groupName);
        groupUsers[groupName].add(username);
        console.log(`${username} joined ${groupName}`);
      }
    });
  });

  socket.on("rejoin_groups", ({ username, groups }) => {
    groups.forEach((groupName) => {
      const user = Object.values(onlineUsers).find((u) => u.username === username);
      if (user) {
        socket.join(groupName);
        console.log(`${username} rejoined ${groupName}`);
      }
    });
  });

  socket.on("send_group_message", async (messageData) => {
    const { content, from, token, groupName, date } = messageData;

    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    const group = await GroupChat.findOne({ where: { name: groupName } });
    const fromUser = await User.findOne({ where: { username: from } });

    if (!group || !fromUser) {
      return;
    }

    await GroupMessage.create({
      content,
      action: "message",
      date,
      fromId: fromUser.id,
      GroupChatId: group.id,
    });

    io.emit("last_message_sent", { from });

    io.to(groupName).emit("receive_group_message", {
      content,
      from,
      date,
    });
  });

  socket.on("add_users_to_group", async ({ users, groupName, token, date }) => {
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    const group = await GroupChat.findOne({ where: { name: groupName } });
    const userObjects = await User.findAll({
      where: {
        username: users,
      },
    });

    if (!group || userObjects.length === 0) {
      return;
    }

    await group.addUsers(userObjects);

    for (const user of userObjects) {
      await GroupMessage.create({
        content: `${user.username} has joined the group`,
        action: "join",
        date,
        fromId: user.id,
        GroupChatId: group.id,
      });
    }

    io.emit("last_message_sent", { groupName });

    groupUsers[groupName] = new Set();

    users.forEach((username) => {
      const user = Object.values(onlineUsers).find((u) => u.username === username);
      if (user) {
        socket.join(groupName);
        groupUsers[groupName].add(username);
        console.log(`${username} joined ${groupName}`);
      }
    });
  });

  socket.on("leave_group", async ({ groupName, username, token, date }) => {
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    if (groupUsers[groupName]) {
      groupUsers[groupName].delete(username);
      console.log(`${username} removed from in-memory groupUsers list for ${groupName}`);
    }

    const group = await GroupChat.findOne({ where: { name: groupName } });
    const user = await User.findOne({ where: { username } });

    if (group && user) {
      await group.removeUser(user);
      await GroupMessage.create({
        content: `${username} has left the group`,
        action: "leave",
        date,
        fromId: user.id,
        GroupChatId: group.id,
      });

      const participants = await group.getUsers();
      if (participants.length === 0) {
        // Manually delete all group messages before destroying the group
        await GroupMessage.destroy({
          where: { GroupChatId: group.id },
        });
        await group.destroy();
      }
    }

    io.emit("last_message_sent", { groupName });

    socket.leave(groupName);
  });

  socket.on("block_user", async ({ username, blockedUser, token, blockedUserId }) => {
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    const user = await User.findOne({ where: { username } });
    const userToBlock = await User.findOne({ where: { username: blockedUser } });

    if (user && userToBlock) {
      await user.addBlockedUser(userToBlock);
    }

    const blockedUsers = await user.getBlockedUsers();
    const blockedUsersUsernames = blockedUsers.map((u) => u.username);

    socket.emit("user_blocked", {
      blockedUsersList: blockedUsersUsernames,
    });

    const receiver = onlineUsers[blockedUserId];

    if (receiver) {
      const blockedBy = await userToBlock.getBlockedBy();
      const blockedByUsernames = blockedBy.map((u) => u.username);
      io.to(receiver.socketId).emit("blocked_by", {
        blockedByList: blockedByUsernames,
      });
    }
    console.log(`${username} blocked ${blockedUser}`);
  });

  socket.on("unblock_user", async ({ username, blockedUser, token, blockedUserId }) => {
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    const user = await User.findOne({ where: { username } });
    const userToUnblock = await User.findOne({
      where: { username: blockedUser },
    });

    if (user && userToUnblock) {
      await user.removeBlockedUser(userToUnblock);
    }

    const blockedUsers = await user.getBlockedUsers();
    const blockedUsersUsernames = blockedUsers.map((u) => u.username);

    socket.emit("user_unblocked", {
      blockedUsersList: blockedUsersUsernames,
    });

    const receiver = onlineUsers[blockedUserId];

    if (receiver) {
      const blockedBy = await userToUnblock.getBlockedBy();
      const blockedByUsernames = blockedBy.map((u) => u.username);
      io.to(receiver.socketId).emit("unblocked_by", {
        blockedByList: blockedByUsernames,
      });
    }

    console.log(`${username} unblocked ${blockedUser}`);
  });

  socket.on("disconnect", () => {
    setUserToOffline(socket.id);
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
