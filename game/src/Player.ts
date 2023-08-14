import React, { Component } from 'react';
import * as THREE from 'three';
import Weapon from './loaders/Weapon';

const BLOCK_RADIUS = 2;

interface PlayerProps {
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    classType: string;
}

export default class Player extends Component<PlayerProps> {
    public position: THREE.Vector3;
    public direction: THREE.Vector3;
    public velocity: THREE.Vector3;
    public hp = 100;
    public isTyping = false;
    public name = '';
    public height = 1.8;
    public weapon: Weapon;
    public group: THREE.Group;
    public classType = this.props.classType;
    public attackCooldown = 0;

    public lookAtLine = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xff0000 }));

    constructor(props: PlayerProps) {
        super(props);
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.weapon = new Weapon({ position: new THREE.Vector3(), scene: props.scene, player: this, camera: props.camera });
        this.group = new THREE.Group();

        this.props.scene.add(this.group);
    }

    setPositionX(x: number) {
        this.position.copy(new THREE.Vector3(x, this.position.y, this.position.z));
        this.props.camera.position.copy(this.position.clone().add(new THREE.Vector3(0, this.height, 0)));
    }

    setPositionZ(z: number) {
        this.position.copy(new THREE.Vector3(this.position.x, this.position.y, z));
        this.props.camera.position.copy(this.position.clone().add(new THREE.Vector3(0, this.height, 0)));
    }

    setPositionY(y: number) {
        this.position.copy(new THREE.Vector3(this.position.x, y, this.position.z));
        this.props.camera.position.copy(this.position.clone().add(new THREE.Vector3(0, this.height, 0)));
    }

    setPosition(position: THREE.Vector3) {
        this.position.copy(position);
        this.props.camera.position.copy(this.position.clone().add(new THREE.Vector3(0, this.height, 0)));
    }

    setVelocity(velocity: THREE.Vector3) {
        this.velocity.copy(velocity);
    }

    getForwardVector(): THREE.Vector3 {
        this.props.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();

        return this.direction;
    }

    getSideVector(): THREE.Vector3 {
        const sideVector = this.getForwardVector().clone();
        sideVector.cross(this.props.camera.up);

        return sideVector;
    }

    render() {
        return null;
    }
}
