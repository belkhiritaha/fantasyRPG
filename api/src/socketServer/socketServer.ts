import { Server, Socket } from 'socket.io';
import * as THREE from 'three';
import messageModels from '../models/message.models';

interface Player {
    name: string;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    forwardVector: THREE.Vector3;
    yAxisAngle: number;
}

const groundPosY = -10;
const adjectives = ["Whimsical","Bubbly","Zany","Quirky","Wacky","Goofy","Cheeky","Kooky","Silly","Bouncy","Peculiar","Zesty","Fuzzy","Jovial","Jolly","Boisterous","Witty","Funky","Spiffy","Zippy"];
const animals = ["Penguin","Cheetah","Sloth","Kangaroo","Lemur","Hippo","Narwhal","Platypus","Chinchilla","Meerkat","Quokka","Raccoon","Alpaca","Hedgehog","Llama","Pufferfish","Axolotl","Capybara","Orangutan","Wombat"];

const players: { [id: string]: Player } = {};

export function initializeSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('New WebSocket connection');
        const playerId = socket.id;
        const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${animals[Math.floor(Math.random() * animals.length)]}`;
        players[playerId] = { position: new THREE.Vector3(), velocity: new THREE.Vector3(), forwardVector: new THREE.Vector3(), yAxisAngle: 0 , name: name};
        socket.emit('initGameState', { id: playerId, players: players, name: name });
        
        socket.broadcast.emit('new_player', { id: playerId, position: players[playerId].position, name: name });

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
}

const gravity = new THREE.Vector3(0, -9.8, 0);
const deltaTime = 1 / 128; // Tick rate
const damping = Math.exp(-4 * deltaTime) - 1;

export function updatePlayerPositions(io: Server) {
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
    const playersToSend: { [id: string]: { x: number, y: number, z: number } } = {};
    for (const playerId in players) {
        const player = players[playerId];
        playersToSend[playerId] = {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,
        };
    }

    io.emit('playersPositionUpdates', playersToSend);
}