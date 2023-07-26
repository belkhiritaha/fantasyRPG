import { Component } from "react";
import * as THREE from "three";
import Player from "../Player";
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Font } from 'three/examples/jsm/loaders/FontLoader';
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

interface HitTextProps {
    position: THREE.Vector3;
    scene: THREE.Scene;
}

export default class HitText extends Component<HitTextProps> {
    public mixer: THREE.AnimationMixer;
    
    public hitText: THREE.Mesh;

    public hitAction: THREE.AnimationAction;
    public fadeOutAction: THREE.AnimationAction;

    public finished = false;



    constructor(props: HitTextProps) {
        super(props);
        const loader = new FontLoader();
        loader.load(
            'fonts/BreatheFire.json',
            (font: Font) => {
                const textGeometry = new TextGeometry('Hit!', {
                    font: font,
                    size: 1,
                    height: 0.1,
                    curveSegments: 4,
                    // bevelEnabled: true,
                    // bevelThickness: 0.1,
                    // bevelSize: 0.1,
                    // bevelOffset: 0,
                    // bevelSegments: 5
                });
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                this.hitText = new THREE.Mesh(textGeometry, textMaterial);
                this.hitText.position.copy(this.props.position);
                this.props.scene.add(this.hitText);
                this.mixer = new THREE.AnimationMixer(this.hitText);

                // create animations (no animations in this model)
                const bobbleKeyframes = [
                    this.props.position.x, this.props.position.y, this.props.position.z,
                    this.props.position.x, this.props.position.y + 5, this.props.position.z,
                ];
                const bobbleTrack = new THREE.VectorKeyframeTrack('.position', [0, 3], bobbleKeyframes);
                const bobbleClip = new THREE.AnimationClip('bobble', -1, [bobbleTrack, bobbleTrack]);
                const bobbleAction = this.mixer.clipAction(bobbleClip);
                bobbleAction.loop = THREE.LoopOnce;
                bobbleAction.setDuration(0.1);
                bobbleAction.clampWhenFinished = true;
                bobbleAction.play();
                this.hitAction = this.hitAction;

                const fadeOutKeyframes = [
                    1, 1,
                    0, 0
                ];
                const fadeOutTrack = new THREE.NumberKeyframeTrack('.material.opacity', [0, 3], fadeOutKeyframes);
                const fadeOutClip = new THREE.AnimationClip('fadeOut', -1, [fadeOutTrack, fadeOutTrack]);
                const fadeOutAction = this.mixer.clipAction(fadeOutClip);
                fadeOutAction.loop = THREE.LoopOnce;
                fadeOutAction.setDuration(0.1);
                fadeOutAction.clampWhenFinished = true;
                fadeOutAction.play();
                this.fadeOutAction = fadeOutAction;
            }
        );
    }

    update(deltaTime: number) {
        this.mixer?.update(deltaTime);
        if ((this.hitText?.material as THREE.Material)) {
            (this.hitText?.material as THREE.Material).opacity -= deltaTime;
            if ((this.hitText?.material as THREE.Material).opacity <= 0) {
                this.finished = true;
            }
        }
        this.fadeOutAction?.play();
        this.hitAction?.play();
    }

    removeFromScene() {
        this.props.scene.remove(this.hitText);
    }

    render() {
        return null;
    }
}
