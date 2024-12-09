const express = require("express");
const cors = require("cors");
const connectDB = require("./configs/db");
const path = require("path");

const https = require("https");
const http = require("http");

const fs = require("fs");

require("dotenv").config();

const { Server } = require("socket.io");
const PrivateChat = require("./models/privateModel");
const GroupChat = require("./models/groupModel");
const Users = require("./models/usersModel");

const { requireAuth, verifyToken } = require("./middlewares/auth-middleware");

const usersRouter = require("./routers/usersRouter");
const messagesRouter = require("./routers/messagesRouter");

const app = express();
const port = process.env.PORT || 80;

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use("/users", usersRouter);
app.use("/chats", requireAuth, messagesRouter);

let server = http.createServer(app);

if (process.env.ENVIRONMENT !== "development") {
  const options = {
    key: fs.readFileSync("/etc/letsencrypt/live/tal-shalev.me/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/tal-shalev.me/fullchain.pem"),
  };

  server = https.createServer(options, app);
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
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    let currentChat = await PrivateChat.findOne({
      customId: [from, to].sort().join("-"),
    });

    if (!currentChat) {
      const customId = [from, to].sort().join("-");
      currentChat = new PrivateChat({ customId, messages: [] });
    }

    currentChat.messages.push({ from, content, date });
    await currentChat.save();

    io.emit("last_message_sent", { content });

    const receiver = onlineUsers[receiverId];
    if (receiver) {
      io.to(receiver.socketId).emit("receive_message", {
        content,
        from,
        date,
      });
    }
  });

  socket.on("join_group", async ({ groupName, groupMembers, token, from, date }) => {
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    let currentGroupChat = await GroupChat.findOne({
      customId: groupName,
    });

    if (!currentGroupChat) {
      currentGroupChat = new GroupChat({
        customId: groupName,
        participants: groupMembers,
        messages: [],
      });
      currentGroupChat.messages.push({
        from,
        content: `${from} has created the group`,
        action: "group_creation",
        date,
      });
      await currentGroupChat.save();
    }
    io.emit("last_message_sent", { from });

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

    let currentChat = await GroupChat.findOne({
      customId: groupName,
    });

    currentChat.messages.push({ from, content, action: "message", date });
    await currentChat.save();

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

    let currentChat = await GroupChat.findOne({
      customId: groupName,
    });

    users.forEach((user) => {
      currentChat.participants.push(user);
      currentChat.messages.push({
        from: user,
        content: `${user} has joined the group`,
        action: "join",
        date,
      });
    });

    await currentChat.save();

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

    const groupChat = await GroupChat.findOne({ customId: groupName });

    if (groupChat) {
      groupChat.participants = groupChat.participants.filter(
        (participant) => participant !== username
      );
      groupChat.messages.push({
        from: username,
        content: `${username} has left the group`,
        action: "leave",
        date,
      });
      await groupChat.save();
      io.emit("last_message_sent", { groupName });

      console.log(`${username} removed from the database group ${groupName}`);
    }

    socket.leave(groupName);
  });

  socket.on("block_user", async ({ username, blockedUser, token, blockedUserId }) => {
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    const userData = await Users.findOne({ username });
    const blockedUserData = await Users.findOne({ username: blockedUser });

    if (userData && blockedUserData) {
      userData.blockedUsers.push(blockedUser);
      blockedUserData.blockedBy.push(username);
      await userData.save();
      await blockedUserData.save();
    }

    socket.emit("user_blocked", {
      blockedUsersList: userData.blockedUsers,
    });

    const receiver = onlineUsers[blockedUserId];

    if (receiver) {
      io.to(receiver.socketId).emit("blocked_by", {
        blockedByList: blockedUserData.blockedBy,
      });
    }
    console.log(`${username} blocked ${blockedUser}`);
  });

  socket.on("unblock_user", async ({ username, blockedUser, token, blockedUserId }) => {
    const validToken = await verifyToken(token);

    if (!validToken) {
      return;
    }

    const userData = await Users.findOne({ username });
    const blockedUserData = await Users.findOne({ username: blockedUser });

    if (userData && blockedUserData) {
      userData.blockedUsers = userData.blockedUsers.filter(
        (userN) => userN !== blockedUser
      );
      blockedUserData.blockedBy = blockedUserData.blockedBy.filter(
        (userN) => userN !== username
      );

      await userData.save();
      await blockedUserData.save();
    }

    socket.emit("user_unblocked", {
      blockedUsersList: userData.blockedUsers,
    });

    const receiver = onlineUsers[blockedUserId];

    if (receiver) {
      io.to(receiver.socketId).emit("unblocked_by", {
        blockedByList: blockedUserData.blockedBy,
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
