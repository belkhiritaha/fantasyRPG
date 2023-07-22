import { Component } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

interface CharacterProps {
    position: THREE.Vector3;
    scene: THREE.Scene;
}

export default class Character extends Component<CharacterProps> {
    public gltf: THREE.Group;
    public mixer: THREE.AnimationMixer;
    
    public runAction: THREE.AnimationAction;
    public idleAction: THREE.AnimationAction;
    public attackAction: THREE.AnimationAction;

    public activeAction: THREE.AnimationAction;
    public lastAction: THREE.AnimationAction;


    constructor(props: CharacterProps) {
        super(props);
        const loader = new GLTFLoader();

        const texture = new THREE.TextureLoader().load("knight_texture.png");

        loader.load(
            "Knight.glb",
            (gltf) => {
                gltf.scene.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.material = new THREE.MeshBasicMaterial({
                            map: texture,
                            // skinning: true,
                        });
                    }
                });
                // gltf.scene.scale.set(2, 2, 2);
                gltf.scene.position.set(0, 0, 0);
                this.props.scene.add(gltf.scene);
                this.gltf = gltf.scene;
                this.mixer = new THREE.AnimationMixer(this.gltf);

                // console.log(gltf.animations);
                this.runAction = this.mixer.clipAction(gltf.animations[48]);
                this.idleAction = this.mixer.clipAction(gltf.animations[36]);
                this.attackAction = this.mixer.clipAction(gltf.animations[0]);

                this.attackAction.clampWhenFinished = true;
                // this.attackAction.loop = THREE.LoopOnce;
                // this.attackAction.timeScale = 1.5;
                // this.attackAction.play();
                this.idleAction.timeScale = 3;
                this.idleAction.play();
            }
        );
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
