/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { socket } from "../socket";

import { Box, Typography, TextField, Checkbox, IconButton } from "@mui/material";
import {
  Person,
  GroupRounded,
  BlockRounded,
  DeleteOutlineRounded,
  ExitToAppRounded,
  PersonAddRounded,
  CheckRounded,
  ArrowForwardRounded,
} from "@mui/icons-material";
import useSocketHandlers from "./BlockingEvents";

const url = import.meta.env.VITE_API;

const Profile = ({ currentUser, users, chats }) => {
  const [groupChats, setGroupChats] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [receiverUsername, setReceiverUsername] = useState("");
  const [isAddNewMembers, setIsAddNewMembers] = useState(false);
  const [checkedStates, setCheckedStates] = useState({});
  const [blockedUsers, setBlockedUsers] = useState([]);

  const username = sessionStorage.getItem("username");
  const jToken = sessionStorage.getItem("accessToken");

  const { id } = useParams();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: groupChatsData } = await axios.get(`${url}/chats/group`, {
        headers: { Authorization: `Bearer ${jToken}` },
      });
      setGroupChats(groupChatsData);

      setReceiverUsername(users.find((user) => user._id === id)?.username);
      const senderId = users.find((u) => u.username === username)._id;
      socket.emit("enter_chat", { username, userId: senderId });
    };
    fetchData();
  }, [id, jToken, username, users]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      if (currentUser.blockedUsers.length > 0) {
        setBlockedUsers(currentUser.blockedUsers);
      }
    };
    fetchData();
  }, [currentUser]);

  useSocketHandlers(socket, setBlockedUsers);

  const deleteChat = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this chat?");
    if (confirmDelete) {
      const chatId = chats.find(
        (chat) =>
          chat.customId.includes(username) && chat.customId.includes(receiverUsername)
      )?._id;
      const { data } = await axios.delete(`${url}/chats/private/${chatId}`, {
        headers: { Authorization: `Bearer ${jToken}` },
      });
      console.log(data);
      navigate("/main");
    }
  };

  const addUser = () => {
    setIsAddNewMembers("true");
  };

  const blockUser = () => {
    const confirmBlock = window.confirm("Are you sure you want to block this user?");
    if (confirmBlock) {
      socket.emit("block_user", {
        username,
        blockedUser: receiverUsername,
        token: jToken,
        blockedUserId: users.find((user) => user.username === receiverUsername)._id,
      });
    }
  };

  const unblockUser = () => {
    const confirmUnblock = window.confirm("Are you sure you want to unblock this user?");
    if (confirmUnblock) {
      socket.emit("unblock_user", {
        username,
        blockedUser: receiverUsername,
        token: jToken,
        blockedUserId: users.find((user) => user.username === receiverUsername)._id,
      });
    }
  };

  const leaveGroup = () => {
    const confirmLeave = window.confirm("Are you sure you want to leave this group?");
    if (confirmLeave) {
      socket.emit("leave_group", {
        groupName: groupChats.find((group) => group._id === id)?.customId,
        username,
        token: jToken,
        date: new Date(),
      });
      navigate("/main");
    }
  };

  const handleCheckboxClick = (username) => {
    setCheckedStates((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  return (
    <>
      {groupChats.find((chat) => chat._id === id) && (
        <>
          <Box mr={{ xs: "169.200px", sm: "219.200px", md: "279.200px" }}>
            <IconButton
              disableRipple
              sx={{ justifySelf: "flex-end", display: "flex" }}
              onClick={() => navigate(-1)}
            >
              <ArrowForwardRounded
                sx={{
                  mt: 2,
                  mr: 2,
                  width: 30,
                  height: 30,
                  fill: "#000",
                }}
              />
            </IconButton>
            <Box mt={3} display="flex" justifyContent="center">
              <GroupRounded
                sx={{
                  width: 150,
                  height: 150,
                  bgcolor: "#000",
                  fill: "#fff",
                  borderRadius: 50,
                  p: 1,
                }}
              />
            </Box>
            <Box mt={2.5} display="flex" justifyContent="center">
              <Typography variant="h4">
                {groupChats.find((group) => group._id === id).customId}
              </Typography>
            </Box>
            <Box mt={2.5} display="flex" justifyContent="center">
              <Typography
                variant="body"
                sx={{
                  maxWidth: "60vw",
                  wordWrap: "break-word",
                  mx: { xs: 2, sm: 0 },
                }}
              >
                {`Group created by ${
                  groupChats.find((group) => group._id === id).messages[0].from
                } on ${new Date(
                  groupChats.find((group) => group._id === id).messages[0].date
                )
                  .toLocaleString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                  .replace(/,/g, "")}`}
              </Typography>
            </Box>
            <Box mt={1} display="flex" justifyContent="center">
              <Typography variant="h6">Groups Members:</Typography>
            </Box>
            <Box
              mt={1}
              display="flex"
              justifyContent="center"
              alignItems="center"
              width="fit-content"
              mx="auto"
              p={1}
              borderRadius={20}
              sx={{ "&:hover": { bgcolor: "#FFF" }, cursor: "pointer" }}
              onClick={addUser}
            >
              <PersonAddRounded
                sx={{
                  bgcolor: "#000",
                  fill: "#FFF",
                  width: 30,
                  height: 30,
                  p: 0.5,
                  borderRadius: 20,
                  mr: 1,
                }}
              />
              <Typography sx={{ fontWeight: 500 }}>Add Members</Typography>
            </Box>
            <Box
              mt={1}
              display="flex"
              justifyContent="center"
              sx={{
                maxHeight: "192px",
                overflowY: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="flex-start">
                {groupChats
                  .find((group) => group._id === id)
                  .participants.sort((a, b) => {
                    if (a === username) return -1;
                    if (b === username) return 1;
                    if (a === receiverUsername) return -1;
                    if (b === receiverUsername) return 1;
                    return a.localeCompare(b);
                  })

                  .map((par, index) => (
                    <Box key={index}>
                      <Box
                        sx={{
                          width: "fit-content",
                          cursor: index === 0 ? "default" : "pointer",
                          "&:hover": index === 0 ? {} : { bgcolor: "#FFF" },
                          mb: 0.5,
                          p: 1,
                          borderRadius: 5,
                          color: index === 0 ? "gray" : "inherit",
                        }}
                        display="flex"
                        flexDirection="column"
                        onClick={() => {
                          if (index === 0) return;
                          const isMyName =
                            users.find((user) => user.username === par).username ===
                            username;
                          if (isMyName) {
                            return;
                          }
                          navigate(
                            `/profile/${users.find((user) => user.username === par)._id}`
                          );
                        }}
                      >
                        {par}
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
            <Box mt={2.5} display="flex" justifyContent="center">
              <Box
                display="flex"
                alignItems="center"
                onClick={leaveGroup}
                sx={{
                  width: "fit-content",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#FFD9D9" },
                  px: 0.2,
                  borderRadius: 10,
                }}
              >
                <Typography sx={{ mr: 0.5, color: "red" }}>Leave Group</Typography>
                <ExitToAppRounded sx={{ fill: "red" }} />
              </Box>
            </Box>
          </Box>
        </>
      )}
      {!groupChats.find((chat) => chat._id === id) && (
        <>
          <Box mr={{ xs: "169.200px", sm: "219.200px", md: "279.200px" }}>
            <IconButton
              disableRipple
              sx={{ justifySelf: "flex-end", display: "flex" }}
              onClick={() => navigate(-1)}
            >
              <ArrowForwardRounded
                sx={{
                  mt: 2,
                  mr: 2,
                  width: 30,
                  height: 30,
                  fill: "#000",
                }}
              />
            </IconButton>
            <Box mt={4} display="flex" justifyContent="center">
              <Person
                sx={{
                  width: 150,
                  height: 150,
                  bgcolor: "#000",
                  fill: "#fff",
                  borderRadius: 50,
                  p: 1,
                }}
              />
            </Box>
            <Box mt={2.5} display="flex" justifyContent="center">
              <Typography variant="h4">{receiverUsername}</Typography>
            </Box>
            <Box mt={2.5} display="flex" justifyContent="center">
              <Typography variant="h6">Joint Groups:</Typography>
            </Box>
            <Box
              mt={2.5}
              display="flex"
              justifyContent="center"
              sx={{
                maxHeight: "250px",
                overflowY: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="flex-start">
                {groupChats.filter(
                  (group) =>
                    group.participants.includes(username) &&
                    group.participants.includes(receiverUsername)
                ) &&
                  groupChats
                    .filter(
                      (group) =>
                        group.participants.includes(username) &&
                        group.participants.includes(receiverUsername)
                    )
                    .map((group) => (
                      <Box key={group._id}>
                        <Box
                          sx={{
                            width: "fit-content",
                            cursor: "pointer",
                            "&:hover": { bgcolor: "#FFF" },
                            mb: 1,
                            p: 1,
                            borderRadius: 5,
                          }}
                          display="flex"
                          flexDirection="column"
                          onClick={() => navigate(`/chat/${group._id}`)}
                        >
                          <strong>{group.customId}</strong>
                          <Box
                            display="flex"
                            sx={{
                              maxWidth: { xs: "50vw", sm: "270px" },
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                            }}
                          >
                            {group.participants
                              .sort((a, b) => {
                                if (a === username) return -1;
                                if (b === username) return 1;
                                if (a === receiverUsername) return -1;
                                if (b === receiverUsername) return 1;
                                return a.localeCompare(b);
                              })
                              .map((par, index) => (
                                <React.Fragment key={index}>
                                  {index > 0 && ", "}
                                  {par === username ? "You" : par}
                                </React.Fragment>
                              ))}
                          </Box>
                        </Box>
                      </Box>
                    ))}
              </Box>
            </Box>
            <Box mt={2.5} display="flex" justifyContent="center">
              <Box
                display="flex"
                alignItems="center"
                onClick={() =>
                  blockedUsers.includes(receiverUsername) ? unblockUser() : blockUser()
                }
                sx={{
                  width: "fit-content",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: blockedUsers.includes(receiverUsername)
                      ? "#D9FFD9"
                      : "#FFD9D9",
                  },
                  px: 0.2,
                  borderRadius: 10,
                }}
              >
                <Typography
                  sx={{
                    mr: 0.5,
                    color: blockedUsers.includes(receiverUsername) ? "green" : "red",
                  }}
                >
                  {blockedUsers.includes(receiverUsername)
                    ? "Unblock User"
                    : "Block User"}
                </Typography>
                <BlockRounded
                  sx={{ fill: blockedUsers.includes(receiverUsername) ? "green" : "red" }}
                />
              </Box>
            </Box>
            {chats.find(
              (chat) =>
                chat.customId.includes(username) &&
                chat.customId.includes(receiverUsername)
            ) && (
              <Box mt={2} display="flex" justifyContent="center">
                <Box
                  display="flex"
                  alignItems="center"
                  onClick={deleteChat}
                  sx={{
                    width: "fit-content",
                    cursor: "pointer",
                    bgcolor: "red",
                    px: 0.2,
                    borderRadius: 10,
                  }}
                >
                  <Typography sx={{ mr: 0.5, color: "#FFF" }}>Delete Chat</Typography>
                  <DeleteOutlineRounded sx={{ fill: "#FFF" }} />
                </Box>
              </Box>
            )}
          </Box>
        </>
      )}
      {isAddNewMembers && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            position: "absolute",
            top: "50%",
            left: { xs: "33vw", sm: "35vw", md: "37vw", lg: "40vw" },
            transform: "translate(-50%, -50%)",
            mr: { xs: "169.200px", sm: "219.200px", md: "279.200px" },
            width: "50%",
            bgcolor: "#FFF",
            borderRadius: 6,
            p: 2,
          }}
        >
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5">Adding Members</Typography>
              <IconButton
                sx={{ p: 0 }}
                disableRipple
                onClick={() => {
                  setIsAddNewMembers(false);
                  setCheckedStates({});
                }}
              >
                <ArrowForwardRounded sx={{ width: 30, height: 30, ml: 2 }} />
              </IconButton>
            </Box>
            <TextField
              sx={{
                bgcolor: "#D9D9D9",
                width: "96%",
                borderRadius: 1,
                "& .MuiInputBase-input": { height: 4, padding: 1.5 },
                mt: 1,
              }}
              placeholder="Search User..."
              onChange={(e) => console.log(e.target.value)}
            />
            <Typography sx={{ mt: 1, fontWeight: 500, fontSize: 16, mb: 1 }}>
              Users:
            </Typography>
            <Box
              sx={{
                maxHeight: "300px",
                overflowY: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              }}
            >
              {users
                .filter((user) => user.username !== username)
                .sort((a, b) => {
                  const isAInGroup = groupChats
                    .find((group) => group._id === id)
                    ?.participants.includes(a.username);
                  const isBInGroup = groupChats
                    .find((group) => group._id === id)
                    ?.participants.includes(b.username);

                  if (isAInGroup && !isBInGroup) return -1;
                  if (!isAInGroup && isBInGroup) return 1;
                  return a.username.localeCompare(b.username);
                })
                .map((user) => {
                  const isUserInGroup = groupChats
                    .find((group) => group._id === id)
                    ?.participants.includes(user.username);
                  return (
                    <Box key={user._id}>
                      <Box mt={1}>
                        <Checkbox
                          onClick={() => {
                            if (isUserInGroup) return;

                            handleCheckboxClick(user.username);
                          }}
                          checked={isUserInGroup || checkedStates[user.username] || false}
                          sx={{ p: 0, mr: 1, mt: 1, mb: 1 }}
                          disabled={isUserInGroup}
                        />
                        {user.username}
                      </Box>
                    </Box>
                  );
                })}
            </Box>
            {Object.values(checkedStates).includes(true) && (
              <Box display="flex" justifyContent="center" mt={0.5}>
                <IconButton
                  sx={{ p: 0 }}
                  onClick={() => {
                    const selectedUsernames = Object.keys(checkedStates).filter(
                      (username) => checkedStates[username] === true
                    );

                    socket.emit("add_users_to_group", {
                      users: selectedUsernames,
                      groupName: groupChats.find((group) => group._id === id).customId,
                      token: jToken,
                      date: new Date(),
                    });
                    setIsAddNewMembers(false);
                    setCheckedStates({});
                    window.location.reload();
                  }}
                >
                  <CheckRounded
                    sx={{
                      bgcolor: "green",
                      fill: "#FFF",
                      width: 30,
                      height: 30,
                      borderRadius: 20,
                    }}
                  />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </>
  );
};

export default Profile;
