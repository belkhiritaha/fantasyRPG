import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import * as React from 'react';
import Player from '../Player';

interface GroundProps {
    scene: THREE.Scene;
    player: Player;
}

const PLAYER_RADIUS = 10;

const DIMENSIONS = {
    width: 100,
    height: 100,
    depth: 10,
};

export default class Ground extends React.Component<GroundProps> {
    public positions: THREE.Vector3[] = [];
    public mesh = new THREE.Mesh();
    public simplex = new SimplexNoise();
    public geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    public material = new THREE.MeshLambertMaterial({
        color: 0x33ff33,
        side: THREE.DoubleSide,
        fog: true,
        // wireframe: true,
    });

    constructor(props: any) {
        super(props);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.rotateX(Math.PI / 2);
        this.mesh.position.y = -20;
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
        this.mesh.name = 'Ground';
        this.mesh.userData = {
            type: 'Ground',
        };        
        // use simplex noise to generate height
        for (let i = 0; i < DIMENSIONS.width * DIMENSIONS.height; i++) {
            const x = i % DIMENSIONS.width;
            const y = Math.floor(i / DIMENSIONS.width);
            const z = this.simplex.noise(x , y);
            this.positions.push(new THREE.Vector3(x, y, z));

            // update geometry
            this.mesh.geometry.attributes.position.setZ(i, z);

            // update bump map
            this.mesh.geometry.attributes.normal.setZ(i, z);
        }

        this.mesh.scale.x = 10;
        this.mesh.scale.y = 20;
        this.mesh.scale.z = 10;
        // this.mesh.scale.y = PLAYER_RADIUS;
        // this.mesh.scale.z = PLAYER_RADIUS;

        this.mesh.geometry.attributes.position.needsUpdate = true;
        // set lightMapIntensity to 1 to make the ground darker
        this.mesh.geometry.computeVertexNormals();
        // update world matrix
        this.mesh.updateMatrixWorld(true);
        this.props.scene.add(this.mesh);

        // const light = new THREE.AmbientLight(0x404040);
        // light.intensity = 0.2;
        // this.props.scene.add(light);

        // // ADD a Point Light and position the light away from the camera
        // const pointLight = new THREE.PointLight('white');
        // // set intensity
        // pointLight.intensity = 1;
        // pointLight.position.set(100, 100, 0);
        // pointLight.add(new THREE.Mesh(
        // new THREE.SphereGeometry(1, 10, 10),
        // new THREE.MeshBasicMaterial({
        //     color: 'white'
        // })));
        // this.props.scene.add(pointLight);
    }
}