import { Component } from "react";
import * as THREE from "three";
import Character from "./loaders/Character";

interface EnemyProps {
    position: THREE.Vector3;
    scene: THREE.Scene;
    classType: string;
    hp: number;
}

export default class Enemy extends Component<EnemyProps> {
    public character: Character;
    public position: THREE.Vector3;
    public direction: THREE.Vector3;
    public velocity: THREE.Vector3;
    public height = 0;
    public name = '';
    public hp = this.props.hp;
    public classType = this.props.classType;

    constructor(props: EnemyProps) {
        super(props);
        this.character = new Character({...props, modelPath: props.classType === "warrior" ? "Knight.glb" : "Rogue_Hooded.glb"});
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
    }

    update(deltaTime: number) {
        this.character.update(deltaTime);

        // const speedDelta = deltaTime * 5;

        let damping = Math.exp(-4 * deltaTime) - 1;

        this.velocity.addScaledVector(this.velocity, damping);

        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime * 10);
        this.position.add(deltaPosition);

        const ground = this.props.scene.getObjectByName('ground');
        if (ground && this.position.y - (this.height / 2) * 2 < ground.position.y) {
            this.position.y = ground.position.y + (this.height / 2) * 2;
            this.velocity.y = 0;
        }

        // if is running
        if (this.velocity.length() > 0.1) {
            this.character.playRunAnimation();
        } else {
            this.character.stopRunAnimation();
        }

        this.character.gltf?.position.copy(this.position);
    }

    setPosition(position: THREE.Vector3) {
        this.position.copy(position);
        this.character.gltf?.position.copy(position);
    }

    setVelocity(velocity: THREE.Vector3) {
        this.velocity.copy(velocity);
    }
    
    removeFromScene() {
        this.props.scene.remove(this.character.gltf);
    }

    getForwardVector(): THREE.Vector3 {
        this.character.gltf.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();

        return this.direction;
    }

    getSideVector(): THREE.Vector3 {
        this.character.gltf.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();
        this.direction.cross(this.character.gltf.up);

        return this.direction;
    }

    render() {
        return null;
    }
}
