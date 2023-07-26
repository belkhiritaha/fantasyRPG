import { Component } from "react";
import * as THREE from "three";
import Character from "./loaders/Character";

interface MobProps {
    position: THREE.Vector3;
    scene: THREE.Scene;
}

export default class Mob extends Component<MobProps> {
    public character: Character;
    public position: THREE.Vector3;
    public direction: THREE.Vector3;
    public velocity: THREE.Vector3;
    public height = 5;
    public name = '';

    constructor(props: MobProps) {
        super(props);
        this.character = new Character({...props, modelPath: "Barbarian.glb" });
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
    }

    setPosition(position: THREE.Vector3) {
        this.position.copy(position);
        this.character.gltf?.position.copy(position);
        this.character.hitBox?.position.set(position.x, position.y, position.z);

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
