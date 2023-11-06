import { Sakura } from "@/utils/Turtle";
import { GUI } from "dat.gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { EffectComposer, RenderPass } from "postprocessing";

// scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const canvas = renderer.domElement;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// lights
const aLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
scene.add(aLight);

// gui commands
let settings = {
  autorotate: false,
};

// camera orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// turtle
const turtle = Sakura(4, camera, controls);
scene.add(turtle.group);

const gui = new GUI();
gui.add(settings, "autorotate");

function init() {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  resizeObserver.observe(renderer.domElement, { box: "content-box" });
  requestAnimationFrame(animate);
}

function animate() {
  //time) {
  // time *= 0.001; // convert time to seconds

  if (settings.autorotate) {
    turtle.group.rotation.y += 0.005;
  }

  requestAnimationFrame(animate);
  composer.render();
//   renderer.render(scene, camera);
}

function resizeCanvasToDisplaySize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  composer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(resizeCanvasToDisplaySize);

init();
