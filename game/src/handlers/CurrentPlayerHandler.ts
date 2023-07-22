import { Component } from "react";
import * as THREE from "three";
import Player from "../Player";

interface CurrentPlayerHandlerProps {
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    player: Player;
}

export default class CurrentPlayerHandler extends Component<CurrentPlayerHandlerProps> {
    

}
