/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, IconButton, Box, Typography, TextField, Button } from "@mui/material";
import {
  AddComment,
  ArrowForward,
  Circle,
  Person,
  GroupRounded,
  ClearRounded,
  ArrowBackRounded,
  CheckRounded,
  BlockRounded,
} from "@mui/icons-material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { socket } from "../socket";
import useSocketHandlers from "./BlockingEvents";

const SideNav = ({
  onlineUsers,
  users,
  currentUser,
  chats,
  groupChats,
  onChatCreate,
}) => {
  const [chatsView, setChatsView] = useState(true);
  const [newChat, setNewChat] = useState(false);
  const [newGroup, setNewGroup] = useState(false);
  const [editGroup, setEditGroup] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState(false);

  const [currentUserChats, setCurrentUserChats] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [currentGroupChats, setCurrentGroupChats] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedBy, setBlockedBy] = useState([]);

  const [sortedChats, setSortedChats] = useState([]);
  const [previousChats, setPreviousChats] = useState([]);

  const username = sessionStorage.getItem("username");
  const jToken = sessionStorage.getItem("accessToken");

  const navigate = useNavigate();

  const isXs = useMediaQuery((theme) => theme.breakpoints.up("xs"));
  const isSm = useMediaQuery((theme) => theme.breakpoints.up("sm"));
  const isMd = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const isLg = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  let drawerWidthVariant;
  if (isXs) drawerWidthVariant = 150;
  if (isSm) drawerWidthVariant = 190;
  if (isMd) drawerWidthVariant = 220;
  if (isLg) drawerWidthVariant = 220;

  const signout = () => {
    sessionStorage.setItem("accessToken", "");
    sessionStorage.setItem("username", "");
    socket.emit("exit_chat");
    navigate("/");
  };

  useEffect(() => {
    socket.on("last_message_sent", () => {
      const currentUserChatsData = chats.filter(
        (user) => user.customId && user.customId.includes(username)
      );
      setCurrentUserChats(currentUserChatsData);

      const currentGroupChatsData = groupChats.filter(
        (group) => group.participants && group.participants.includes(username)
      );
      setCurrentGroupChats(currentGroupChatsData);
      onChatCreate();
    });

    socket.on("send_group_chats", (groupChatsData) => {
      setCurrentGroupChats(groupChatsData);
    });
    socket.on("chat_deleted", () => {
      onChatCreate();
    });

    return () => {
      socket.off("last_message_sent");
      socket.off("send_group_chats");
      socket.off("chat_deleted");
    };
  }, [chats, currentGroupChats, groupChats, onChatCreate, username]);

  useEffect(() => {
    setCurrentUserChats(chats);
  }, [chats]);

  useEffect(() => {
    const fetchData = () => {
      if (!currentUser) return;

      if (currentUser.BlockedUsers && currentUser.BlockedUsers.length > 0) {
        setBlockedUsers(currentUser.BlockedUsers.map((user) => user.username));
      }
      if (currentUser.BlockedBy && currentUser.BlockedBy.length > 0) {
        setBlockedBy(currentUser.BlockedBy.map((user) => user.username));
      }

      const currentUserChatsData = chats.filter(
        (user) => user.customId && user.customId.includes(username)
      );

      setCurrentUserChats(currentUserChatsData);

      const CurrentUserGroupChatsData = groupChats.filter(
        (group) => group.participants && group.participants.includes(username)
      );
      setCurrentGroupChats(CurrentUserGroupChatsData);
    };
    fetchData();
  }, [chats, currentUser, groupChats, jToken, username]);

  useEffect(() => {
    const currentChats = [...currentGroupChats, ...currentUserChats];

    const hasNewMessage = currentChats.some((chat, index) => {
      if (!chat.messages || !Array.isArray(chat.messages)) return false;
      const prevMessages = previousChats[index]?.messages || [];
      return chat.messages.length !== prevMessages.length;
    });

    const hasFewerChats = currentChats.length < previousChats.length;

    if (hasNewMessage || hasFewerChats) {
      const newSortedChats = [...currentChats]
        .filter(
          (chat) =>
            chat.messages && Array.isArray(chat.messages) && chat.messages.length > 0
        )
        .sort((chatA, chatB) => {
          const latestMessageA = chatA.messages[chatA.messages.length - 1];
          const latestMessageB = chatB.messages[chatB.messages.length - 1];

          const dateA = new Date(latestMessageA.date);
          const dateB = new Date(latestMessageB.date);

          return dateB - dateA;
        });

      setSortedChats(newSortedChats);
      setPreviousChats(currentChats);
    }
  }, [currentUserChats, currentGroupChats, previousChats, chats]);

  const startChat = (receiverUsername) => {
    const receiverUser = users.find((user) => user.username === receiverUsername);
    if (!receiverUser) {
      console.error(`User with username ${receiverUsername} not found`);
      alert(`User ${receiverUsername} not found. Please try again.`);
      return;
    }
    const receiverId = receiverUser.id || receiverUser._id;
    navigate(`/chat/${receiverId}`);
    setNewChat(false);
  };

  const sendToGroupChat = (groupName) => {
    const group = currentGroupChats.find((group) => group.customId === groupName);
    if (!group) {
      console.error(`Group with name ${groupName} not found`);
      alert(`Group ${groupName} not found. Please try again.`);
      return;
    }
    const groupId = group._id;
    navigate(`/chat/${groupId}`);
  };

  const startGroupChat = (groupName, updatedGroupChatsData) => {
    const group = updatedGroupChatsData.find((group) => group.customId === groupName);

    if (!group) {
      console.error(`Group with name ${groupName} not found in updated data`);
      alert(`Group ${groupName} not found. Please try again.`);
      return;
    }

    const groupId = group._id;
    setCurrentGroupChats(updatedGroupChatsData);
    navigate(`/chat/${groupId}`);
    setNewChat(false);
  };

  const createGroup = () => {
    if (!groupName) {
      alert("Group name is required");
      return;
    }

    if (groupChats.map((ch) => ch.customId).includes(groupName)) {
      alert("Group name is taken");
      return;
    }

    socket.emit("join_group", {
      groupName,
      groupMembers: [...groupMembers, username],
      token: jToken,
      from: username,
      date: new Date(),
    });

    socket.once("send_group_chats", (updatedGroupChatsData) => {
      startGroupChat(groupName, updatedGroupChatsData);
    });

    setChatsView(true);
    setEditGroup(false);
    setGroupMembers([]);
  };

  useSocketHandlers(socket, setBlockedUsers, setBlockedBy);

  return (
    <>
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          flexShrink: 0,
          width: drawerWidthVariant,
          "& .MuiDrawer-paper": {
            width: drawerWidthVariant,
            bgcolor: "#14191C",
            color: "#FFF",
          },
        }}
      >
        {chatsView && (
          <>
            <Box
              mb={1}
              mx={1}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box ml={1}>
                <Typography sx={{ fontSize: 20 }} variant="body1">
                  chats
                </Typography>
              </Box>
              <IconButton
                onClick={() => {
                  setNewChat(true);
                  setChatsView(false);
                  setSearchText("");
                }}
              >
                <AddComment sx={{ fill: "#FFF", fontSize: 30 }} />
              </IconButton>
            </Box>
            <Box display="flex" justifyContent="center">
              <TextField
                sx={{
                  bgcolor: "#D9D9D9",
                  width: { xs: 100, sm: 130 },
                  borderRadius: 1,
                  "& .MuiInputBase-input": { height: 4, padding: 1.5 },
                }}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Box>
            <Box
              display="flex"
              overflowy="scroll"
              flexDirection="column"
              minHeight="87vh"
            >
              <Box
                mt={1}
                sx={{
                  height: "calc(100vh - 200px)",
                  overflowY: "auto",
                  paddingRight: 1,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {sortedChats
                  .filter((c) =>
                    c.customId
                      .split("-")
                      .find((name) => name !== username)
                      .includes(searchText)
                  )
                  .map((chat) => (
                    <Box
                      key={`${chat.participants ? "group" : "private"}-${chat._id}`}
                      borderRadius={2}
                      p={2}
                      m={1}
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "#404C53" } }}
                      onClick={() => {
                        if (!chat.participants) {
                          startChat(
                            chat.customId.split("-").find((name) => name !== username)
                          );
                        } else {
                          sendToGroupChat(chat.customId);
                        }
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box display="flex" alignItems="center">
                          {!chat.participants ? (
                            <Person
                              sx={{
                                bgcolor: "#000",
                                borderRadius: 10,
                                fontSize: 30,
                                p: 0.5,
                              }}
                            />
                          ) : (
                            <GroupRounded
                              sx={{
                                bgcolor: "#000",
                                borderRadius: 10,
                                fontSize: 30,
                                p: 0.5,
                              }}
                            />
                          )}

                          <Typography
                            ml={1}
                            mr={1}
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: { xs: "68px", sm: "120px", md: "180px" },
                            }}
                          >
                            {chat.customId.split("-").find((name) => name !== username)}
                          </Typography>
                        </Box>
                        {!chat.participants && (
                          <Circle
                            sx={{
                              fontSize: 10,
                              fill: (() => {
                                const otherUsername = chat.customId
                                  .split("-")
                                  .find((name) => name !== username);

                                // Hide online status if either user has blocked the other
                                if (
                                  blockedUsers.includes(otherUsername) ||
                                  blockedBy.includes(otherUsername)
                                ) {
                                  return "gray";
                                }

                                return Object.values(onlineUsers).some(
                                  (u) => u.username === otherUsername
                                )
                                  ? "green"
                                  : "red";
                              })(),
                            }}
                          />
                        )}
                      </Box>
                      <Typography
                        ml={0.2}
                        mt={1}
                        sx={{
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {chat.participants &&
                          chat.messages.length === 1 &&
                          (chat.messages[chat.messages.length - 1].from === username
                            ? "You: "
                            : `${chat.messages[chat.messages.length - 1].from}: `)}
                        {chat.participants
                          ? chat.messages[chat.messages.length - 1].action === "join" &&
                            chat.messages[chat.messages.length - 1].content.includes(
                              username
                            )
                            ? "You've joined this group"
                            : chat.messages[chat.messages.length - 1].content
                          : chat.messages[chat.messages.length - 1].content}
                      </Typography>
                    </Box>
                  ))}
              </Box>

              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                p={0.5}
                mt={1.3}
                mx={0.5}
                borderRadius={3}
                sx={{ cursor: "pointer", "&:hover": { bgcolor: "#333" } }}
                onClick={() => {
                  setChatsView(false);
                  setBlockedUsersList(true);
                }}
              >
                <Typography fontSize={{ xs: 14, sm: 16 }}>Blocked Users</Typography>
                <BlockRounded sx={{ ml: 1, fill: "red" }} />
              </Box>

              <Box display="flex" justifyContent="center" mt="auto">
                <Button
                  onClick={signout}
                  sx={{ bgcolor: "red", color: "#FFF", width: { xs: 120, sm: 140 } }}
                >
                  Sign out
                </Button>
              </Box>
            </Box>
          </>
        )}

        {newChat && (
          <>
            <Box
              mb={1}
              mx={1}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box ml={1}>
                <Typography sx={{ fontSize: { xs: 16, sm: 17 } }} variant="body1">
                  New Chat
                </Typography>
              </Box>
              <IconButton
                onClick={() => {
                  setNewChat(false);
                  setChatsView(true);
                  setSearchText("");
                }}
              >
                <ArrowForward sx={{ fill: "#FFF", fontSize: 28 }} />
              </IconButton>
            </Box>
            <Box display="flex" justifyContent="center">
              <TextField
                sx={{
                  bgcolor: "#D9D9D9",
                  width: { xs: 100, sm: 130 },
                  borderRadius: 1,
                  "& .MuiInputBase-input": { height: 4, padding: 1.5 },
                }}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Box>
            <Box display="flex" flexDirection="column" minHeight="87vh">
              <Box
                mt={1}
                sx={{
                  height: "calc(100vh - 200px)",
                  overflowY: "auto",
                  paddingRight: 1,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={2}
                  m={1}
                  sx={{ cursor: "pointer", "&:hover": { bgcolor: "#404C53" } }}
                  onClick={() => {
                    setNewChat(false);
                    setNewGroup(true);
                  }}
                  borderRadius={2}
                >
                  <Box display="flex" alignItems="center">
                    <GroupRounded
                      sx={{
                        bgcolor: "#96ADFF",
                        borderRadius: 10,
                        fontSize: 30,
                        p: 0.5,
                        fill: "#000",
                      }}
                    />
                    <Typography ml={1.7}>New Group</Typography>
                  </Box>
                </Box>
                {users
                  .filter((user) => user.username !== username)
                  .filter(
                    (user) =>
                      !currentUserChats
                        .map((chat) =>
                          chat.customId.split("-").find((name) => name !== username)
                        )
                        .includes(user.username)
                  )
                  .filter((u) => u.username.includes(searchText))
                  .map((user) => (
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      p={2}
                      m={{ xs: 0, sm: 1 }}
                      sx={{ cursor: "pointer", "&:hover": { bgcolor: "#404C53" } }}
                      onClick={() => {
                        startChat(user.username);
                        setChatsView(true);
                      }}
                      borderRadius={2}
                      key={user._id || user.id}
                    >
                      <Box display="flex" alignItems="center">
                        <Person
                          sx={{
                            bgcolor: "#000",
                            borderRadius: 10,
                            fontSize: 30,
                            p: 0.5,
                          }}
                        />
                        <Typography
                          ml={1.7}
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: { xs: "48.2px", sm: "70px", md: "100px" },
                          }}
                        >
                          {user.username}
                        </Typography>
                      </Box>

                      <Circle
                        sx={{
                          fontSize: 10,
                          fill: (() => {
                            // Hide online status if either user has blocked the other
                            if (
                              blockedUsers.includes(user.username) ||
                              blockedBy.includes(user.username)
                            ) {
                              return "gray";
                            }

                            return Object.values(onlineUsers).some(
                              (u) => u.username === user.username
                            )
                              ? "green"
                              : "red";
                          })(),
                        }}
                      />
                    </Box>
                  ))}
              </Box>

              <Box display="flex" justifyContent="center" mt="auto">
                <Button
                  onClick={signout}
                  sx={{ bgcolor: "red", color: "#FFF", width: 140 }}
                >
                  Sign out
                </Button>
              </Box>
            </Box>
          </>
        )}

        {newGroup && (
          <>
            <Box
              mb={1}
              mx={1}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box ml={1}>
                <Typography sx={{ fontSize: 17 }} variant="body1">
                  Add Users
                </Typography>
              </Box>
              <IconButton
                onClick={() => {
                  setNewGroup(false);
                  setNewChat(true);
                  setSearchText("");
                  setGroupMembers([]);
                }}
              >
                <ArrowForward sx={{ fill: "#FFF", fontSize: 28 }} />
              </IconButton>
            </Box>
            <Box display="flex" justifyContent="center">
              <TextField
                sx={{
                  bgcolor: "#D9D9D9",
                  width: 130,
                  borderRadius: 1,
                  "& .MuiInputBase-input": { height: 4, padding: 1.5 },
                }}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </Box>
            <Box
              display="flex"
              overflowy="scroll"
              flexDirection="column"
              minHeight="87vh"
            >
              <Box
                mt={1}
                sx={{
                  height: "calc(100vh - 200px)",
                  overflowY: "auto",
                  paddingRight: 1,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {groupMembers.length > 0 && (
                  <Box m={1}>
                    {groupMembers.map((username) => (
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        key={username}
                        mb={0.4}
                      >
                        <Box display="flex">
                          <Person sx={{ mr: 1 }} />
                          <Typography
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: { xs: "78px", sm: "130px", md: "195px" },
                            }}
                          >
                            {username}
                          </Typography>
                        </Box>
                        <IconButton
                          sx={{ p: 0 }}
                          onClick={() =>
                            setGroupMembers(
                              groupMembers.filter((member) => member !== username)
                            )
                          }
                        >
                          <ClearRounded sx={{ fill: "#FFF", ml: 0.5 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
                {users
                  .filter((user) => user.username !== username)
                  .filter((u) => u.username.includes(searchText))
                  .filter((u) => !groupMembers.includes(u.username))
                  .map((user) => (
                    <Box
                      key={user.id || user._id || user.username}
                      borderRadius={2}
                      py={2}
                      px={1.5}
                      m={1}
                      sx={{
                        cursor: "pointer",
                        bgcolor:
                          blockedUsers.includes(user.username) ||
                          blockedBy.includes(user.username)
                            ? "#333"
                            : "none",
                        "&:hover": {
                          bgcolor: blockedBy.includes(user.username) ? "none" : "#404C53",
                        },
                      }}
                      onClick={() => {
                        if (blockedBy.includes(user.username)) {
                          alert(
                            `You cannot add ${user.username} to the group because they have blocked you.`
                          );
                          return;
                        }
                        if (blockedUsers.includes(user.username)) {
                          const confirmUnblockAndAdd = window.confirm(
                            "The user you selected has been blocked. Would you like to unblock the user and add them to the group?"
                          );
                          if (confirmUnblockAndAdd) {
                            socket.emit("unblock_user", {
                              username,
                              blockedUser: user.username,
                              token: jToken,
                              blockedUserId: users.find(
                                (user) => user.username === user.username
                              )._id,
                            });
                            setGroupMembers([...groupMembers, user.username]);
                            return;
                          }
                          return;
                        }
                        setGroupMembers([...groupMembers, user.username]);
                      }}
                    >
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box display="flex" alignItems="center">
                          <Person
                            sx={{
                              bgcolor: blockedUsers.includes(user.username)
                                ? "#666"
                                : "#000",
                              borderRadius: 10,
                              fontSize: 30,
                              p: 0.5,
                            }}
                          />
                          <Typography
                            ml={1}
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: blockedBy.includes(user.username) ? "#999" : "#FFF",
                              maxWidth: { xs: "68px", sm: "120px", md: "180px" },
                            }}
                          >
                            {user.username}
                          </Typography>
                        </Box>
                        {blockedUsers.includes(user.username) && (
                          <BlockRounded
                            sx={{
                              width: 15,
                              height: 15,
                              fill: "red",
                              position: "relative",
                              top: 1,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
              </Box>
              {groupMembers.length > 0 && (
                <Box display="flex" justifyContent="center">
                  <IconButton
                    sx={{ width: 20, height: 20, borderRadius: 10, m: 2 }}
                    onClick={() => {
                      setNewGroup(false);
                      setEditGroup(true);
                    }}
                  >
                    <ArrowBackRounded
                      sx={{
                        bgcolor: "#96ADFF",
                        borderRadius: 10,
                        fill: "#FFF",
                        width: 40,
                        height: 40,
                      }}
                    />
                  </IconButton>
                </Box>
              )}
              <Box display="flex" justifyContent="center" mt="auto">
                <Button
                  onClick={signout}
                  sx={{ bgcolor: "red", color: "#FFF", width: 140 }}
                >
                  Sign out
                </Button>
              </Box>
            </Box>
          </>
        )}
        {editGroup && (
          <>
            <Box
              mb={1}
              mx={1}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box ml={1}>
                <Typography sx={{ fontSize: 17 }} variant="body1">
                  New Group
                </Typography>
              </Box>
              <IconButton
                onClick={() => {
                  setNewGroup(true);
                  setEditGroup(false);
                }}
              >
                <ArrowForward sx={{ fill: "#FFF", fontSize: 28 }} />
              </IconButton>
            </Box>
            <Box display="flex" justifyContent="center">
              <GroupRounded
                sx={{
                  bgcolor: "#000",
                  fill: "#FFF",
                  width: { xs: 110, sm: 140, md: 200 },
                  height: { xs: 110, sm: 140, md: 200 },
                  padding: 1.2,
                  borderRadius: 50,
                }}
              />
            </Box>
            <Box display="flex" justifyContent="center" mt={3}>
              <TextField
                sx={{
                  bgcolor: "#D9D9D9",
                  width: { xs: 130, sm: 180, md: 240 },
                  borderRadius: 1,
                  "& .MuiInputBase-input": { height: 4, padding: 1.5 },
                }}
                placeholder="Group Name"
                onChange={(e) => setGroupName(e.target.value)}
              />
            </Box>
            <Box display="flex" justifyContent="center" mt={3}>
              <IconButton onClick={createGroup}>
                <CheckRounded
                  sx={{
                    bgcolor: "#96ADFF",
                    fill: "#FFF",
                    borderRadius: 50,
                    width: { xs: 30, sm: 40 },
                    height: { xs: 30, sm: 40 },
                  }}
                />
              </IconButton>
            </Box>
          </>
        )}
        {blockedUsersList && (
          <>
            <Box>
              <Box
                mb={1}
                mx={1}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box ml={0.5}>
                  <Typography sx={{ fontSize: 17 }} variant="body1">
                    Blocked Users
                  </Typography>
                </Box>
                <IconButton
                  onClick={() => {
                    setBlockedUsersList(false);
                    setChatsView(true);
                  }}
                  sx={{ pl: 0.5, pr: 0 }}
                >
                  <ArrowForward sx={{ fill: "#FFF", fontSize: 22 }} />
                </IconButton>
              </Box>
              <Box
                mt={1}
                sx={{
                  height: "90vh",
                  overflowY: "auto",
                  paddingRight: 1,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {blockedUsers.map((Username) => (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    p={2}
                    m={1}
                    sx={{ cursor: "pointer", "&:hover": { bgcolor: "#404C53" } }}
                    onClick={() => {
                      const confirmUnblock = window.confirm(
                        "Would you like to unblock the user?"
                      );
                      if (confirmUnblock) {
                        socket.emit("unblock_user", {
                          username,
                          blockedUser: Username,
                          token: jToken,
                          blockedUserId: users.find((user) => user.username === Username)
                            ._id,
                        });
                      }
                    }}
                    borderRadius={2}
                    key={Username}
                  >
                    <Box display="flex" alignItems="center">
                      <Person
                        sx={{
                          bgcolor: "#000",
                          borderRadius: 10,
                          fontSize: 30,
                          p: 0.5,
                        }}
                      />
                      <Typography
                        ml={1.7}
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: { xs: "65px", sm: "100px", md: "160px" },
                        }}
                      >
                        {Username}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
      </Drawer>
    </>
  );
};

export default SideNav;
