import { Component } from "react";
import { io, Socket } from "socket.io-client";
import * as THREE from "three";
import Player from "./Player";
import Enemy from "./Enemy";

interface WebSocketProps {
    scene: THREE.Scene;
    player: Player;
    addPlayer: (id: string, position: THREE.Vector3) => void;
    removePlayer: (id: string) => void;
}


class WebSocketClass extends Component<WebSocketProps> {
    public websocket: Socket | null;
    private url = import.meta.env.ENV === 'prod' ? import.meta.env.PROD_WS_URL : import.meta.env.DEV_WS_URL;
    public id: string;

    constructor(props: WebSocketProps) {
        super(props);
        this.websocket = null;
    }

    connect(): void {
        if (this.websocket) {
            console.warn("WebSocket is already connected.");
            return;
        }

        this.websocket = io(this.url ?? "");

        console.log(this.websocket)

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
