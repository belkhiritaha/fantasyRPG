import React, { Component, RefObject } from "react";
import { useRef, createRef } from "react";
import * as THREE from "three";
import Camera from "./Camera";
import Player from "./Player";
import CurrentPlayerHandler from "./handlers/CurrentPlayerHandler";
import OtherPlayersHandler from "./handlers/OtherPlayersHandler";
import Grass from "./Grass";
import Enemy from "./Enemy";
import WebSocketClass from "./WebSocket";

import ChatBox , { ChatBoxRef, ChatMessage } from "./HUD/ChatBox";

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
        new THREE.MeshBasicMaterial({ color: "rgb(95, 171, 91)" })
        );
    public player = new Player({ camera: this.camera.camera, scene: this.scene });
    public animationMixers: THREE.AnimationMixer[] = [];
    public grass = new Grass({ scene: this.scene, camera: this.camera.camera, renderer: this.renderer });
    state = {
        isTyping: false,
        playerName: ""
    };
    public chatBoxRef = createRef<ChatBoxRef>();
    
    public currentPlayerHandler = new CurrentPlayerHandler({ camera: this.camera.camera, scene: this.scene, player: this.player });
    public otherPlayersHandler = new OtherPlayersHandler({ camera: this.camera.camera, scene: this.scene });

    public webSocket = new WebSocketClass({ 
        player: this.player,
        scene: this.scene,
        otherPlayersHandler: this.otherPlayersHandler,
        chatBoxRef: this.chatBoxRef,
        setPlayerNameState: (playerName: string) => {
            this.setState({ playerName: playerName });
        }
    });

    handleSocketSpecialEvents() {
        if (!this.webSocket.websocket) return;
        this.webSocket.initializeGameState();
        this.webSocket.newPlayerListener();
        this.webSocket.newMessageListener();
        this.webSocket.playersPositionUpdatesListener();
        this.webSocket.playerRotationUpdateListener();
        this.webSocket.disconnected();
    }

    componentDidMount() {
        this.sceneSetup();
        this.startAnimationLoop();
        this.loadModels();
        console.log(this.camera.camera);
        console.log(this.chatBoxRef);
        window.addEventListener('mousemove', this.mouseMoveListener);
        window.addEventListener('mousedown', this.clickDownListener);
        // window.addEventListener('mouseup', this.clickUpListener);
        window.addEventListener('keydown', this.keyDownListener);
        window.addEventListener('keyup', this.keyUpListener);
        // resize listener
        window.addEventListener('resize', this.handleWindowResize);
    }


    handleWindowResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        this.camera.camera.aspect = width / height;
        this.camera.camera.updateProjectionMatrix();
    };

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
        // if some key is pressed
        if (Object.values(this.keyStates).some((value) => value)) {
            const forwardVector = this.player.getForwardVector();
            const sideVector = this.player.getSideVector();
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

                const lookAt = new THREE.Vector3(0, 0, -1);
                lookAt.applyQuaternion(this.camera.camera.quaternion);
                const yAxisAngle = Math.atan2(lookAt.x, lookAt.z);
                // console.log("lookAt:", lookAt);
                this.webSocket.sendRotation({
                    yAxisAngle: yAxisAngle
                });
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
        }

        // update all other players
        for (const id in this.otherPlayersHandler.otherPlayers) {
            this.otherPlayersHandler.otherPlayers[id].update(delaTime);
        }

        this.renderer.render(this.scene, this.camera.camera);
        this.grass.animate(this.clock.getElapsedTime());
        this.requestID = window.requestAnimationFrame(this.startAnimationLoop.bind(this));

        for (const mixer of this.animationMixers) {
            mixer.update(delaTime);
        }
    }

    keyDownListener = (event: KeyboardEvent) => {
        // if pointer is locked
        if (document.pointerLockElement === document.body) {
            // if element with id message-input is not focused
            if (document.activeElement?.id !== "message-input") {
                this.keyStates[event.code] = true;
            }
        }
    }

    keyUpListener = (event: KeyboardEvent) => {
        this.keyStates[event.code] = false;
    }


    render() {
        return (
            <div ref={this.mount}>
                <ChatBox ref={this.chatBoxRef} playerName={this.state.playerName} />
            </div>
        );
    }
}
