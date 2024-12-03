import { useEffect } from "react";

const useSocketHandlers = (socket, setBlockedUsers, setBlockedBy) => {
  useEffect(() => {
    socket.on("user_blocked", ({ blockedUsersList }) => {
      setBlockedUsers(blockedUsersList.reduce((acc, curr) => acc.concat(curr), []));
    });

    socket.on("blocked_by", ({ blockedByList }) => {
      setBlockedBy(blockedByList.reduce((acc, curr) => acc.concat(curr), []));
    });

    socket.on("user_unblocked", ({ blockedUsersList }) => {
      setBlockedUsers(blockedUsersList.reduce((acc, curr) => acc.concat(curr), []));
    });

    socket.on("unblocked_by", ({ blockedByList }) => {
      setBlockedBy(blockedByList.reduce((acc, curr) => acc.concat(curr), []));
    });

    return () => {
      socket.off("user_blocked");
      socket.off("blocked_by");
      socket.off("user_unblocked");
      socket.off("unblocked_by");
    };
  }, [socket, setBlockedUsers, setBlockedBy]);
};

export default useSocketHandlers;
