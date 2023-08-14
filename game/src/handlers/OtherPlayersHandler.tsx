import { Component } from "react";
import * as THREE from "three";
import Enemy from "../Enemy";

interface OtherPlayersHandlerProps {
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
}

export default class OtherPlayersHandler extends Component<OtherPlayersHandlerProps> {
    public otherPlayers: { [id: string]: Enemy } = {};

    addPlayer(id: string, position: THREE.Vector3, classType: string, hp: number) {
        this.otherPlayers[id] = new Enemy({ scene: this.props.scene, position: position, classType: classType, hp: hp });
        this.props.scene.add(this.otherPlayers[id].character.gltf);
    }

    removePlayer(id: string) {
        console.log("Removing player:", id);
        this.otherPlayers[id].removeFromScene();
        delete this.otherPlayers[id];
    }
}
