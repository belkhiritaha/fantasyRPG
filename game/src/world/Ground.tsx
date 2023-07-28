import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';
import * as React from 'react';
import Player from '../Player';

interface GroundProps {
    scene: THREE.Scene;
    player: Player;
}

const PLAYER_RADIUS = 10;

// const DIMENSIONS = {
//     width: 100,
//     height: 100,
//     depth: 10,
// };

export default class Ground extends React.Component<GroundProps> {
    public positions: THREE.Vector3[] = [];
    public mesh = new THREE.Mesh();
    public simplex = new SimplexNoise();
    public material = new THREE.MeshLambertMaterial({
        color: 0x188018,
        side: THREE.DoubleSide,
        fog: true,
        // wireframe: true,
        flatShading: true,
    });
    public DIMENSIONS = {
        width: 100,
        height: 100,
        segmentW: 10,
        segmentH: 10,
    };
    public geometry = new THREE.PlaneGeometry(this.DIMENSIONS.width, this.DIMENSIONS.height, this.DIMENSIONS.segmentW, this.DIMENSIONS.segmentH);
    public normals : THREE.Vector3[] = [];

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
        for (let i = 0; i < this.DIMENSIONS.segmentW * this.DIMENSIONS.segmentH; i++) {
            const x = i % this.DIMENSIONS.segmentW;
            const y = Math.floor(i / this.DIMENSIONS.segmentW);
            const z = this.simplex.noise(x / 10 , y / 10) * 2;
            const scope = this.DIMENSIONS.width / this.DIMENSIONS.segmentW;

            this.positions.push(new THREE.Vector3(x * scope, z * scope, y * scope));

            // update geometry
            this.mesh.geometry.attributes.position.setZ(i, z);

            // update bump map
            this.mesh.geometry.attributes.normal.setZ(i, z);
        }

        // this.mesh.scale.x = 20;
        // this.mesh.scale.y = 20;
        // this.mesh.scale.z = 20;


        this.mesh.geometry.attributes.position.needsUpdate = true;
        // set lightMapIntensity to 1 to make the ground darker
        this.mesh.geometry.computeVertexNormals();
        // update world matrix
        this.mesh.updateMatrixWorld(true);

        // get all vertex normals
        for (let i = 0; i < this.mesh.geometry.attributes.normal.count; i++) {
            const x = this.mesh.geometry.attributes.normal.getX(i);
            const y = this.mesh.geometry.attributes.normal.getY(i);
            const z = this.mesh.geometry.attributes.normal.getZ(i);
            this.normals.push(new THREE.Vector3(x, y, z));
        }

        console.log(this.normals);
        this.props.scene.add(this.mesh);
        console.log(this.positions);

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