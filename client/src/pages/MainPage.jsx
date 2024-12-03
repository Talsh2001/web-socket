import { useEffect } from "react";
import SideNav from "../components/SideNav";
import { socket } from "../socket";
import axios from "axios";

import WelcomePage from "./WelcomePage";

const url = "http://localhost:3000";

const MainPage = ({ onlineUsers }) => {
  const username = sessionStorage.getItem("username");
  const jToken = sessionStorage.getItem("accessToken");

  useEffect(() => {
    const fetchData = async () => {
      const { data: users } = await axios.get(`${url}/users`);
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
      <SideNav onlineUsers={onlineUsers} />
    </>
  );
};

export default MainPage;
