import { Component } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

interface CharacterProps {
    position: THREE.Vector3;
    scene: THREE.Scene;
    modelPath: string;
    hp: number;
}

export default class Character extends Component<CharacterProps> {
    public gltf: THREE.Group;
    public mixer: THREE.AnimationMixer;

    public hp = this.props.hp;
    
    public runAction: THREE.AnimationAction;
    public idleAction: THREE.AnimationAction;
    public attackAction: THREE.AnimationAction[] = [];

    public activeAction: THREE.AnimationAction;
    public lastAction: THREE.AnimationAction;

    public hitBox = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 5), new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true }));


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

                if (props.modelPath === "Knight.glb" || props.modelPath === "Rogue_Hooded.glb") {
                    this.runAction = this.mixer.clipAction(gltf.animations[48]);
                    this.idleAction = this.mixer.clipAction(gltf.animations[36]);
                    switch (props.modelPath) {
                        case "Knight.glb":
                            this.attackAction.push(this.mixer.clipAction(gltf.animations[0])); // from 0 to 3 are attack animations
                            this.attackAction.push(this.mixer.clipAction(gltf.animations[1]));
                            this.attackAction.push(this.mixer.clipAction(gltf.animations[2]));
                            // this.attackAction.push(this.mixer.clipAction(gltf.animations[3]));
                            this.attackAction.push(this.mixer.clipAction(gltf.animations[8]));
                            for (let i = 0; i < this.attackAction.length; i++) {
                                // this.attackAction[i].clampWhenFinished = true;
                                this.attackAction[i].loop = THREE.LoopOnce;
                                this.attackAction[i].timeScale = 15;
                            }
                            break;
                        case "Rogue_Hooded.glb":
                            console.log(gltf.animations);
                            this.attackAction.push(this.mixer.clipAction(gltf.animations[17]));
                            for (let i = 0; i < this.attackAction.length; i++) {
                                // this.attackAction[i].clampWhenFinished = true;
                                this.attackAction[i].loop = THREE.LoopOnce;
                                this.attackAction[i].timeScale = 10;
                                // this.attackAction[i].setDuration(0.1);
                            }
                            break;
                    }

                    // this.attackAction.play();
                    this.idleAction.timeScale = 3;
                    this.runAction.timeScale = 6;
                    // this.runAction.play();
                    this.idleAction.play();

                    const helmet = (gltf.scene.children[0].children[3] as THREE.SkinnedMesh).skeleton.bones[14].children[0];
                    helmet.rotation.x = 1;
                    helmet.parent?.remove(helmet);

                    // hp bar
                    // const geometry = new THREE.PlaneGeometry(1, 0.1); needs to be proportional to the hp
                    const geometry = new THREE.PlaneGeometry(1 * this.hp / 100, 0.1);
                    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
                    const plane = new THREE.Mesh(geometry, material);
                    plane.position.set(0, 3, 0);
                    plane.name = "hpBar";
                }
                else {
                    // scale x2
                    gltf.scene.scale.set(2, 2, 2);

                    this.idleAction = this.mixer.clipAction(gltf.animations[36]);
                    this.idleAction.timeScale = 3;
                    this.idleAction.play();

                    this.runAction = this.mixer.clipAction(gltf.animations[48]);
                    this.attackAction.push(this.mixer.clipAction(gltf.animations[0]));

                    // hp bar
                    // const geometry = new THREE.PlaneGeometry(1, 0.1); needs to be proportional to the hp
                    const geometry = new THREE.PlaneGeometry(1 * this.hp / 100, 0.1);
                    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                    const plane = new THREE.Mesh(geometry, material);
                    plane.position.set(0, 3, 0);
                    plane.name = "hpBar";

                    // gltf.scene.add( this.hitBox );
                    this.hitBox.name = "hitBox";
                    this.props.scene.add( this.hitBox );

                    this.runAction.clampWhenFinished = true;
                    this.runAction.loop = THREE.LoopRepeat;
                    this.runAction.setDuration(0.1);
                    this.runAction.play();
                    gltf.scene.add(plane);
                }
            }
        );

    }

    // set z axis angle
    setYAxisAngle(yAxisAngle: number) {
        // this.gltf?.rotation.y = yAxisAngle;
        this.gltf ? this.gltf.rotation.y = yAxisAngle : null;
    }
    
    setXAxisAngle(xAxisAngle: number) {
        const headBone = (this.gltf?.children[0].children[3] as THREE.SkinnedMesh)?.skeleton.bones[14];
        // headBone.rotation.x = xAxisAngle;
        headBone ? headBone.rotation.x = xAxisAngle : null;
    }

    update(deltaTime: number) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    takeDamage(damage: number) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            this.props.scene.remove(this.gltf??null);
            // remove hitbox
            this.props.scene.remove(this.hitBox);
        }
        else {
            const hpBar = this.gltf?.getObjectByName("hpBar") as THREE.Mesh;
            hpBar.geometry = new THREE.PlaneGeometry(1 * this.hp / 100, 0.1);
        }
    }

    playAttackAnimation() {
        const randomAttack = Math.floor(Math.random() * this.attackAction.length);
        this.attackAction[randomAttack].reset();
        this.attackAction[randomAttack].play();
    }

    playRunAnimation() {
        // if animation is already playing, don't play it again
        if (this.runAction?.isRunning()) {
            return;
        }
        this.idleAction?.stop();
        this.runAction?.reset();
        this.runAction?.play();
    }
    
    stopRunAnimation() {
        this.runAction?.stop();
        // this.idleAction?.reset();
        this.idleAction?.play();
    }


    render() {
        return null;
    }
}
