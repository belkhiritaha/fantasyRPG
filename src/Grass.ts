import React, { Component } from 'react';
import * as THREE from 'three';

interface GrassProps {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
}

class Grass extends Component<GrassProps> {
    private canvasRef: React.RefObject<HTMLCanvasElement>;
    public grassMesh: THREE.InstancedMesh;
    public leavesMaterial: THREE.ShaderMaterial | null = null;

    constructor(props: GrassProps) {
        super(props);
        this.canvasRef = React.createRef();
        this.grassMesh = this.createGrass();
        this.props.scene.add(this.grassMesh);
        // this.animate();
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleWindowResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleWindowResize);
    }

    handleWindowResize = () => {
        const { innerWidth, innerHeight } = window;
        this.props.camera.aspect = innerWidth / innerHeight;
        this.props.camera.updateProjectionMatrix();
        this.props.renderer.setSize(innerWidth, innerHeight);
    };

    createGrass() {
        let simpleNoise = `
            float N (vec2 st) { // https://thebookofshaders.com/10/
                return fract( sin( dot( st.xy, vec2(12.9898,78.233 ) ) ) *  43758.5453123);
            }
            
            float smoothNoise( vec2 ip ){ // https://www.youtube.com/watch?v=zXsWftRdsvU
                vec2 lv = fract( ip );
            vec2 id = floor( ip );
            
            lv = lv * lv * ( 3. - 2. * lv );
            
            float bl = N( id );
            float br = N( id + vec2( 1, 0 ));
            float b = mix( bl, br, lv.x );
            
            float tl = N( id + vec2( 0, 1 ));
            float tr = N( id + vec2( 1, 1 ));
            float t = mix( tl, tr, lv.x );
            
            return mix( b, t, lv.y );
            }
        `;

        const vertexShader = `
            varying vec2 vUv;
            uniform float time;
            
            ${simpleNoise}
            
                void main() {

                vUv = uv;
                float t = time * 2.;
                
                // VERTEX POSITION
                
                vec4 mvPosition = vec4( position, 1.0 );
                #ifdef USE_INSTANCING
                    mvPosition = instanceMatrix * mvPosition;
                #endif
                
                // DISPLACEMENT
                
                float noise = smoothNoise(mvPosition.xz * 0.5 + vec2(0., t));
                noise = pow(noise * 0.5 + 0.5, 2.) * 2.;
                
                // here the displacement is made stronger on the blades tips.
                float dispPower = 1. - cos( uv.y * 3.1416 * 0.5 );
                
                float displacement = noise * ( 0.3 * dispPower );
                mvPosition.z -= displacement;
                
                //
                
                vec4 modelViewPosition = modelViewMatrix * mvPosition;
                gl_Position = projectionMatrix * modelViewPosition;

                }
            `;

            const fragmentShader = `
            varying vec2 vUv;
            
            void main() {
                vec3 baseColor = vec3( 0.41, 1.0, 0.5 );
                float clarity = ( vUv.y * 0.5 ) + 0.5;
                gl_FragColor = vec4( baseColor * clarity, 1 );
            }
            `;

            const uniforms = {
                time: {
                value: 0
            }
            }

            const leavesMaterial = new THREE.ShaderMaterial({
                vertexShader,
            fragmentShader,
            uniforms,
            side: THREE.DoubleSide
            });

            this.leavesMaterial = leavesMaterial;

            /////////
            // MESH
            /////////

            const instanceNumber = 100000;
            const dummy = new THREE.Object3D();

            const geometry = new THREE.PlaneGeometry( 0.1, 0.5, 1, 4 );
            geometry.translate( 0, 0.5, 0 ); // move grass blade geometry lowest point at 0.

            const instancedMesh = new THREE.InstancedMesh( geometry, leavesMaterial, instanceNumber );

            this.props.scene.add( instancedMesh );

            // Position and scale the grass blade instances randomly.

            for ( let i=0 ; i<instanceNumber ; i++ ) {

                dummy.position.set(
                ( Math.random() - 0.5 ) * 100,
                0,
                ( Math.random() - 0.5 ) * 100);
            
                dummy.scale.setScalar( 0.5 + Math.random() * 0.5 );
                
                dummy.rotation.y = Math.random() * Math.PI;
                
                dummy.updateMatrix();
                instancedMesh.setMatrixAt( i, dummy.matrix );

            }

            return instancedMesh;
      }

      animate(delta: number) {

        // Hand a time variable to vertex shader for wind displacement.
        if ( this.leavesMaterial ) {
            this.leavesMaterial.uniforms.time.value = delta;
            this.leavesMaterial.uniformsNeedUpdate = true;

        }
    
    };
}

export default Grass;
