import { Component } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

interface CharacterProps {
    position: THREE.Vector3;
    scene: THREE.Scene;
    modelPath: string;
}

export default class Character extends Component<CharacterProps> {
    public gltf: THREE.Group;
    public mixer: THREE.AnimationMixer;

    public hp = 100;
    
    public runAction: THREE.AnimationAction;
    public idleAction: THREE.AnimationAction;
    public attackAction: THREE.AnimationAction;

    public activeAction: THREE.AnimationAction;
    public lastAction: THREE.AnimationAction;


    constructor(props: CharacterProps) {
        super(props);
        const loader = new GLTFLoader();

        // const texture = new THREE.TextureLoader().load("knight_texture.png");

        loader.load(
            props.modelPath,
            (gltf) => {
                // gltf.scene.scale.set(2, 2, 2);
                gltf.scene.position.set(0, 0, 0);
                this.props.scene.add(gltf.scene);
                this.gltf = gltf.scene;
                this.mixer = new THREE.AnimationMixer(this.gltf);

                if (props.modelPath === "Knight.glb") {
                    this.runAction = this.mixer.clipAction(gltf.animations[48]);
                    this.idleAction = this.mixer.clipAction(gltf.animations[36]);
                    this.attackAction = this.mixer.clipAction(gltf.animations[0]);

                    this.attackAction.clampWhenFinished = true;
                    // this.attackAction.loop = THREE.LoopOnce;
                    // this.attackAction.timeScale = 1.5;
                    // this.attackAction.play();
                    this.idleAction.timeScale = 3;
                    this.idleAction.play();

                    const helmet = (gltf.scene.children[0].children[3] as THREE.SkinnedMesh).skeleton.bones[14].children[0];
                    helmet.rotation.x = 1;
                    helmet.parent?.remove(helmet);
                }
                else {
                    // scale x2
                    gltf.scene.scale.set(2, 2, 2);
                    console.log(gltf.animations);

                    this.idleAction = this.mixer.clipAction(gltf.animations[36]);
                    this.idleAction.timeScale = 3;
                    this.idleAction.play();

                    // hp bar
                    const geometry = new THREE.PlaneGeometry(1, 0.1);
                    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    const plane = new THREE.Mesh(geometry, material);
                    plane.position.set(0, 3, 0);
                    gltf.scene.add(plane);
                }
            }
        );

    }

    rotateHeadX(angle: number) {
        const headBone = (this.gltf.children[0].children[3] as THREE.SkinnedMesh).skeleton.bones[14];
        headBone.rotation.x = angle;
    }

    update(deltaTime: number) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    render() {
        return null;
    }
}
