import { Server, Socket } from 'socket.io';
import * as THREE from 'three';
import messageModels from '../models/message.models';

interface Player {
    name: string;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    lookAt: THREE.Vector3;
    hp: number;
    height: number;
}

const groundPosY = -10;
const adjectives = ["Whimsical","Bubbly","Zany","Quirky","Wacky","Goofy","Cheeky","Kooky","Silly","Bouncy","Peculiar","Zesty","Fuzzy","Jovial","Jolly","Boisterous","Witty","Funky","Spiffy","Zippy"];
const animals = ["Penguin","Cheetah","Sloth","Kangaroo","Lemur","Hippo","Narwhal","Platypus","Chinchilla","Meerkat","Quokka","Raccoon","Alpaca","Hedgehog","Llama","Pufferfish","Axolotl","Capybara","Orangutan","Wombat"];

const players: { [id: string]: Player } = {};
const mobs: { [id: string]: Player } = {};

const firstMob : Player = {
    name: "Mob",
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    lookAt: new THREE.Vector3(0, 0, 0),
    hp: 100,
    height: 2,
}
// const mobHitBox = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), undefined);

mobs["1"] = firstMob;

export function initializeSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('New WebSocket connection');
        const playerId = socket.id;
        const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${animals[Math.floor(Math.random() * animals.length)]}`;
        players[playerId] = { position: new THREE.Vector3(), velocity: new THREE.Vector3(), lookAt: new THREE.Vector3(), name: name, hp: 100, height: 1 };
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
        });

        socket.on('rotation', (data: { lookAt: { x: number, y: number, z: number } }) => {
            players[playerId].lookAt = new THREE.Vector3(data.lookAt.x, data.lookAt.y, data.lookAt.z);
            const ray = new THREE.Raycaster(players[playerId].position, new THREE.Vector3(data.lookAt.x, data.lookAt.y, data.lookAt.z));

            socket.broadcast.emit('playerRotationUpdate', { id: playerId, lookAt: players[playerId].lookAt });
        });

        socket.on('attack', () => {
            const range = 2;
            const damage = 10;
            const player = players[playerId];
            const ray = new THREE.Raycaster(player.position, new THREE.Vector3().copy(player.lookAt).normalize());

            
            for (const mobId in mobs) {
                const mob = mobs[mobId];
                const hitMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), undefined);
                hitMesh.position.copy(mob.position);
                socket.emit("debug", { origin: player.position, direction: player.position.clone().add(player.lookAt.normalize().multiplyScalar(range)), mobPosition: mob.position, mobHitBoxPosition: hitMesh.position });
                hitMesh.position.y += mob.height / 2;
                const intersects = ray.intersectObject(hitMesh);
                console.log(intersects);
            }
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

export function updateMobPositions(io: Server) {
    // Adjust the movement speed factor as needed
    const movementSpeed = 0.1;

    // if there are no players, don't move the mob
    if (Object.keys(players).length === 0) {
        return;
    }

    // target the first player
    const target = players[Object.keys(players)[0]];

    // move the mob towards the player
    firstMob.velocity.addScaledVector(target.position.clone().sub(firstMob.position).normalize(), deltaTime * 4);

    // Apply gravity
    firstMob.velocity.addScaledVector(gravity, deltaTime);
    // Apply damping
    const deltaPosition = firstMob.velocity.clone().multiplyScalar(deltaTime * 10);
    firstMob.position.set(firstMob.position.x + deltaPosition.x, firstMob.position.y + deltaPosition.y, firstMob.position.z + deltaPosition.z);
    firstMob.velocity.addScaledVector(firstMob.velocity, damping);

    // mobHitBox.position.copy(firstMob.position);


    if (firstMob.position.y < groundPosY) {
        firstMob.position.y = groundPosY;
        firstMob.velocity.y = 0;
    }

    io.emit('mobPositionUpdate', { id: "1", position: firstMob.position });
}
