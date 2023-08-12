import React, { Component, RefObject } from "react";
import { useRef, createRef } from "react";
import * as THREE from "three";
import Camera from "./Camera";
import Player from "./Player";
import CurrentPlayerHandler from "./handlers/CurrentPlayerHandler";
import OtherPlayersHandler from "./handlers/OtherPlayersHandler";
import Grass from "./Grass";
import Enemy from "./Enemy";
import Mob from "./Mob";
import HitText from "./effects/HitText";
import WebSocketClass from "./WebSocket";

import ChatBox , { ChatBoxRef, ChatMessage } from "./HUD/ChatBox";
import HUD from "./HUD/HUD";
import Ground from "./world/Ground";

interface GameProps {
}

const debugLookAtLine = new THREE.Line3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));

export default class Game extends Component<GameProps> {
    public camera = new Camera({});
    public scene = new THREE.Scene();
    public renderer = new THREE.WebGLRenderer();
    public clock = new THREE.Clock();
    public keyStates: { [key: string]: boolean } = {};
    public requestID: number | null = null;
    public mount: RefObject<HTMLDivElement> = React.createRef();
    public mobs: { [id: string]: Mob } = {};

    public player = new Player({ camera: this.camera.camera, scene: this.scene });
    public animationMixers: THREE.AnimationMixer[] = [];
    public ground2 = new Ground({ scene: this.scene, setGameLoadingState: (isGameLoading: boolean) => { this.setState({ isGameLoading: isGameLoading }) } });
    // public grass = new Grass({ scene: this.scene, ground: this.ground2.mesh, dimensions: this.ground2.DIMENSIONS });
    state = {
        isTyping: false,
        playerName: "",
        isGameLoading: true
    };
    public chatBoxRef = createRef<ChatBoxRef>();
    // public mob = new Mob({ scene: this.scene, position: new THREE.Vector3(0, 0, 0) });
    public hitTextList: HitText[] = [];
    
    public currentPlayerHandler = new CurrentPlayerHandler({ camera: this.camera.camera, scene: this.scene, player: this.player });
    public otherPlayersHandler = new OtherPlayersHandler({ camera: this.camera.camera, scene: this.scene });
    public pointLight = new THREE.PointLight(0xffffff, 1);

    public webSocket = new WebSocketClass({ 
        player: this.player,
        scene: this.scene,
        otherPlayersHandler: this.otherPlayersHandler,
        chatBoxRef: this.chatBoxRef,
        setPlayerNameState: (playerName: string) => {
            this.setState({ playerName: playerName });
        },
        mobs: this.mobs,
        hitTextList: this.hitTextList
    });


    handleSocketSpecialEvents() {
        if (!this.webSocket.websocket) return;
        this.webSocket.initializeGameState();
        this.webSocket.newPlayerListener();
        this.webSocket.newMessageListener();
        this.webSocket.playersPositionUpdatesListener();
        this.webSocket.playerAttackListener();
        this.webSocket.playerRotationUpdateListener();
        this.webSocket.mobPositionUpdatesListener();
        this.webSocket.mobHitListener();
        // this.webSocket.listenDebug();
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
        window.addEventListener('mouseup', this.clickUpListener);
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
        this.clock = new THREE.Clock();

        // add lights
        const ambientLight = new THREE.AmbientLight(0x808080, 0.5);
        this.scene.add(ambientLight);
        
        this.pointLight.position.set(0, 10, 0);
        this.scene.add(this.pointLight);
                
        this.scene.add(this.camera.camera);

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
                this.webSocket.sendRotation({
                    lookAt: lookAt,
                });
            }
        }
    };

    clickDownListener = (event: MouseEvent) => {
        if (document.pointerLockElement !== document.body) {
            document.body.requestPointerLock();
        }
        this.player.weapon.shoot();

        this.webSocket.sendShoot();
    }

    clickUpListener = (event: MouseEvent) => {
        // if (document.pointerLockElement === document.body) {
        //     document.exitPointerLock();
        // }
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
        
        for (const id in this.mobs) {
            const mob = this.mobs[id];
            mob.character.update(delaTime);
        }

        this.pointLight.position.set(this.player.position.x, this.player.position.y + 1000 , this.player.position.z);
        
        this.player.weapon.bobbleWeapon(delaTime);
        for (const hitText of this.hitTextList) {
            if (!hitText) continue;
            hitText.update(delaTime);
            if (hitText.finished) {
                this.scene.remove(hitText.hitText);
                delete this.hitTextList[this.hitTextList.indexOf(hitText)];
            }
        }

        this.renderer.render(this.scene, this.camera.camera);
        this.ground2.grass?.animate(this.clock.getElapsedTime());
        // this.grass.updateGrids(this.player.position);
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
                <HUD isGameLoading={this.state.isGameLoading} currentHealth={this.player.hp} currentMana={100} />
                <ChatBox ref={this.chatBoxRef} playerName={this.state.playerName} />
                <div id="crosshair" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "2px", height: "2px", backgroundColor: "white" }}></div>
            </div>
        );
    }
}
