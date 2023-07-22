import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import http from 'http';
import * as THREE from 'three';
import fs from 'fs';

import { connect } from 'mongoose';

import { Server, Socket } from 'socket.io';
import https from 'https';

import cors from 'cors';
import { initializeSocket, updatePlayerPositions } from './socketServer/socketServer';
import messageRouter from './routers/messageRouter';

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

const mongoUrl = process.env.ENV === 'prod' ? process.env.PROD_MONGO_URL : process.env.DEV_MONGO_URL;
console.log(mongoUrl);
connect(mongoUrl ?? '').then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.log('Failed to connect to MongoDB', err);
});

app.use(cors(options));
app.use(express.json());
app.use("/messages", messageRouter);

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