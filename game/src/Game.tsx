import React, { Component, RefObject } from "react";
import * as THREE from "three";
import Camera from "./Camera";
import Player from "./Player";
import Grass from "./Grass";
import Enemy from "./Enemy";
import WebSocketClass from "./WebSocket";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";


interface GameProps {
}

export default class Game extends Component<GameProps> {
    public camera = new Camera({});
    public scene = new THREE.Scene();
    public renderer = new THREE.WebGLRenderer();
    public clock = new THREE.Clock();
    public keyStates: { [key: string]: boolean } = {};
    public requestID: number | null = null;
    public mount: RefObject<HTMLDivElement> = React.createRef();
    public ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 50, 50),
        new THREE.MeshBasicMaterial({ color: "rgb(104,255,127)" })
        );
    public player = new Player({ camera: this.camera.camera, scene: this.scene });
    public animationMixers: THREE.AnimationMixer[] = [];
    public grass = new Grass({ scene: this.scene, camera: this.camera.camera, renderer: this.renderer });
    public webSocket = new WebSocketClass({ 
        player: this.player,
        scene: this.scene,
        addPlayer: this.addPlayer.bind(this),
        removePlayer: this.removePlayer.bind(this)
    });
    
    public otherPlayers: { [id: string]: Enemy } = {};

    addPlayer(id: string, position: THREE.Vector3) {
        this.otherPlayers[id] = new Enemy({ scene: this.scene, position: position });
        this.scene.add(this.otherPlayers[id].character.gltf);
    }

    removePlayer(id: string) {
        this.scene.remove(this.otherPlayers[id].character.gltf);
        delete this.otherPlayers[id];
    }

    handleSocketSpecialEvents() {
        if (!this.webSocket.websocket) return;
        this.webSocket.websocket.on("initGameState", (data: { id: string, players: { [id: string]: { x: number, y: number, z: number } } }) => {
            console.log("Init game state:", data);
            this.webSocket.id = data.id;
            for (const id in data.players) {
                if (id === data.id) {
                    continue;
                }
                this.addPlayer(id, new THREE.Vector3(data.players[id].x, data.players[id].y, data.players[id].z));
            }
        });

        this.webSocket.websocket.on("new_player", (data: { id: string, position: { x: number, y: number, z: number } }) => {
            console.log("New player:", data);
            this.addPlayer(data.id, new THREE.Vector3(data.position.x, data.position.y, data.position.z));
        });

        this.webSocket.websocket.on("playersPositionUpdates", (data: { [id: string]: { x: number, y: number, z: number } }) => {
            for (const id in data) {
                if (id === this.webSocket.id) {
                    this.player.setPosition(new THREE.Vector3(data[id].x, data[id].y, data[id].z));
                }
                if (this.otherPlayers[id]) {
                    this.otherPlayers[id].character.gltf.position.x = data[id].x;
                    this.otherPlayers[id].character.gltf.position.y = data[id].y;
                    this.otherPlayers[id].character.gltf.position.z = data[id].z;
                }
            }
        });

        this.webSocket.websocket.on("disconnected", (data: { id: string }) => {
            console.log("Disconnected:", data);
            this.removePlayer(data.id);
        });
    }

    componentDidMount() {
        this.sceneSetup();
        this.startAnimationLoop();
        this.loadModels();
        console.log(this.camera.camera);
        window.addEventListener('mousemove', this.mouseMoveListener);
        window.addEventListener('mousedown', this.clickDownListener);
        // window.addEventListener('mouseup', this.clickUpListener);
        window.addEventListener('keydown', this.keyDownListener);
        window.addEventListener('keyup', this.keyUpListener);
    }

    sceneSetup() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.ground.rotation.x = - Math.PI / 2;
        this.ground.position.y = -10;

        this.ground.name = "ground";
        this.scene.add(this.ground);
        this.grass.grassMesh.position.y = this.ground.position.y;
        this.scene.add(this.grass.grassMesh);
        console.log(this.scene);
        this.clock = new THREE.Clock();

        this.webSocket.connect();
        this.handleSocketSpecialEvents();
        // this.webSocket.send("Hello World!");

        document.body.appendChild(this.renderer.domElement);
    }

    loadModels() {
        this.scene.background = new THREE.CubeTextureLoader().load([
            "test_right.png", "test_left.png",
            "test_top.png", "test_bottom.png",
            "test_front.png", "test_back.png"
        ]);

        this.grass = new Grass({ scene: this.scene, camera: this.camera.camera, renderer: this.renderer });
        this.grass.grassMesh.position.y = this.ground.position.y;
        this.grass.grassMesh.position.x = this.player.position.x;
        this.grass.grassMesh.position.z = this.player.position.z - 5;
        this.scene.add(this.grass.grassMesh);
    }

    controls = (deltaTime: number) => {
        const speedDelta = deltaTime * 10;
        // if (this.keyStates['KeyW']) {
        //     this.player.velocity.add(this.player.getForwardVector().multiplyScalar(speedDelta));
        // }
        // if (this.keyStates['KeyS']) {
        //     this.player.velocity.add(this.player.getForwardVector().multiplyScalar(- speedDelta));
        // }
        // if (this.keyStates['KeyA']) {
        //     this.player.velocity.add(this.player.getSideVector().multiplyScalar(- speedDelta));
        // }
        // if (this.keyStates['KeyD']) {
        //     this.player.velocity.add(this.player.getSideVector().multiplyScalar(speedDelta));
        // }
        // if (this.keyStates['Space']) {
        //     this.player.velocity.y = 1;
        // }
        // if (this.keyStates['ShiftLeft']) {
        //     this.player.velocity.y = - 1;
        // }
        // if some key is pressed
        if (Object.values(this.keyStates).some((value) => value)) {
            const forwardVector = this.player.getForwardVector();
            const sideVector = this.player.getSideVector();
            console.log(forwardVector, sideVector);
            this.webSocket.sendMovementDirection({
                forwardVector: forwardVector,
                sideVector: sideVector,
                deltaTime: deltaTime,
                keyStates: this.keyStates
            });
        }
    }

    mouseMoveListener = (event: MouseEvent) => {
        if (document.pointerLockElement === document.body) {
            if (this.camera.camera) {
                this.camera.camera.rotation.y -= event.movementX / 500;
                this.camera.camera.rotation.x -= event.movementY / 500;
            }
        }
    };

    clickDownListener = (event: MouseEvent) => {
        if (document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
        }
    }

    startAnimationLoop() {
        const delaTime = Math.min(0.05, this.clock.getDelta()) / 5;

        for (let i = 0; i < 5; i++) {
            this.controls(delaTime);
            this.player.update(delaTime);
        }

        // update all other players
        for (const id in this.otherPlayers) {
            this.otherPlayers[id].update(delaTime);
        }

        this.renderer.render(this.scene, this.camera.camera);
        this.grass.animate(this.clock.getElapsedTime());
        this.requestID = window.requestAnimationFrame(this.startAnimationLoop.bind(this));

        for (const mixer of this.animationMixers) {
            mixer.update(delaTime);
        }
    }

    keyDownListener = (event: KeyboardEvent) => {
        this.keyStates[event.code] = true;
    }

    keyUpListener = (event: KeyboardEvent) => {
        this.keyStates[event.code] = false;
    }


    render() {
        return (
            <div ref={this.mount} />
        );
    }
}