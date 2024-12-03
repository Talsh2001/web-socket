import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import MainPage from "./pages/MainPage";
import Chat from "./pages/Chat";
import { useState, useEffect } from "react";
import { socket } from "./socket";
import Profile from "./components/Profile";

const App = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    socket.on("online_users", (onlineUsers) => {
      setOnlineUsers(onlineUsers);
    });

    return () => {
      socket.off("online_users");
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/main" element={<MainPage onlineUsers={onlineUsers} />} />
        <Route path="/chat/:id" element={<Chat onlineUsers={onlineUsers} />} />
        <Route path="/profile/:id" element={<Profile onlineUsers={onlineUsers} />} />
      </Routes>
    </>
  );
};

export default App;
