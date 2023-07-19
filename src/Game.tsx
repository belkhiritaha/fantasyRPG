import React, { Component, RefObject } from "react";
import * as THREE from "three";
import Camera from "./Camera";
import Player from "./Player";
import Grass from "./Grass";
import Enemy from "./Enemy";

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
    public enemy = new Enemy({ scene: this.scene, position: new THREE.Vector3(0, 0, 0), player: this.player });

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


        document.body.appendChild(this.renderer.domElement);
    }

    loadModels() {
        this.scene.background = new THREE.CubeTextureLoader().load([
            "test_right.png", "test_left.png",
            "test_top.png", "test_bottom.png",
            "test_front.png", "test_back.png"
        ]);

        const loader = new GLTFLoader();

        const texture = new THREE.TextureLoader().load("knight_texture.png");

        loader.load(
            "Knight.glb",
            (gltf) => {
                console.log(gltf);
                gltf.scene.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.material = new THREE.MeshBasicMaterial({ map: texture });
                    }
                });
                gltf.scene.position.y = this.ground.position.y;
                gltf.scene.position.x = this.player.position.x;
                gltf.scene.position.z = this.player.position.z - 5;
                const mixer = new THREE.AnimationMixer(gltf.scene);
                const action = mixer.clipAction(gltf.animations[1]);
                action.timeScale = 3;
                console.log(action);
                action.play();
                this.animationMixers.push(mixer);
                this.scene.add(gltf.scene);
            }
        );

        this.grass = new Grass({ scene: this.scene, camera: this.camera.camera, renderer: this.renderer });
        this.grass.grassMesh.position.y = this.ground.position.y;
        this.grass.grassMesh.position.x = this.player.position.x;
        this.grass.grassMesh.position.z = this.player.position.z - 5;
        this.scene.add(this.grass.grassMesh);


    }

    controls = (deltaTime: number) => {
        const speedDelta = deltaTime * 10;
        if (this.keyStates['KeyW']) {
            this.player.velocity.add(this.player.getForwardVector().multiplyScalar(speedDelta));
        }
        if (this.keyStates['KeyS']) {
            this.player.velocity.add(this.player.getForwardVector().multiplyScalar(- speedDelta));
        }
        if (this.keyStates['KeyA']) {
            this.player.velocity.add(this.player.getSideVector().multiplyScalar(- speedDelta));
        }
        if (this.keyStates['KeyD']) {
            this.player.velocity.add(this.player.getSideVector().multiplyScalar(speedDelta));
        }
        if (this.keyStates['Space']) {
            this.player.velocity.y = 1;
        }
        if (this.keyStates['ShiftLeft']) {
            this.player.velocity.y = - 1;
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
        console.log(event);
    }

    startAnimationLoop() {
        const delaTime = Math.min(0.05, this.clock.getDelta()) / 5;

        for (let i = 0; i < 5; i++) {
            this.controls(delaTime);
            this.player.update(delaTime);
            this.enemy.update(delaTime);
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
