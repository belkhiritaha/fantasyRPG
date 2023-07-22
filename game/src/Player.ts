import React, { Component } from 'react';
import * as THREE from 'three';

const BLOCK_RADIUS = 2;

interface PlayerProps {
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
}

export default class Player extends Component<PlayerProps> {
    public position: THREE.Vector3;
    public direction: THREE.Vector3;
    public velocity: THREE.Vector3;
    public isTyping = false;
    public name = '';
    public height = 1.8;

    constructor(props: PlayerProps) {
        super(props);
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
    }

    setPosition(position: THREE.Vector3) {
        this.position.copy(position);
        this.props.camera.position.copy(position.clone().add(new THREE.Vector3(0, this.height, 0)));
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
        // this.props.camera.getWorldDirection(this.direction);
        // this.direction.y = 0;
        // this.direction.normalize();
        // this.direction.cross(this.props.camera.up);

        // return this.direction
    }

    render() {
        return null;
    }
}
