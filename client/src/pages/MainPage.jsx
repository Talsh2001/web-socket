/* eslint-disable react/prop-types */
import { useEffect } from "react";
import SideNav from "../components/SideNav";
import { socket } from "../socket";
import axios from "axios";

import WelcomePage from "./WelcomePage";

const url = import.meta.env.VITE_API;

const MainPage = ({ onlineUsers, users }) => {
  const username = sessionStorage.getItem("username");
  const jToken = sessionStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      const user = users.find((user) => user.username === username);
      socket.emit("enter_chat", { username, userId: user._id });

      const { data: groupsData } = await axios.get(`${url}/chats/group`, {
        headers: { Authorization: `Bearer ${jToken}` },
      });
      const currentGroupChats = groupsData
        .filter((group) => group.participants.includes(username))
        .map((group) => group.customId);

      socket.emit("rejoin_groups", { username, groups: currentGroupChats });
    };
    fetchData();
  }, []);

  return (
    <>
      <WelcomePage />
    </>
  );
};

export default MainPage;
