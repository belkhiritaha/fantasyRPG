import { Server } from 'socket.io';

export function createWebSocketServer(server: any) : Server {
    console.log('Creating WebSocket server...');

    const wss = new Server(server, {
        cors: {
            origin: '*',
        },
    });

    wss.on('connection', (socket) => {
        console.log('New WebSocket connection');
    });

    wss.on('disconnect', (socket) => {
        console.log('WebSocket connection closed');
    });
    

    console.log('WebSocket server is up and running');
    return wss;
}
