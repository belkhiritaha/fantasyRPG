import { Component } from "react";
import * as THREE from "three";

interface CameraProps {
}

export default class Camera extends Component<CameraProps> {
  public camera: THREE.PerspectiveCamera;
  public raycaster: THREE.Raycaster;

  constructor(props: CameraProps) {
    super(props);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.rotation.order = "YXZ";
    this.camera.position.z = 5;
    this.raycaster = new THREE.Raycaster();
  }

  render() {
    return null;
  }
}
