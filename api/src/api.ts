import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import http from 'http';
import * as THREE from 'three';
import fs from 'fs';

import { Server, Socket } from 'socket.io';
import https from 'https';

import cors from 'cors';
import { initializeSocket, updatePlayerPositions } from './socketServer/socketServer';

dotenv.config();

let server : http.Server;
const app: Express = express();

if (process.env.ENV === 'prod' && process.env.KEY_PATH && process.env.CERT_PATH) {
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


const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

initializeSocket(io);

  
const updateInterval = 7.8125; // 1000 ms / 128
setInterval(() => {
    updatePlayerPositions(io);
}, updateInterval);



server.listen(port, () => {
    console.log(`⚡️[server]: Server is running at port ${port}`);
});