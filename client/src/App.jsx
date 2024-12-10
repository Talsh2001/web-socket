import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import MainPage from "./pages/MainPage";
import Chat from "./pages/Chat";
import { useState, useEffect } from "react";
import { socket } from "./socket";
import Profile from "./components/Profile";
import axios from "axios";
import SideNav from "./components/SideNav";
const url = import.meta.env.VITE_API;

const App = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [groupChats, setGroupChats] = useState([]);

  const username = sessionStorage.getItem("username");
  const jToken = sessionStorage.getItem("accessToken");
  const currentUser = users.find((user) => user.username === username);

  const location = useLocation();

  console.log(users);

  useEffect(() => {
    socket.on("online_users", (onlineUsers) => {
      setOnlineUsers(onlineUsers);
    });

    return () => {
      socket.off("online_users");
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: usersData } = await axios.get(`${url}/users`);
      console.log(usersData);

      setUsers(usersData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (jToken) {
        const { data: chatsData } = await axios.get(`${url}/chats/private`, {
          headers: { Authorization: `Bearer ${jToken}` },
        });
        setChats(chatsData);
        const { data: groupChatsData } = await axios.get(`${url}/chats/group`, {
          headers: { Authorization: `Bearer ${jToken}` },
        });
        setGroupChats(groupChatsData);
      }
    };
    fetchData();
  }, [jToken]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/main"
          element={
            <MainPage onlineUsers={onlineUsers} users={users} groupChats={groupChats} />
          }
        />
        <Route
          path="/chat/:id"
          element={
            <Chat
              onlineUsers={onlineUsers}
              users={users}
              chats={chats}
              groupChats={groupChats}
            />
          }
        />
        <Route
          path="/profile/:id"
          element={
            <Profile
              onlineUsers={onlineUsers}
              currentUser={currentUser}
              users={users}
              chats={chats}
              groupChats={groupChats}
            />
          }
        />
      </Routes>
      {location.pathname !== "/" && (
        <SideNav
          onlineUsers={onlineUsers}
          users={users}
          currentUser={currentUser}
          chats={chats}
          groupChats={groupChats}
        />
      )}
    </>
  );
};

export default App;
