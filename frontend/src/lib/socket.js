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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null; // Reset the socket instance
  }
};

export const isSocketConnected = () => {
  return socket && socket.connected;
};
