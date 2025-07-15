import GroupChat from "../models/sequelize/GroupChat.js";
import PrivateChat from "../models/sequelize/PrivateChat.js";
import PrivateMessage from "../models/sequelize/PrivateMessage.js";
import User from "../models/sequelize/User.js";

const getAllGroupMessages = async (currentUser) => {
  try {
    // Get only group chats where the current user is a participant
    const groupChats = await GroupChat.findAll({
      include: [
        {
          model: User,
          where: { id: currentUser.id },
          through: { attributes: [] },
        },
      ],
    });

    // Transform the data to match client expectations
    const transformedGroupChats = await Promise.all(
      groupChats.map(async (chat) => {
        // Get all users for this group chat
        const allUsers = await User.findAll({
          include: [
            {
              model: GroupChat,
              where: { id: chat.id },
              through: { attributes: [] },
            },
          ],
          attributes: ["id", "username"],
        });

        // Get messages for this group chat
        const messages = await chat.getGroupMessages({
          include: [
            {
              model: User,
              as: "from",
              attributes: ["id", "username"],
            },
          ],
          order: [["date", "ASC"]],
        });

        const transformedMessages = messages.map((msg) => ({
          content: msg.content,
          from: msg.from?.username || "Unknown",
          date: msg.date,
          action: msg.action,
        }));

        return {
          _id: chat.id,
          customId: chat.name,
          name: chat.name,
          participants: allUsers.map((user) => user.username),
          Users: allUsers,
          messages: transformedMessages,
        };
      })
    );

    return transformedGroupChats;
  } catch (error) {
    console.error("Error in getAllGroupMessages:", error);
    return [];
  }
};

const getAllPrivateMessages = async (currentUser) => {
  try {
    // Get only private chats where the current user is a participant
    const privateChats = await PrivateChat.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "username"],
          where: { id: currentUser.id },
        },
      ],
    });

    // Get all users for each chat (not just the current user)
    const privateChatsWithAllUsers = await Promise.all(
      privateChats.map(async (chat) => {
        const allUsers = await User.findAll({
          include: [
            {
              model: PrivateChat,
              where: { id: chat.id },
              through: { attributes: [] },
            },
          ],
          attributes: ["id", "username"],
        });
        return { ...chat.toJSON(), Users: allUsers };
      })
    );

    // For each chat, get the messages separately
    const transformedChats = await Promise.all(
      privateChatsWithAllUsers.map(async (chat) => {
        const users = chat.Users || [];
        const usernames = users.map((user) => user.username).sort();
        const customId = usernames.join("-");

        // Get messages for this chat
        const messages = await PrivateMessage.findAll({
          where: { privateChatId: chat.id },
          include: [
            {
              model: User,
              as: "from",
              attributes: ["id", "username"],
            },
          ],
          order: [["date", "ASC"]],
        });

        const transformedMessages = messages.map((msg) => ({
          content: msg.content,
          from: msg.from?.username || "Unknown",
          date: msg.date,
        }));

        return {
          _id: chat.id,
          customId: customId,
          messages: transformedMessages,
        };
      })
    );

    return transformedChats;
  } catch (error) {
    console.error("Error in getAllPrivateMessages:", error);
    return [];
  }
};

const deletePrivateMessage = async (id, currentUser) => {
  // First check if the user is a participant in this chat
  const chat = await PrivateChat.findOne({
    where: { id },
    include: [
      {
        model: User,
        where: { id: currentUser.id },
        through: { attributes: [] },
      },
    ],
  });

  if (!chat) {
    throw new Error("Chat not found or you don't have permission to delete it");
  }

  await PrivateChat.destroy({ where: { id } });
  return "Chat Deleted!";
};

const deleteGroupMessage = async (id, currentUser) => {
  // First check if the user is a participant in this group
  const group = await GroupChat.findOne({
    where: { id },
    include: [
      {
        model: User,
        where: { id: currentUser.id },
        through: { attributes: [] },
      },
    ],
  });

  if (!group) {
    throw new Error("Group not found or you don't have permission to delete it");
  }

  await GroupChat.destroy({ where: { id } });
  return "Group Chat Deleted!";
};

export {
  getAllGroupMessages,
  getAllPrivateMessages,
  deletePrivateMessage,
  deleteGroupMessage,
};
