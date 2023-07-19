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
    public height = 1.8;

    constructor(props: PlayerProps) {
        super(props);
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
    }

    update(deltaTime: number) {
        const gravity = new THREE.Vector3(0, -9.8, 0);
        this.velocity.addScaledVector(gravity, deltaTime);

        let damping = Math.exp(-4 * deltaTime) - 1;

        this.velocity.addScaledVector(this.velocity, damping);

        const deltaPosition = this.velocity.clone().multiplyScalar(deltaTime * 10);
        this.position.add(deltaPosition);

        const ground = this.props.scene.getObjectByName('ground');
        if (ground && this.position.y - (this.height / 2) * BLOCK_RADIUS < ground.position.y) {
            this.position.y = ground.position.y + (this.height / 2) * BLOCK_RADIUS;
            this.velocity.y = 0;
        }

        this.props.camera.position.copy(this.position);
    }

    getForwardVector(): THREE.Vector3 {
        this.props.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();

        return this.direction;
    }

    getSideVector(): THREE.Vector3 {
        this.props.camera.getWorldDirection(this.direction);
        this.direction.y = 0;
        this.direction.normalize();
        this.direction.cross(this.props.camera.up);

        return this.direction;
    }

    render() {
        return null;
    }
}
