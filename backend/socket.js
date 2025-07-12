import { Server } from 'socket.io';
import sharedSession from 'express-socket.io-session';

export function setupSocket(server, sessionMiddleware) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true
    }
  });

  // Use express-session inside socket.io
  io.use(sharedSession(sessionMiddleware, {
    autoSave: true
  }));

  io.on('connection', (socket) => {
    const user = socket.handshake.session?.user;

    if (!user) {
      console.log('Unauthorized socket attempt');
      return socket.disconnect();
    }

    console.log('User connected:', user.id);

    // Handle events
    socket.on('send-note', (data) => {
      console.log(`User ${user.id} sent note:`, data);
      // broadcast or save to DB
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', user.id);
    });
  });
}
