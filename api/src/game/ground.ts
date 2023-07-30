import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import fs from 'fs';


export const MAP_DIMENSIONS = {
    width: 500,
    height: 500,
    segments: 10
}

export function createGround(scene: THREE.Scene) {
    const groundGeometry = new THREE.PlaneGeometry(MAP_DIMENSIONS.width, MAP_DIMENSIONS.height, MAP_DIMENSIONS.segments, MAP_DIMENSIONS.segments);
    const simplex = new SimplexNoise();
    const ground = new THREE.Mesh(groundGeometry, new THREE.MeshLambertMaterial({ color: 0x00ff00, side: THREE.DoubleSide }));
    ground.name = "ground";
    
    const constructionPromise = new Promise((resolve, reject) => {
        const verticesCoords: { x: number, y: number, z: number }[] = [];
        for (let i = 0; i < groundGeometry.attributes.position.count; i++) {
            const x = groundGeometry.attributes.position.getX(i);
            const y = groundGeometry.attributes.position.getY(i);
            const z = simplex.noise(x, y) * 5;
            groundGeometry.attributes.position.setZ(i, z);
            groundGeometry.attributes.normal.setZ(i, z);
            verticesCoords.push({ x: x, y: y, z: z });
        }
        groundGeometry.attributes.position.needsUpdate = true;
        groundGeometry.computeVertexNormals();
        resolve(verticesCoords);
    });
    
    scene.add(ground);
    // rotate ground
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -20;
    // update matrix
    
    // make y the up axis
    // groundGeometry.rotateX(Math.PI / 2);
    // groundGeometry.rotateY(Math.PI / 2);
    // groundGeometry.rotateZ(Math.PI / 2);
    // groundGeometry.translate(0, 0, -20);
    // ground.updateMatrix();

    constructionPromise.then((verticesCoords) => {
        fs.writeFile('vertices.json', JSON.stringify(verticesCoords), (err) => {
            if (err) {
                console.log(err);
            }
        });
        console.log("Ground construction complete");
    });

    return ground;

}