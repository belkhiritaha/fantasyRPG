import { Server, Socket } from 'socket.io';
import * as THREE from 'three';
import messageModels from '../models/message.models';

interface Player {
    name: string;
    velocity: THREE.Vector3;
    lookAt: THREE.Vector3;
    hp: number;
    height: number;
    hitBox: THREE.Mesh;
}

const groundPosY = -10;
const adjectives = ["Whimsical","Bubbly","Zany","Quirky","Wacky","Goofy","Cheeky","Kooky","Silly","Bouncy","Peculiar","Zesty","Fuzzy","Jovial","Jolly","Boisterous","Witty","Funky","Spiffy","Zippy"];
const animals = ["Penguin","Cheetah","Sloth","Kangaroo","Lemur","Hippo","Narwhal","Platypus","Chinchilla","Meerkat","Quokka","Raccoon","Alpaca","Hedgehog","Llama","Pufferfish","Axolotl","Capybara","Orangutan","Wombat"];

const players: { [id: string]: Player } = {};
const mobs: { [id: string]: Player } = {};

const firstMob : Player = {
    name: "Mob",
    velocity: new THREE.Vector3(0, 0, 0),
    lookAt: new THREE.Vector3(0, 0, 0),
    hp: 100,
    height: 2,
    hitBox: new THREE.Mesh(new THREE.BoxGeometry(5, 10, 5), new THREE.MeshBasicMaterial({ color: 0x00ff00 })),
}

// const mobHitBox = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), undefined);

mobs["1"] = firstMob;

export const scene = new THREE.Scene();
firstMob.hitBox.name = "hitBox";
firstMob.hitBox.position.set(0, 0, 0);
scene.add(firstMob.hitBox);

export function initializeSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('New WebSocket connection');
        const playerId = socket.id;
        const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${animals[Math.floor(Math.random() * animals.length)]}`;
        players[playerId] = { velocity: new THREE.Vector3(), lookAt: new THREE.Vector3(), name: name, hp: 100, height: 1, hitBox: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), undefined) };
        socket.emit('initGameState', { id: playerId, players: players, name: name });
        
        socket.broadcast.emit('new_player', { id: playerId, position: players[playerId].hitBox.position, name: name });

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
            const ray = new THREE.Raycaster(players[playerId].hitBox.position, new THREE.Vector3(data.lookAt.x, data.lookAt.y, data.lookAt.z));

            const hitBoxObject = scene.getObjectByName("hitBox");
                if (hitBoxObject) {
                    // console.log("hitBoxObject", hitBoxObject);
                    hitBoxObject.position.set(firstMob.hitBox.position.x, firstMob.hitBox.position.y, firstMob.hitBox.position.z);
                    // console.log("hitBoxObject position", hitBoxObject.position);
                }
            

            socket.broadcast.emit('playerRotationUpdate', { id: playerId, lookAt: players[playerId].lookAt });
        });

        socket.on('attack', () => {
            const range = 2;
            // const damage = 10;
            const player = players[playerId];
            const ray = new THREE.Raycaster(player.hitBox.position, player.lookAt.normalize());

            // console.log(scene.getObjectByName("hitBox")?.position);
            
            for (const mobId in mobs) {
                const mob = mobs[mobId];

                // console.log("ray position", ray.ray.origin);
                // console.log("ray direction", ray.ray.direction);


                // console.log("distance", player.position.distanceTo(mob.position));
                socket.emit("debug", { origin: player.hitBox.position, direction: player.hitBox.position.clone().add(player.lookAt.normalize().multiplyScalar(range)), mobPosition: mob.hitBox.position, mobHitBoxPosition: scene.getObjectByName("hitBox")?.position });
                // const intersects = ray.intersectObject(mob.hitBox);
                // console.log("intersects", intersects);
                // if (intersects[0]) console.log("intersection point", mob.hitBox.worldToLocal(intersects[0]?.point));
                // const hitBoxObject = scene.getObjectByName("hitBox");
                // if (hitBoxObject) {
                //     // console.log("hitBoxObject", hitBoxObject);
                //     hitBoxObject.position.set(firstMob.position.x, firstMob.position.y, firstMob.position.z);
                //     // console.log("hitBoxObject position", hitBoxObject.position);
                // }
                console.log(scene.children);

                console.log("Player is looking at", player.lookAt.normalize());
                const intersects = ray.intersectObjects(scene.children, true);
                console.log("intersects", intersects);  
                if (intersects[0]) {
                    console.log("intersection obbject position", intersects[0]?.object.position);

                    console.log("distance from mob to hitbox", mob.hitBox.position.distanceTo(scene.getObjectByName("hitBox")?.position ?? new THREE.Vector3()));
                }
                // console.log('mesh position', mob.hitBox.position);

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
        player.hitBox.position.add(deltaPosition);
        player.velocity.addScaledVector(player.velocity, damping);


        if (player.hitBox.position.y < groundPosY) {
            player.hitBox.position.y = groundPosY;
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
            x: player.hitBox.position.x,
            y: player.hitBox.position.y,
            z: player.hitBox.position.z,
        };
    }

    io.emit('playersPositionUpdates', playersToSend);
}

export function updateMobPositions(io: Server, scene: THREE.Scene) {
    // Adjust the movement speed factor as needed
    const movementSpeed = 0.1;

    // if there are no players, don't move the mob
    if (Object.keys(players).length === 0) {
        return;
    }

    // // target the first player
    const target = players[Object.keys(players)[0]];

    // move the mob towards the player
    firstMob.velocity.addScaledVector(target.hitBox.position.clone().sub(firstMob.hitBox.position).normalize(), deltaTime * 4);

    // Apply gravity
    firstMob.velocity.addScaledVector(gravity, deltaTime);
    // Apply damping
    const deltaPosition = firstMob.velocity.clone().multiplyScalar(deltaTime * 10);
    firstMob.hitBox.position.set(firstMob.hitBox.position.x + deltaPosition.x, firstMob.hitBox.position.y + deltaPosition.y, firstMob.hitBox.position.z + deltaPosition.z);
    firstMob.hitBox.updateMatrixWorld();
    firstMob.velocity.addScaledVector(firstMob.velocity, damping);


    // scene.hitBox.position.set(firstMob.position.x, firstMob.position.y + 5, firstMob.position.z);
    const hitBoxObject = scene.getObjectByName("hitBox");
    if (hitBoxObject) {
        // console.log("hitBoxObject", hitBoxObject);
        hitBoxObject.position.set(firstMob.hitBox.position.x, firstMob.hitBox.position.y, firstMob.hitBox.position.z);
        // console.log("hitBoxObject position", hitBoxObject.position);
    }
    // io.emit("debug", { origin: new THREE.Vector3(), direction: new THREE.Vector3(), mobPosition: firstMob.position, mobHitBoxPosition: scene.getObjectByName("hitBox")?.position });


    // mobHitBox.position.copy(firstMob.position);


    if (firstMob.hitBox.position.y < groundPosY) {
        firstMob.hitBox.position.y = groundPosY;
        firstMob.velocity.y = 0;
    }

    io.emit('mobPositionUpdate', { id: "1", position: firstMob.hitBox.position });
}
