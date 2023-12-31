import { Component } from "react";
import { io, Socket } from "socket.io-client";
import * as THREE from "three";
import Player from "./Player";
import Mob from "./Mob";
import OtherPlayersHandler from "./handlers/OtherPlayersHandler";
import Enemy from "./Enemy";
import HitText from "./effects/HitText";

interface WebSocketProps {
    scene: THREE.Scene;
    player: Player;
    setPlayerNameState: (playerName: string) => void;
    otherPlayersHandler: OtherPlayersHandler;
    chatBoxRef: React.RefObject<any>;
    mobs: { [id: string]: Mob };
    hitTextList: HitText[];
}

interface ServerMobData {
    name: string;
    position: THREE.Vector3;
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


class WebSocketClass extends Component<WebSocketProps> {
    public websocket: Socket | null;
    private url = import.meta.env.VITE_ENV === 'prod' ? import.meta.env.VITE_PROD_WS_URL : import.meta.env.VITE_DEV_WS_URL;
    public id: string;

    constructor(props: WebSocketProps) {
        super(props);
        this.websocket = null;
    }

    initializeGameState(): void {
        if (!this.websocket) return;
        this.websocket.on("initGameState", (data: { id: string, players: { [id: string]: ServerMobData }, name: string, mobs: { [id: string]: ServerMobData } }) => {
            console.log("Init game state:", data);
            this.id = data.id;
            for (const id in data.players) {
                if (id === data.id) {
                    this.props.player.name = data.name;
                    this.props.setPlayerNameState(data.name);
                    console.log("Player name:", this.props.player.name);
                    continue;
                }
                this.props.otherPlayersHandler.addPlayer(id, new THREE.Vector3(data.players[id].position.x, data.players[id].position.y, data.players[id].position.z), data.players[id].classType, data.players[id].hp);
            }
            for (const id in data.mobs) {
                const mob = new Mob({ position: new THREE.Vector3(data.mobs[id].position.x, data.mobs[id].position.y, data.mobs[id].position.z), scene: this.props.scene, hp: data.mobs[id].hp });
                mob.name = data.mobs[id].name;
                mob.velocity = new THREE.Vector3(data.mobs[id].velocity.x, data.mobs[id].velocity.y, data.mobs[id].velocity.z);
                mob.height = data.mobs[id].height;
                // add mob to mobs list
                this.props.mobs[id] = mob;
                this.props.scene.add(mob.character.gltf);
            }
        });
    }

    newPlayerListener(): void {
        if (!this.websocket) return;
        this.websocket.on("new_player", (data: { id: string, player: ServerMobData }) => {
            console.log("New player:", data);
            this.props.otherPlayersHandler.addPlayer(data.id, new THREE.Vector3(data.player.position.x, data.player.position.y, data.player.position.z), data.player.classType, data.player.hp);
        });
    }

    newMessageListener(): void {
        if (!this.websocket) return;
        this.websocket.on("new_message", (data: { id: string, message: string }) => {
            console.log("New message:", data);
            this.props.chatBoxRef.current?.addMessage(data);
        });
    }

    playersPositionUpdatesListener(): void {
        if (!this.websocket) return;
        this.websocket.on("playersPositionUpdates", (data: { [id: string]: { position: THREE.Vector3, velocity: THREE.Vector3 } }) => {
            for (const id in data) {
                if (id === this.id) {
                    this.props.player.setPosition(new THREE.Vector3(data[id].position.x, data[id].position.y, data[id].position.z));
                    this.props.player.setVelocity(new THREE.Vector3(data[id].velocity.x, data[id].velocity.y, data[id].velocity.z));
                }
                if (this.props.otherPlayersHandler.otherPlayers[id]) {
                    this.props.otherPlayersHandler.otherPlayers[id].setPosition(new THREE.Vector3(data[id].position.x, data[id].position.y, data[id].position.z));
                    this.props.otherPlayersHandler.otherPlayers[id].setVelocity(new THREE.Vector3(data[id].velocity.x, data[id].velocity.y, data[id].velocity.z));
                }
            }
        });
    }

    playerAttackListener(): void {
        if (!this.websocket) return;
        this.websocket.on("playerAttack", (data: { id: string }) => {
            console.log("Player attack:", data);
            // play attack animation for other players
            if (this.props.otherPlayersHandler.otherPlayers[data.id]) {
                this.props.otherPlayersHandler.otherPlayers[data.id].character.playAttackAnimation();
            }
        });
    }

    mobPositionUpdatesListener(): void {
        if (!this.websocket) return;
        this.websocket.on("mobPositionUpdate", (data: { id: string, position: { x: number, y: number, z: number }, lookAt: { x: number, y: number, z: number } }) => {
            const mob = this.props.mobs[data.id];
            mob.setPosition(new THREE.Vector3(data.position.x, data.position.y, data.position.z));
            const yAxisAngle = Math.atan2(data.lookAt.x, data.lookAt.z);
            const xAxisAngle = Math.atan2(- data.lookAt.y, Math.sqrt(data.lookAt.x ** 2 + data.lookAt.z ** 2));
            mob.character.setYAxisAngle(yAxisAngle);
            mob.character.setXAxisAngle(xAxisAngle);
        });
    }

    playerRotationUpdateListener(): void {
        if (!this.websocket) return;
        this.websocket.on("playerRotationUpdate", (data: { id: string, lookAt: { x: number, y: number, z: number } }) => {
            const yAxisAngle = Math.atan2(data.lookAt.x, data.lookAt.z);
            // const xAxisAngle = Math.atan2(data.lookAt.y, data.lookAt.z);
            // project lookAt vector to get x axis angle
            const xAxisAngle = Math.atan2(- data.lookAt.y, Math.sqrt(data.lookAt.x ** 2 + data.lookAt.z ** 2));
            if (this.props.otherPlayersHandler.otherPlayers[data.id]) {
                this.props.otherPlayersHandler.otherPlayers[data.id].character.setYAxisAngle(yAxisAngle);
                this.props.otherPlayersHandler.otherPlayers[data.id].character.setXAxisAngle(xAxisAngle);
            }
        });
    }

    newMobListener(): void {
        if (!this.websocket) return;
        this.websocket.on("newMob", (data: { id: string, name: string, position: { x: number, y: number, z: number } }) => {
            const mob = new Mob({ position: new THREE.Vector3(data.position.x, data.position.y, data.position.z), scene: this.props.scene, hp: 100 });
            mob.name = data.name;
            // add mob to mobs list
            this.props.mobs[data.id] = mob;
        });
    }


    mobHitListener(): void {
        if (!this.websocket) return;
        this.websocket.on("mobHit", (data: { id: string, dmg: number }) => {
            console.log("Mob hit:", data);
            const mob = this.props.mobs[data.id];
            const popUpX = mob.position.x + Math.random() * 4 - 1;
            const popUpY = mob.position.y + mob.height + Math.random() * 2 - 1;
            const popUpZ = mob.position.z + Math.random() * 4 - 1;
            const hitText = new HitText({ position: new THREE.Vector3(popUpX, popUpY, popUpZ), scene: this.props.scene });
            this.props.hitTextList.push(hitText);
            mob.takeDamage(data.dmg);
        });
    }

    mobDeathListener(): void {
        if (!this.websocket) return;
        this.websocket.on("mobDeath", (data: { id: string }) => {
            console.log("Mob death:", data);
            const mob = this.props.mobs[data.id];
            mob.removeFromScene();
            delete this.props.mobs[data.id];
        });
    }

    sendShoot(): void {
        if (!this.websocket) return;
        this.websocket.emit("attack");
    }

    hitRegisteredListener(): void {
        if (!this.websocket) return;
        this.websocket.on("hitRegistered", () => {
            console.log("Hit registered");
            this.props.player.weapon.release();
            this.props.player.attackCooldown = this.props.player.weapon.attackCooldown;
        });
    }


    disconnected(): void {
        if (!this.websocket) return;
        this.websocket.on("disconnected", (data: string) => {
            console.log("Disconnected:", data);
            if (data === this.id) {
                return;
            }
            this.props.otherPlayersHandler.removePlayer(data);
        });
    }

    connect(): void {
        if (this.websocket) {
            console.warn("WebSocket is already connected.");
            return;
        }

        this.websocket = io(this.url ?? "");

        console.log(this.websocket)
        console.log(this.url)

        //send player name to server
        this.websocket.emit("connectPlayer", { name: this.props.player.name, classType: this.props.player.classType });
    }

    sendMovementDirection(data: { forwardVector: { x: number, y: number, z: number }, sideVector: { x: number, y: number, z: number }, deltaTime: number, keyStates: { [key: string]: boolean } }): void {
        if (!this.websocket) return;
        this.websocket.emit('movement', data);
    }

    sendRotation(data: { lookAt: { x: number, y: number, z: number } }): void {
        if (!this.websocket) return;
        this.websocket.emit('rotation', data);
    }

    close(): void {
        if (!this.websocket) {
            console.warn("WebSocket is not connected. Cannot close.");
            return;
        }

        this.websocket.close();
    }
}

export default WebSocketClass;
