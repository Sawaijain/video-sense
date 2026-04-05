import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext(null);

export function SocketProvider({ children, token }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
