import React from 'react'
import * as THREE from 'three'
import "bootstrap/dist/css/bootstrap.min.css"
import { Col, Row, Container } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { PlaneGeometry } from 'three'

import Game from './Game'

import './App.css'

function App() {
    const geometry = new THREE.PlaneGeometry( 500, 100, 50, 50 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true } );
    const [renderer, setRenderer] = React.useState<THREE.WebGLRenderer>(new THREE.WebGLRenderer())
    const [scene, setScene] = React.useState<THREE.Scene>(new THREE.Scene())
    const [camera, setCamera] = React.useState<THREE.PerspectiveCamera>(new THREE.PerspectiveCamera())
    const [composer, setComposer] = React.useState<EffectComposer>(new EffectComposer( renderer ))
    const [plane, setPlane] = React.useState<THREE.Mesh>(new THREE.Mesh(geometry, material))
    
    // React.useEffect(() => {
    //     // setRenderer(renderer)
    //     // setScene(scene)
    //     // setCamera(camera)
    //     // setComposer(composer)

    //     renderer.setSize(window.innerWidth, window.innerHeight)
    //     renderer.setPixelRatio(window.devicePixelRatio)
    //     renderer.setClearColor(0x000000, 1)
    //     document.body.appendChild(renderer.domElement)

    //     camera.position.set(0 , -1, 5)
    //     console.log(camera.position)
    //     // set camera to look at 0 0 0
    //     // camera.lookAt(0, 0, 0);

    //     // const geometry = new THREE.PlaneGeometry( 400, 100, 100, 100 );
    //     // const terrain = new THREE.Mesh(geometry, material);

        
    //     // terrain.position.y = -5;
    //     // terrain.rotation.x = Math.PI / 2;
    //     // console.log(terrain.position)
        
    //     // scene.add(terrain);
    //     // // // rotate
    //     var peak = 10;
    //     var smoothing = 0.5;
    //     var vertices = plane.geometry.attributes.position.array;
    //     for (var i = 0; i <= vertices.length; i += 3) {
    //         var value = (Math.random() * smoothing) - (smoothing / 2);
    //         vertices[i + 2] = value * peak;
    //     }
    //     plane.geometry.attributes.position.needsUpdate = true;
    //     plane.geometry.computeVertexNormals();
    //     plane.rotation.x = Math.PI / 1.75 - 0.1;
    //     plane.position.y = -5;
    //     scene.add( plane );

    //     const renderScene = new RenderPass( scene, camera );
        
    //     const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth/2, window.innerHeight/2 ), 1.5, 0.4, 0.85 );
    //     bloomPass.threshold = 100;
    //     bloomPass.strength = 0.25;
    //     bloomPass.radius = 20;
        
    //     composer.addPass( renderScene );
    //     // composer.addPass( bloomPass );
    // }, [])

    // const animate = function () {
    //     requestAnimationFrame( animate );

    //     composer.render();
    // };

    // animate();


    function exitTerminal() {
    }

    function expandTerminal() {
    }

    return (
        <>
            {/* <Container fluid style={{ zIndex: -1 }}>
                <div id="canvas" /> */}

                <Game />
                
                {/* <Row className='d-flex justify-content-between fixed-middle' style={{ width: '100vw' }}>
                    <Col md={10}>
                    <div id='terminal' className='terminal'>
                    <div className='terminal-top'>
                        <span>Terminal</span>
                        <button id="exitButton" style={{ position: "relative", top: "0%", left: "45%", backgroundColor: "transparent", border: "none", outline: "none" }} onClick={exitTerminal}>X</button> 
                        <button id="exitButton" style={{ position: "relative", top: "0%", left: "40%", backgroundColor: "transparent", border: "none", outline: "none" }} onClick={expandTerminal}>+</button> 
                    </div>
                        <div id='terminal-content' className='terminal-content mt-5'>
                            <p style={{ fontSize: "2rem", backgroundColor: "transparent"}} id="text">Name</p>
                            <p style={{ fontSize: "1rem", backgroundColor: "transparent" }} id="description">zaiohe<span className='blink'>_</span></p>            
                        </div>
                    </div>
                    </Col>
                </Row>

                <div id="tip" className='tip'>
                    <p style={{ fontSize: "1rem", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "transparent" }}>Explore the map to learn more about my projects!</p>
                </div>
            </Container> */}
        </>
    )
}


export default App