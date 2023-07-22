import { Component } from "react";
import { io, Socket } from "socket.io-client";
import * as THREE from "three";
import Player from "./Player";
import OtherPlayersHandler from "./handlers/OtherPlayersHandler";

interface WebSocketProps {
    scene: THREE.Scene;
    player: Player;
    setPlayerNameState: (playerName: string) => void;
    otherPlayersHandler: OtherPlayersHandler;
    chatBoxRef: React.RefObject<any>;
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
        this.websocket.on("initGameState", (data: { id: string, players: { [id: string]: { x: number, y: number, z: number } }, name: string }) => {
            console.log("Init game state:", data);
            this.id = data.id;
            for (const id in data.players) {
                if (id === data.id) {
                    this.props.player.name = data.name;
                    this.props.setPlayerNameState(data.name);
                    console.log("Player name:", this.props.player.name);
                    continue;
                }
                this.props.otherPlayersHandler.addPlayer(id, new THREE.Vector3(data.players[id].x, data.players[id].y, data.players[id].z));
            }
        });
    }

    newPlayerListener(): void {
        if (!this.websocket) return;
        this.websocket.on("new_player", (data: { id: string, position: { x: number, y: number, z: number }, name: string }) => {
            console.log("New player:", data);
            this.props.otherPlayersHandler.addPlayer(data.id, new THREE.Vector3(data.position.x, data.position.y, data.position.z));
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
        this.websocket.on("playersPositionUpdates", (data: { [id: string]: { x: number, y: number, z: number } }) => {
            for (const id in data) {
                if (id === this.id) {
                    this.props.player.setPosition(new THREE.Vector3(data[id].x, data[id].y, data[id].z));
                }
                if (this.props.otherPlayersHandler.otherPlayers[id]) {
                    this.props.otherPlayersHandler.otherPlayers[id].setPosition(new THREE.Vector3(data[id].x, data[id].y, data[id].z));
                }
            }
        });
    }

    playerRotationUpdateListener(): void {
        if (!this.websocket) return;
        this.websocket.on("playerRotationUpdate", (data: { id: string, yAxisAngle: number }) => {
            if (this.props.otherPlayersHandler.otherPlayers[data.id]) {
                this.props.otherPlayersHandler.otherPlayers[data.id].setYAxisAngle(data.yAxisAngle);
            }
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

    }

    sendMovementDirection(data: { forwardVector: { x: number, y: number, z: number }, sideVector: { x: number, y: number, z: number }, deltaTime: number, keyStates: { [key: string]: boolean } }): void {
        if (!this.websocket) return;
        this.websocket.emit('movement', data);
    }

    sendRotation(data: { yAxisAngle: number }): void {
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
