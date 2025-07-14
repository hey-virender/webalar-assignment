import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
  }
  return socket;
};
