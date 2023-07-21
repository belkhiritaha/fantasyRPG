import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import http from 'http';
import * as THREE from 'three';
import fs from 'fs';

// import { createWebSocketServer } from './websocket/websockets';
import { Server, Socket } from 'socket.io';
import https from 'https';

import cors from 'cors';

dotenv.config();

let server : http.Server;
const app: Express = express();

if (process.env.NODE_ENV === 'prod' && process.env.KEY_PATH && process.env.CERT_PATH) {
    const httpsOptions = {
        key: fs.readFileSync(process.env.KEY_PATH ?? ''),
        cert: fs.readFileSync(process.env.CERT_PATH ?? ''),
    };
    console.log('Starting HTTPS server');
    server = https.createServer(httpsOptions, app);    
}
else {
    console.log('Starting HTTP server');
    server = http.createServer(app);
}

const allowedOrigins = ["http://localhost:5173", "https://fantasy.belkhiri.dev"];
const options: cors.CorsOptions = {
    origin: allowedOrigins,
    credentials: true,
};

app.use(cors(options));

const port = process.env.PORT;

// export const wss = createWebSocketServer(server);

const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

interface Player {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    forwardVector: THREE.Vector3;
    yAxisAngle: number;
}

const groundPosY = -10;
const players: { [id: string]: Player } = {};

io.on('connection', (socket: Socket) => {
    console.log('New WebSocket connection');
    const playerId = socket.id;
    players[playerId] = { position: new THREE.Vector3(), velocity: new THREE.Vector3(), forwardVector: new THREE.Vector3(), yAxisAngle: 0 };
    socket.emit('initGameState', { id: playerId, players: players });

    socket.broadcast.emit('new_player', { id: playerId, position: players[playerId].position });

    socket.on('movement', (data: { forwardVector: { x: number, y: number, z: number }, sideVector: { x: number, y: number, z: number }, deltaTime: number, keyStates: { [key: string]: boolean } }) => {
        const forwardVector = new THREE.Vector3(data.forwardVector.x, data.forwardVector.y, data.forwardVector.z);
        const sideVector = new THREE.Vector3(data.sideVector.x, data.sideVector.y, data.sideVector.z);
        if (data.keyStates['KeyW']) {
            players[playerId].velocity.add(forwardVector.multiplyScalar(data.deltaTime * 10));
        }
        if (data.keyStates['KeyS']) {
            players[playerId].velocity.add(forwardVector.multiplyScalar(-data.deltaTime * 10));
        }
        if (data.keyStates['KeyA']) {
            players[playerId].velocity.add(sideVector.multiplyScalar(-data.deltaTime * 10));
        }
        if (data.keyStates['KeyD']) {
            players[playerId].velocity.add(sideVector.multiplyScalar(data.deltaTime * 10));
        }
        if (data.keyStates['Space']) {
            players[playerId].velocity.y = 1;
        }
        if (data.keyStates['ShiftLeft']) {
            players[playerId].velocity.y = -1;
        }

        players[playerId].forwardVector = forwardVector;
    });

    socket.on('rotation', (data: { yAxisAngle: number }) => {
        players[playerId].yAxisAngle = data.yAxisAngle;

        socket.broadcast.emit('playerRotationUpdate', { id: playerId, yAxisAngle: data.yAxisAngle });
    });

    socket.on('disconnect', () => {
        console.log('WebSocket connection closed');
        delete players[playerId];
        io.emit('disconnected', playerId);
    });
});

const gravity = new THREE.Vector3(0, -9.8, 0);
const deltaTime = 1 / 128; // Tick rate
const damping = Math.exp(-4 * deltaTime) - 1;

function updatePlayerPositions() {
    // Adjust the movement speed factor as needed
    const movementSpeed = 1;
  
  
    for (const playerId in players) {
        const player = players[playerId];
        // Apply gravity
        player.velocity.addScaledVector(gravity, deltaTime);
        // Apply damping
        const deltaPosition = player.velocity.clone().multiplyScalar(deltaTime * 10);
        player.position.add(deltaPosition);
        player.velocity.addScaledVector(player.velocity, damping);

        
        if (player.position.y < groundPosY) {
            player.position.y = groundPosY;
            player.velocity.y = 0;
        }



        // player.x += player.velocity.x * movementSpeed * deltaTime;
        // player.y += player.velocity.y * movementSpeed * deltaTime;
        // player.z += player.velocity.z * movementSpeed * deltaTime;
    }

    // send {id: {x, y, z}}}
    const playersToSend : { [id: string]: { x: number, y: number, z: number } } = {};
    for (const playerId in players) {
        const player = players[playerId];
        playersToSend[playerId] = {
            x:player.position.x,
            y: player.position.y,
            z: player.position.z,
        };
    }

    io.emit('playersPositionUpdates', playersToSend);
}
  
const updateInterval = 7.8125; // 1000 ms / 128
setInterval(updatePlayerPositions, updateInterval);


server.listen(port, () => {
    console.log(`⚡️[server]: Server is running at port ${port}`);
});