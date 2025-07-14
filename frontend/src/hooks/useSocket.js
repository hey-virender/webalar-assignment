
import { useEffect, useRef } from "react";
import { getSocket } from "../lib/socket";
import useAuthStore  from "../store/auth.store";
import { useNavigate } from "react-router-dom";

export const useSocket = (onConnect, onDisconnect) => {
  const socketRef = useRef(getSocket());
  const {logout} = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    const socket = socketRef.current;


    if (!socket.connected) {
      socket.connect();
    }

    socket.on("unauthorized", () => {
      logout();
      navigate("/login");
    });

    if (onConnect) socket.on("connect", onConnect);
    if (onDisconnect) socket.on("disconnect", onDisconnect);

    return () => {
      if (onConnect) socket.off("connect", onConnect);
      if (onDisconnect) socket.off("disconnect", onDisconnect);
    };
  }, [onConnect, onDisconnect, logout, navigate]);

  return socketRef.current;
};
