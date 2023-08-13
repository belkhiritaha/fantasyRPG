import { Server, Socket } from 'socket.io';
import * as THREE from 'three';
import messageModels from '../models/message.models.js';
import { ground } from '../api.js';

interface Player {
    name: string;
    velocity: THREE.Vector3;
    lookAt: THREE.Vector3;
    hp: number;
    height: number;
    hitBox: THREE.Mesh;
    isMoving: boolean;
    isJumping: boolean;
    attackCooldown: number;
    classType: string;
}

const adjectives = ["Whimsical","Bubbly","Zany","Quirky","Wacky","Goofy","Cheeky","Kooky","Silly","Bouncy","Peculiar","Zesty","Fuzzy","Jovial","Jolly","Boisterous","Witty","Funky","Spiffy","Zippy"];
const animals = ["Penguin","Cheetah","Sloth","Kangaroo","Lemur","Hippo","Narwhal","Platypus","Chinchilla","Meerkat","Quokka","Raccoon","Alpaca","Hedgehog","Llama","Pufferfish","Axolotl","Capybara","Orangutan","Wombat"];

const players: { [id: string]: Player } = {};
const mobs: { [id: string]: Player } = {};


export const scene = new THREE.Scene();

export function initializeSocket(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log('New WebSocket connection');
        const playerId = socket.id;

        socket.on('connectPlayer', (data: { name: string, classType: string }) => {
            players[playerId] = {
                velocity: new THREE.Vector3(),
                lookAt: new THREE.Vector3(),
                name: data.name,
                hp: 100,
                height: 1,
                hitBox: new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), undefined),
                isMoving: false,
                isJumping: false,
                attackCooldown: data.classType === "warrior" ? 0.5 : 1,
                classType: data.classType,
            };

            players[playerId].hitBox.position.set(1, 20, 2);
            socket.emit('initGameState', { id: playerId, players: players, name: data.name, mobs: mobs });
            
            socket.broadcast.emit('new_player', { id: playerId, position: players[playerId].hitBox.position, name: data.name, classType: data.classType });
        });

        socket.on('movement', (data: { forwardVector: { x: number, y: number, z: number }, sideVector: { x: number, y: number, z: number }, deltaTime: number, keyStates: { [key: string]: boolean } }) => {
            const forwardVector = new THREE.Vector3(data.forwardVector.x, data.forwardVector.y, data.forwardVector.z);
            const sideVector = new THREE.Vector3(data.sideVector.x, data.sideVector.y, data.sideVector.z);
            const movementSpeed = 8;
            const jumpSpeed = 3;
            if (data.keyStates['KeyW']) {
                players[playerId].velocity.add(forwardVector.multiplyScalar(data.deltaTime * movementSpeed));
            }
            if (data.keyStates['KeyS']) {
                players[playerId].velocity.add(forwardVector.multiplyScalar(-data.deltaTime * movementSpeed));
            }
            if (data.keyStates['KeyA']) {
                players[playerId].velocity.add(sideVector.multiplyScalar(-data.deltaTime * movementSpeed));
            }
            if (data.keyStates['KeyD']) {
                players[playerId].velocity.add(sideVector.multiplyScalar(data.deltaTime * movementSpeed));
            }
            if (data.keyStates['Space']) {
                const player = players[playerId];
                if (!player.isJumping) {
                    player.velocity.y = jumpSpeed;
                    player.isJumping = true;
                }
            }
            // if (data.keyStates['ShiftLeft']) {
            //     players[playerId].velocity.y = -1;
            // }
        });

        socket.on('rotation', (data: { lookAt: { x: number, y: number, z: number } }) => {
            players[playerId].lookAt = new THREE.Vector3(data.lookAt.x, data.lookAt.y, data.lookAt.z);
            socket.broadcast.emit('playerRotationUpdate', { id: playerId, lookAt: players[playerId].lookAt });
        });

        socket.on('attack', () => {
            const player = players[playerId];
            const damage = player.classType === "warrior" ? 10 : 5;
            const range = player.classType === "warrior" ? 5 : 10;
            const ray = new THREE.Raycaster(player.hitBox.position, player.lookAt.normalize(), 0, range);
            
            console.log("player.attackCooldown", player.attackCooldown);
            if (player.attackCooldown > 0) {
                return;
            }
            socket.broadcast.emit('playerAttack', { id: playerId });
            for (const mobId in mobs) {
                const mob = mobs[mobId];
                console.log(mob.hitBox.position);
                
                const intersects = ray.intersectObject(mob.hitBox);
                if (intersects[0]) {
                    console.log("hit");
                    mob.hp -= damage;
                    console.log(mob.hp);
                    io.emit('mobHit', { id: mobId, dmg: damage });
                    player.attackCooldown = player.classType === "warrior" ? 0.5 : 1;
                    if (mob.hp <= 0) {
                        delete mobs[mobId];
                        io.emit('mobDeath', { id: mobId });
                    }
                }
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
    const movementSpeed = 10;

    for (const playerId in players) {
        const player = players[playerId];
        // update attack cooldown
        if (player.attackCooldown > 0) {
            player.attackCooldown -= deltaTime;
            if (player.attackCooldown < 0) {
                player.attackCooldown = 0;
            }
        }
        // Apply gravity
        player.velocity.addScaledVector(gravity, deltaTime);
        // Apply damping
        const deltaPosition = player.velocity.clone().multiplyScalar(deltaTime * movementSpeed);
        player.hitBox.position.add(deltaPosition);
        player.velocity.addScaledVector(player.velocity, damping);

        let groundPosY = 0;
        const ray = new THREE.Raycaster(new THREE.Vector3(player.hitBox.position.x, player.hitBox.position.z, 100), new THREE.Vector3(0, 0, -1));
        const intersects = ray.intersectObject(ground);
        if (intersects[0]) {
            groundPosY = intersects[0].point.z;
            if (player.hitBox.position.y - player.height < groundPosY) {
                player.hitBox.position.y = groundPosY + player.height;
                player.velocity.y = 0;
                player.isJumping = false;
            }
        }
    }

    const playersToSend: { [id: string]: { position: THREE.Vector3, velocity: THREE.Vector3 } } = {};
    for (const playerId in players) {
        const player = players[playerId];
        // playersToSend[playerId] = {
        //     x: player.hitBox.position.x,
        //     y: player.hitBox.position.y,
        //     z: player.hitBox.position.z,
        // };
        playersToSend[playerId] = {
            position: player.hitBox.position,
            velocity: player.velocity,
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

    // // target first player
    const target = players[Object.keys(players)[0]];

    for (const mobId in mobs) {
        const mob = mobs[mobId];
        // move the mob towards the player
        mob.velocity.addScaledVector(target.hitBox.position.clone().sub(mob.hitBox.position).normalize(), deltaTime * 4);
        // rotate the mob towards the player
        mob.hitBox.lookAt(target.hitBox.position);

        // Apply gravity
        mob.velocity.addScaledVector(gravity, deltaTime);
        // Apply damping
        const deltaPosition = mob.velocity.clone().multiplyScalar(deltaTime * 10);
        mob.hitBox.position.set(mob.hitBox.position.x + deltaPosition.x, mob.hitBox.position.y + deltaPosition.y, mob.hitBox.position.z + deltaPosition.z);
        mob.hitBox.updateMatrixWorld();
        mob.velocity.addScaledVector(mob.velocity, damping);

        // dont intersect with other mobs
        for (const mobId2 in mobs) {
            if (mobId === mobId2) {
                continue;
            }
            const mob2 = mobs[mobId2];
            if (mob.hitBox.position.distanceTo(mob2.hitBox.position) < 10) {
                mob.velocity.addScaledVector(mob.hitBox.position.clone().sub(mob2.hitBox.position).normalize(), deltaTime * 4);
            }
        }

        
        let groundPosY = 0;
            const ray = new THREE.Raycaster(new THREE.Vector3(mob.hitBox.position.x, mob.hitBox.position.z, 100), new THREE.Vector3(0, 0, -1));
            const intersects = ray.intersectObject(ground);
            if (intersects[0]) {
                groundPosY = intersects[0].point.z;
                if (mob.hitBox.position.y < groundPosY) {
                    mob.hitBox.position.y = groundPosY;
                    mob.velocity.y = 0;
                    mob.isJumping = false;
                }
            }
        
        if (mob.hitBox.position.distanceTo(target.hitBox.position) < 4) {
            mob.velocity.multiplyScalar(0);
        }

        // if mob is moving, update the position
        if (mob.velocity.length() > 0) {
            io.emit('mobPositionUpdate', { id: mobId, position: mob.hitBox.position, lookAt: mob.hitBox.getWorldDirection(new THREE.Vector3()) });
        }
    }
}

export function manageMobList(io: Server) {
    // if there are no players, don't move the mob
    if (Object.keys(players).length === 0) {
        return;
    }

    // if there are less than 2 mobs, add a new one
    if (Object.keys(mobs).length < 2) {
        const newMob : Player = {
            name: "Mob",
            velocity: new THREE.Vector3(0, 0, 0),
            lookAt: new THREE.Vector3(0, 0, 0),
            hp: 100,
            height: 2,
            hitBox: new THREE.Mesh(new THREE.BoxGeometry(5, 10, 5), new THREE.MeshBasicMaterial({ color: 0x00ff00 })),
            isMoving: false,
            isJumping: false,
            attackCooldown: 0,
            classType: "mob",
        }
        newMob.hitBox.position.set(Math.random() * 100, Math.random() * 100, 20);
        const mobKey = Math.random().toString();
        mobs[mobKey] = newMob;
        io.emit('newMob', { id: mobKey, position: newMob.hitBox.position });
    }
}