import { Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import MainPage from "./pages/MainPage";
import Chat from "./pages/Chat";
import { useState, useEffect, useCallback } from "react";
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
  const [username] = useState(() => sessionStorage.getItem("username"));
  const [jToken, setJToken] = useState(() => sessionStorage.getItem("accessToken"));

  const currentUser = users.find((user) => user.username === username);

  const location = useLocation();

  useEffect(() => {
    const handleOnlineUsers = (onlineUsers) => setOnlineUsers(onlineUsers);

    socket.on("online_users", handleOnlineUsers);

    return () => {
      socket.off("online_users", handleOnlineUsers);
    };
  }, []);

  const fetchChats = useCallback(async () => {
    if (!jToken) return;

    try {
      const [{ data: chatsData }, { data: groupChatsData }] = await Promise.all([
        axios.get(`${url}/chats/private`, {
          headers: { Authorization: `Bearer ${jToken}` },
        }),
        axios.get(`${url}/chats/group`, {
          headers: { Authorization: `Bearer ${jToken}` },
        }),
      ]);

      setChats(chatsData);
      setGroupChats(groupChatsData);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }, [jToken]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: usersData } = await axios.get(`${url}/users`);
        setUsers(usersData);

        // Only fetch chats if we have a token, and do it once
        if (jToken) {
          await fetchChats();
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [jToken, fetchChats]);

  useEffect(() => {
    const handleUpdateUsers = (updatedUsers) => {
      setUsers(updatedUsers);
    };

    socket.on("update_user_list", handleUpdateUsers);

    return () => {
      socket.off("update_user_list", handleUpdateUsers);
    };
  }, []);

  const handleChatChange = () => {
    fetchChats();
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Login setJToken={setJToken} />} />
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
              onChatDelete={fetchChats}
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
          setChats={setChats}
          groupChats={groupChats}
          onChatCreate={handleChatChange}
        />
      )}
    </>
  );
};

export default App;
