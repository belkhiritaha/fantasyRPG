import { Component } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Player from "../Player";

interface WeaponProps {
    position: THREE.Vector3;
    scene: THREE.Scene;
    player: Player;
    camera: THREE.PerspectiveCamera;
}

export default class Weapon extends Component<WeaponProps> {
    public gltf: THREE.Group;
    public mixer: THREE.AnimationMixer;
    
    public bobbleAction: THREE.AnimationAction;
    public attackAction: THREE.AnimationAction;
    public strikeAction: THREE.AnimationAction;

    public activeAction: THREE.AnimationAction;
    public lastAction: THREE.AnimationAction;


    constructor(props: WeaponProps) {
        super(props);
        const loader = new GLTFLoader();

        // const texture = new THREE.TextureLoader().load("knight_texture.png");

        loader.load(
            "sword_2handed_color.gltf",
            (gltf) => {
                this.props.scene.add(gltf.scene);
                this.gltf = gltf.scene;
                this.mixer = new THREE.AnimationMixer(this.gltf);

                console.log("Added weapon to scene");
                console.log(gltf);

                // rotate weapon
                // this.gltf.rotation.x = -Math.PI / 4;
                // this.gltf.rotation.y = 3 * Math.PI / 4;
                // this.gltf.rotation.z = Math.PI / 8;

                const initialEuler = new THREE.Euler(-Math.PI / 4, 3 * Math.PI / 4, 0, 'XYZ');
                const initialQuaternion = new THREE.Quaternion().setFromEuler(initialEuler);
                this.gltf.quaternion.copy(initialQuaternion);

                // add weapon to ccamera group
                this.props.camera.add(this.gltf);
                this.gltf.position.set(1, -0.5, -1);

                // create animations (no animations in this model)
                const bobbleKeyframes = [
                    1, -0.5, -1,
                    1, -0.45, -1,
                    1, -0.5, -1
                ];
                const bobbleTrack = new THREE.VectorKeyframeTrack('.position', [0, 3, 6], bobbleKeyframes);
                const bobbleClip = new THREE.AnimationClip('bobble', -1, [bobbleTrack, bobbleTrack, bobbleTrack]);
                const bobbleAction = this.mixer.clipAction(bobbleClip);
                bobbleAction.loop = THREE.LoopPingPong;
                bobbleAction.timeScale = 20;
                bobbleAction.clampWhenFinished = true;
                bobbleAction.play();
                this.bobbleAction = bobbleAction;


                const attackKeyframes = [
                    -0.2, 1, -0.3, 1,
                    -1.2, 1, -0.3, 1,
                    -0.2, 1, -0.3, 1
                ];
                const attackTrack = new THREE.QuaternionKeyframeTrack('.quaternion', [0, 3, 6], attackKeyframes);
                const attackClip = new THREE.AnimationClip('attack', -1, [attackTrack, attackTrack, attackTrack]);
                const attackAction = this.mixer.clipAction(attackClip);
                attackAction.loop = THREE.LoopOnce;
                attackAction.timeScale = 100;
                this.attackAction = attackAction;

                const strikeKeyframes = [
                    1, -0.5, -1,
                    2, 0, -2,
                    1, -0.5, -1
                ];
                const strikeTrack = new THREE.VectorKeyframeTrack('.position', [0, 3, 6], strikeKeyframes);
                const strikeClip = new THREE.AnimationClip('strike', -1, [strikeTrack, strikeTrack]);
                const strikeAction = this.mixer.clipAction(strikeClip);
                strikeAction.loop = THREE.LoopOnce;
                strikeAction.timeScale = 100;
                strikeAction.clampWhenFinished = true;
                this.strikeAction = strikeAction;
            }
        );
    }

    bobbleWeapon(deltaTime: number) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    shoot() {
        this.attackAction.play();
        this.strikeAction.play();

        this.attackAction.reset();
        this.strikeAction.reset();

    }




    render() {
        return null;
    }
}
