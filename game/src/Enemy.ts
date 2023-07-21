import { Component } from "react";
import * as THREE from "three";
import Character from "./Character";

interface EnemyProps {
    position: THREE.Vector3;
    scene: THREE.Scene;
}

export default class Enemy extends Component<EnemyProps> {
    public character: Character;
    public position: THREE.Vector3;
    public direction: THREE.Vector3;
    public velocity: THREE.Vector3;
    public height = 0;

    constructor(props: EnemyProps) {
        super(props);
        this.character = new Character(props);
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
    }

    update(deltaTime: number) {
        this.character.update(deltaTime);
        const gravity = new THREE.Vector3(0, -9.8, 0);
        this.velocity.addScaledVector(gravity, deltaTime);


        const speedDelta = deltaTime * 5;

        let damping = Math.exp(-4 * deltaTime) - 1;

        this.velocity.addScaledVector(this.velocity, damping);

        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime * 10);
        this.position.add(deltaPosition);

        const ground = this.props.scene.getObjectByName('ground');
        if (ground && this.position.y - (this.height / 2) * 2 < ground.position.y) {
            this.position.y = ground.position.y + (this.height / 2) * 2;
            this.velocity.y = 0;
        }

        this.character.gltf?.position.copy(this.position);
    }

    setPosition(position: THREE.Vector3) {
        this.position.copy(position);
        this.character.gltf?.position.copy(position);
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