/* eslint-disable react/prop-types */
import React from "react";
import { useEffect, useState, useRef } from "react";
import { AppBar, Toolbar, Typography, Box, TextField, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { Person, Send, GroupRounded, MoreVertRounded } from "@mui/icons-material";
import useSocketHandlers from "../components/BlockingEvents";

const Offset = styled("div")(({ theme }) => theme.mixins.toolbar);

const Chat = ({ users, chats, groupChats }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);

  const { id } = useParams();
  const receiverUsername = users.find((user) => user._id === id)?.username;
  const is2PersonChat = !!receiverUsername;

  const navigate = useNavigate();

  const senderUsername = sessionStorage.getItem("username");
  const jToken = sessionStorage.getItem("accessToken");

  const groupName = groupChats.find((group) => group._id == id)?.customId;

  // console.log(messages);

  const bottomRef = useRef(null);

  const location = useLocation();

  useEffect(() => {
    const fetchUsers = () => {
      const currentUser = users.find((user) => user.username === senderUsername);

      if (currentUser && currentUser.blockedUsers.length > 0) {
        setBlockedUsers(currentUser.blockedUsers);
      }
      if (currentUser && currentUser.blockedBy.length > 0) {
        setBlockedBy(currentUser.blockedBy);
      }

      if (currentUser) {
        socket.emit("enter_chat", { username: senderUsername, userId: currentUser?._id });
      }

      const currentGroupChats = groupChats
        .filter((group) => group.participants.includes(senderUsername))
        .map((group) => group.customId);

      socket.emit("rejoin_groups", {
        username: senderUsername,
        groups: currentGroupChats,
      });
    };
    fetchUsers();
  }, [groupChats, senderUsername, users]);

  useEffect(() => {
    if (!is2PersonChat) return;

    const fetch2PersonChats = async () => {
      const currentChat = chats.find(
        (chat) => chat.customId === [receiverUsername, senderUsername].sort().join("-")
      );

      setMessages([]);

      if (currentChat) {
        setMessages(currentChat.messages);
      }
    };
    fetch2PersonChats();
  }, [
    receiverUsername,
    users,
    is2PersonChat,
    jToken,
    groupChats,
    senderUsername,
    id,
    chats,
  ]);
  useEffect(() => {
    if (is2PersonChat) return;

    const fetchGroupChats = async () => {
      const currentGroupMessages = groupChats.find((group) => group._id === id);

      setMessages([]);

      if (currentGroupMessages) {
        setMessages(currentGroupMessages.messages);
      }
    };
    fetchGroupChats();
  }, [
    receiverUsername,
    users,
    is2PersonChat,
    jToken,
    groupChats,
    senderUsername,
    id,
    chats,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (blockedUsers.includes(receiverUsername)) {
      alert(
        `You cannot send a message to ${receiverUsername} because they are blocked. Please unblock them to start a conversation.`
      );
      return;
    }

    if (blockedBy.includes(receiverUsername)) {
      alert(
        `You cannot send a message to ${receiverUsername} because they have blocked you.`
      );
      return;
    }

    if (groupChats.find((group) => group._id === id)) {
      if (message.trim()) {
        const groupName = groupChats.find((group) => group._id === id);

        const messageData = {
          content: message,
          from: senderUsername,
          token: jToken,
          groupName: groupName.customId,
          date: new Date(),
        };

        socket.emit("send_group_message", messageData);

        setMessages((prevMessages) => [...prevMessages, messageData]);

        setMessage("");
      }
    } else {
      if (message.trim()) {
        const messageData = {
          content: message,
          from: senderUsername,
          to: receiverUsername,
          token: jToken,
          receiverId: id,
          date: new Date(),
        };

        socket.emit("send_message", messageData);

        setMessages((prevMessages) => [...prevMessages, messageData]);

        setMessage("");
      }
    }
  };

  useEffect(() => {
    socket.on("receive_group_message", (messageData) => {
      if (messageData.from !== senderUsername) {
        setMessages((prevMessages) => [...prevMessages, messageData]);
      }
    });
    socket.on("receive_message", (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    return () => {
      socket.off("receive_group_message");
      socket.off("receive_message");
    };
  }, [senderUsername]);

  useEffect(() => {
    setMessage("");
  }, [location.pathname]);

  useSocketHandlers(socket, setBlockedUsers, setBlockedBy);

  return (
    <>
      <AppBar sx={{ bgcolor: "#fff", color: "#000" }}>
        <Toolbar
          sx={{
            justifyContent: "space-between",
            mr: { xs: "169.200px", sm: "219.200px", md: "279.200px" },
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            sx={{ width: { xs: "80%", sm: "89%", md: "95%" } }}
          >
            {receiverUsername && <Person />}
            {groupName && <GroupRounded />}
            <Typography
              ml={2}
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: { xs: "100%", sm: "100%", md: "92%" },
              }}
            >
              {receiverUsername && receiverUsername}
              {groupName && groupName}
            </Typography>
          </Box>
          {receiverUsername && (
            <IconButton sx={{ p: 0 }} onClick={() => navigate(`/profile/${id}`)}>
              <MoreVertRounded />
            </IconButton>
          )}
          {groupName && (
            <IconButton sx={{ p: 0 }} onClick={() => navigate(`/profile/${id}`)}>
              <MoreVertRounded />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Offset />
      <Box
        sx={{
          px: 3,
          maxHeight: "calc(100vh - 155px)",
          overflow: "auto",
          mt: 1.5,
        }}
      >
        {receiverUsername &&
          messages
            .filter((msg) => msg.from === senderUsername || msg.from === receiverUsername)
            .sort((a, b) => {
              const dateA = new Date(a.date).setHours(0, 0, 0, 0);
              const dateB = new Date(b.date).setHours(0, 0, 0, 0);
              return dateA - dateB;
            })
            .map((message, index, filteredMessages) => {
              const messageDate = new Date(message.date).setHours(0, 0, 0, 0);
              const prevMessageDate =
                index === 0
                  ? null
                  : new Date(filteredMessages[index - 1].date).setHours(0, 0, 0, 0);

              const isNewDate = index === 0 || messageDate !== prevMessageDate;

              const currentDate = new Date().setHours(0, 0, 0, 0);

              const differenceInMillis = currentDate - messageDate;

              const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000;

              const isMoreThanOneWeekAgo = differenceInMillis > oneWeekInMillis;

              return (
                <React.Fragment key={index}>
                  {isNewDate && (
                    <Box display="flex" justifyContent="center" my={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        {!isMoreThanOneWeekAgo &&
                          new Date(message.date).toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        {isMoreThanOneWeekAgo &&
                          new Date(message.date).toLocaleDateString("en-GB")}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    mr={{ xs: "169.200px", sm: "219.200px", md: "279.200px" }}
                    display="flex"
                    justifyContent={
                      message.from === receiverUsername ? "flex-end" : "flex-start"
                    }
                    my={1}
                  >
                    <Box
                      bgcolor={message.from === receiverUsername ? "#FFFFFF" : "#96ADFF"}
                      maxWidth="65%"
                      sx={{ borderRadius: "8px", padding: "8px" }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="flex-end"
                      >
                        <Box
                          sx={{
                            maxWidth: "100%",
                            overflowWrap: "break-word",
                            wordBreak: "break-word",
                          }}
                        >
                          {message.content}
                        </Box>
                        <Typography
                          sx={{ ml: 1, whiteSpace: "nowrap" }}
                          variant="caption"
                        >
                          {`${new Date(message.date).getHours()}:${
                            new Date(message.date).getMinutes() < 10
                              ? "0" + new Date(message.date).getMinutes()
                              : new Date(message.date).getMinutes()
                          }`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </React.Fragment>
              );
            })}

        {groupName && (
          <>
            {messages
              .sort((a, b) => {
                const dateA = new Date(a.date).setHours(0, 0, 0, 0);
                const dateB = new Date(b.date).setHours(0, 0, 0, 0);
                return dateA - dateB;
              })
              .map((message, index, filteredMessages) => {
                const messageDate = new Date(message.date).setHours(0, 0, 0, 0);
                const prevMessageDate =
                  index === 0
                    ? null
                    : new Date(filteredMessages[index - 1].date).setHours(0, 0, 0, 0);

                const isNewDate = index === 0 || messageDate !== prevMessageDate;

                const currentDate = new Date().setHours(0, 0, 0, 0);

                const differenceInMillis = currentDate - messageDate;

                const oneWeekInMillis = 7 * 24 * 60 * 60 * 1000;

                const isMoreThanOneWeekAgo = differenceInMillis > oneWeekInMillis;

                return (
                  <React.Fragment key={index}>
                    {isNewDate && (
                      <Box display="flex" justifyContent="center" my={2}>
                        <Typography variant="subtitle2" color="textSecondary">
                          {!isMoreThanOneWeekAgo &&
                            new Date(message.date).toLocaleDateString("en-US", {
                              weekday: "long",
                            })}
                          {isMoreThanOneWeekAgo &&
                            new Date(message.date).toLocaleDateString("en-GB")}
                        </Typography>
                      </Box>
                    )}

                    <Box
                      mr={{ xs: "169.200px", sm: "219.200px", md: "279.200px" }}
                      display="flex"
                      justifyContent={
                        message.action === "message"
                          ? message.from === senderUsername
                            ? "flex-start"
                            : "flex-end"
                          : "center"
                      }
                      my={1}
                    >
                      {message.action === "message" && (
                        <Box
                          bgcolor={
                            message.from === senderUsername ? "#96ADFF" : "#FFFFFF"
                          }
                          maxWidth="65%"
                          sx={{
                            wordWrap: "break-word",
                            borderRadius: "8px",
                            padding: "8px",
                          }}
                        >
                          <Box display="flex" justifyContent="flex-end">
                            {message.from !== senderUsername && message.from}
                          </Box>
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="flex-end"
                          >
                            <Box
                              sx={{
                                maxWidth: "100%",
                                overflowWrap: "break-word",
                                wordBreak: "break-word",
                              }}
                            >
                              {message.content}
                            </Box>
                            <Typography
                              sx={{ ml: 1, whiteSpace: "nowrap" }}
                              variant="caption"
                            >
                              {`${new Date(message.date).getHours()}:${
                                new Date(message.date).getMinutes() < 10
                                  ? "0" + new Date(message.date).getMinutes()
                                  : new Date(message.date).getMinutes()
                              }`}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {message.action !== "message" && (
                        <Box bgcolor="#14191C" color="#FFF" px={1} borderRadius={20}>
                          {message.content}
                        </Box>
                      )}
                    </Box>
                  </React.Fragment>
                );
              })}
          </>
        )}
        <div ref={bottomRef} />
      </Box>

      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        mr={{ xs: "169.200px", sm: "219.200px", md: "279.200px" }}
        position="fixed"
        bottom={15}
        right="4vw"
        left="4vw"
      >
        <TextField
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          sx={{ mr: 2, width: "60vw" }}
          placeholder="Message"
        />
        <IconButton onClick={send}>
          <Send
            sx={{
              fontSize: 40,
              bgcolor: "#000",
              borderRadius: 10,
              fill: "#FFF",
              width: 70,
            }}
          />
        </IconButton>
      </Box>
    </>
  );
};

export default Chat;
