/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { socket } from "../socket";

import WelcomePage from "./WelcomePage";

const MainPage = ({ users, groupChats }) => {
  const username = sessionStorage.getItem("username");

  useEffect(() => {
    const fetchData = () => {
      const user = users.find((user) => user.username === username);

      socket.emit("enter_chat", { username, userId: user?._id });

      const currentGroupChats = groupChats
        .filter((group) => group.participants.includes(username))
        .map((group) => group.customId);

      socket.emit("rejoin_groups", { username, groups: currentGroupChats });
    };
    fetchData();
  }, [groupChats, username, users]);

  return (
    <>
      <WelcomePage />
    </>
  );
};

export default MainPage;
