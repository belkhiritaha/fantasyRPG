import { Component } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import Player from "../Player";
import Weapon from "./Weapon";

interface WeaponAddonProps {
    position: THREE.Vector3;
    weapon: Weapon;
    scene: THREE.Scene;
    player: Player;
    camera: THREE.PerspectiveCamera;
}

export default class WeaponAddon extends Component<WeaponAddonProps> {
    public gltf: THREE.Group;
    public mixer: THREE.AnimationMixer;
    
    public bobbleAction: THREE.AnimationAction;
    public attackAction: THREE.AnimationAction;
    public strikeAction: THREE.AnimationAction;

    public activeAction: THREE.AnimationAction;
    public lastAction: THREE.AnimationAction;


    constructor(props: WeaponAddonProps) {
        super(props);
        const loader = new GLTFLoader();

        // const texture = new THREE.TextureLoader().load("knight_texture.png");

        loader.load(
            // "sword_2handed_color.gltf",
            this.props.player.classType === "warrior" ? "shield_badge.gltf" : "arrow.gltf",
            (gltf) => {
                this.props.scene.add(gltf.scene);
                this.gltf = gltf.scene;
                this.mixer = new THREE.AnimationMixer(this.gltf);

                console.log("Added weapon to scene");
                console.log(gltf);

                
                console.log(this.gltf);
                
                // add weapon to ccamera group
                this.props.camera.add(this.gltf);
                switch (this.props.player.classType) {
                    case "warrior":
                    const initialEuler = new THREE.Euler(0, Math.PI, 0, 'XYZ');
                    const initialQuaternion = new THREE.Quaternion().setFromEuler(initialEuler);
                    this.gltf.quaternion.copy(initialQuaternion);
                    break;
                    case "ranger":
                    this.gltf.position.set(1, -0.5, -1);
                    const initialEuler2 = new THREE.Euler( Math.PI / 2, - Math.PI , 0, 'XYZ');
                    const initialQuaternion2 = new THREE.Quaternion().setFromEuler(initialEuler2);
                    this.gltf.quaternion.copy(initialQuaternion2);
                    break;
                }

                // create animations (no animations in this model)
                let bobbleKeyframes: number[];
                this.props.player.classType === "ranger" ? 
                bobbleKeyframes = [
                    1, -0.25, -1.5,
                    1, -0.2, -1.5,
                    1, -0.25, -1.5
                ] :
                bobbleKeyframes = [
                    -1, -0.5, -1,
                    -1, -0.45, -1,
                    -1, -0.5, -1
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
                    1, -0.25, -1.5,
                    1, -0.25, -1.25,
                    1, -0.25, -0.5
                ];
                const attackTrack = new THREE.VectorKeyframeTrack('.position', [0, 3, 6], attackKeyframes);
                const attackClip = new THREE.AnimationClip('attack', -1, [attackTrack, attackTrack, attackTrack]);
                const attackAction = this.mixer.clipAction(attackClip);
                attackAction.loop = THREE.LoopOnce;
                attackAction.clampWhenFinished = true;
                attackAction.timeScale = 100;
                this.attackAction = attackAction;

                // const strikeKeyframes = [
                //     1, -0.5, -1,
                //     2, 0, -2,
                //     1, -0.5, -1
                // ];
                // const strikeTrack = new THREE.VectorKeyframeTrack('.position', [0, 3, 6], strikeKeyframes);
                // const strikeClip = new THREE.AnimationClip('strike', -1, [strikeTrack, strikeTrack]);
                // const strikeAction = this.mixer.clipAction(strikeClip);
                // strikeAction.loop = THREE.LoopOnce;
                // strikeAction.timeScale = 100;
                // strikeAction.clampWhenFinished = true;
                // this.strikeAction = strikeAction;

                const releaseKeyframes = [
                    1, -0.25, -0.5,
                    1, -0.25, -2,
                    1, -0.25, -100,
                    1, -0.25, -2,
                ];
                const releaseTrack = new THREE.VectorKeyframeTrack('.position', [0, 3, 6, 9], releaseKeyframes);
                const releaseClip = new THREE.AnimationClip('release', -1, [releaseTrack, releaseTrack, releaseTrack]);
                const releaseAction = this.mixer.clipAction(releaseClip);
                releaseAction.loop = THREE.LoopOnce;
                releaseAction.timeScale = 100;
                releaseAction.clampWhenFinished = true;
                this.strikeAction = releaseAction;

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




        this.attackAction.reset();
        // this.strikeAction.reset();

    }

    release() {
        console.log("release");
        if (this.props.player.classType === "ranger") {
            this.strikeAction.play();
            this.strikeAction.reset();
        }
    }


    render() {
        return null;
    }
}
