import React, { useState, useEffect } from 'react';
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


interface Props {
    setMenu: (menu: string) => void;
    setClassType: (classType: string) => void;
    setUsername: (username: string) => void;
    username: string;
    classType: string;
}

const MainScreen: React.FC<Props> = ({ setMenu, setClassType, setUsername, username, classType }) => {
    const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(event.target.value);
    }

    const handleClassTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setClassType(event.target.value);
    }

    const handlePlayClick = () => {
        if (username === "") {
            alert("Please enter a username");
            return;
        }
        if (classType === "") {
            alert("Please select a class");
            return;
        }
        setMenu("game");
    }

    useEffect(() => {
        const warriorCanvas = document.getElementById("warrior") as HTMLCanvasElement;
        const rangerCanvas = document.getElementById("ranger") as HTMLCanvasElement;

        const warriorRenderer = new THREE.WebGLRenderer({ canvas: warriorCanvas, alpha: true });
        const rangerRenderer = new THREE.WebGLRenderer({ canvas: rangerCanvas, alpha: true });

        warriorRenderer.setSize(warriorCanvas.width, warriorCanvas.height);
        rangerRenderer.setSize(rangerCanvas.width, rangerCanvas.height);

        warriorRenderer.setClearColor(0x000000, 0);
        rangerRenderer.setClearColor(0x000000, 0);

        const warriorScene = new THREE.Scene();
        const rangerScene = new THREE.Scene();

        const warrioMixers: THREE.AnimationMixer[] = [];
        const rangerMixers: THREE.AnimationMixer[] = [];

        const warriorCamera = new THREE.PerspectiveCamera(75, warriorCanvas.width / warriorCanvas.height, 0.1, 1000);
        const rangerCamera = new THREE.PerspectiveCamera(75, rangerCanvas.width / rangerCanvas.height, 0.1, 1000);

        const warriorLight = new THREE.PointLight(0xffffff, 1);
        const rangerLight = new THREE.PointLight(0xffffff, 1);

        warriorLight.position.set(0, 0, 10);
        rangerLight.position.set(0, 0, 10);

        warriorScene.add(warriorLight);
        rangerScene.add(rangerLight);

        warriorCamera.position.z = 5;
        rangerCamera.position.z = 5;

        const warriorLoader = new GLTFLoader();
        const rangerLoader = new GLTFLoader();

        warriorLoader.load(
            "Knight.glb",
            (gltf) => {
                const model = gltf.scene;
                model.position.set(0, 0, 0);
                model.scale.set(1.5, 1.5, 1.5);
                const mixer = new THREE.AnimationMixer(model);
                warrioMixers.push(mixer);
                const action = mixer.clipAction(gltf.animations[3]);
                action.play();
                warriorScene.add(model);
            },
            undefined,
            (error) => {
                console.error(error);
            }
        );

        rangerLoader.load(
            "Rogue_Hooded.glb",
            (gltf) => {
                const model = gltf.scene;
                model.position.set(0, 0, 0);
                model.scale.set(1.5, 1.5, 1.5);
                const mixer = new THREE.AnimationMixer(model);
                rangerMixers.push(mixer);
                const action = mixer.clipAction(gltf.animations[15]);
                action.timeScale = 0.5;
                action.play();
                rangerScene.add(model);
            },
            undefined,
            (error) => {
                console.error(error);
            }
        );

        const warriorAnimate = () => {
            requestAnimationFrame(warriorAnimate);
            for (const mixer of warrioMixers) {
                mixer.update(0.01);
            }
            warriorRenderer.render(warriorScene, warriorCamera);
        }

        const rangerAnimate = () => {
            requestAnimationFrame(rangerAnimate);
            for (const mixer of rangerMixers) {
                mixer.update(0.01);
            }
            rangerRenderer.render(rangerScene, rangerCamera);
        }

        warriorAnimate();
        rangerAnimate();
    }, []);


    return (
        <>
            <style>{`
                body {
                    background-image: url('screenBG.png');
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-position: center;
                    background-attachment: fixed;
                }
                .container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .title {
                    font-size: 3rem;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 2px black;
                    position: absolute;
                    top: 10%;
                }
                .input {
                    width: 300px;
                    height: 50px;
                    border-radius: 10px;
                    border: none;
                    outline: none;
                    padding: 0 10px;
                    font-size: 1.5rem;
                    margin: 10px 0;
                }
                .play-btn {
                    width: 300px;
                    height: 50px;
                    border-radius: 10px;
                    border: none;
                    outline: none;
                    padding: 0 10px;
                    font-size: 1.5rem;
                    margin: 10px 0;
                    background-color: #2ecc71;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                }
                .play-btn:hover {
                    background-color: #27ae60;
                }
                .credits {
                    color: white;
                    font-size: 1rem;
                }
                .credits a {
                    color: white;
                }
                .types-3D-selector {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                    width: 100%;
                    margin: 10px 0;
                }
                .type-3D-title {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
                .type-3D-warrior {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
                .type-3D-ranger {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                }
                .type-3D-warrior p, .type-3D-ranger p {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 2px black;
                }

            `}</style>
            <div className="container" style={{width: "100vw", height: "100vh"}}>
                <div className="title">
                    <p>fantasyRPG</p>
                </div>
                <input className="input" type="text" placeholder="Username" value={username} onChange={handleUsernameChange} style={{ position: "absolute", top: "30%" }} />
                <div className="types-3D-selector" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                    <div className="type-3D-warrior" style={{border: classType === "warrior" ? "2px solid white" : "none", position: "relative"}} onClick={() => setClassType("warrior")} >
                        <canvas id="warrior" style={{position: "absolute", width: "100vw", height: "100vh", left: "0", translate: 'transform(-50%, -50%)'}}></canvas>
                        <p>Warrior</p>
                    </div>
                    <div className="type-3D-ranger" style={{border: classType === "ranger" ? "2px solid white" : "none", position: "relative"}} onClick={() => setClassType("ranger")} >
                        <canvas id="ranger" style={{position: "absolute", width: "100%", height: "50%", left: "50%", translate: 'transform(-50%, -50%)'}}></canvas>
                        <p>Ranger</p>
                    </div>
                    
                </div>
                <button className="play-btn" onClick={handlePlayClick} style={{ position: "absolute", bottom: "10%" }}>Play</button>
                <div className='credits' style={{ position: "absolute", bottom: "0%", left: "50%", transform: "translate(-50%, 0)" }}>
                    <p>Game by: <a href="https://www.github.com/belkhiritaha">Belkhiri Taha</a> and a lot of help from AI</p>
                    <p>Assets from: KayKit</p>
                </div>
            </div>
        </>
    );
}

export default MainScreen;