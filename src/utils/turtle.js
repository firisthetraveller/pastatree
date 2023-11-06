// Source :
// https://github.com/gerizim16/3d-l-system-generator
// Slightly modified for external use

import * as THREE from "three";
import { Vector3 } from "three";
import { iterate } from "./lsystem.js";

function assignExisting(target, source) {
  Object.keys(source)
    .filter((key) => key in target)
    .forEach((key) => (target[key] = source[key]));
}

const defaults = Object.freeze({
  length: 0.2,
  angle: 25,
  radius: 0.05,
  size: 0.3,
});

/**
   * 
   * @param {number} iterations 
   * @param {THREE.Camera} camera 
   * @param {THREE.OrbitControls} controls 
   * @returns 
   */
export function Sakura(iterations, camera, controls) {
  let data = {
    axiom: "m{0x594d30, 0.9, 0} A{0.2}",
    productions:
      "A{r} -> l{0.2, r, r} +x +y +z [ [ A{r/2} ] -x A{r/2} ] -x -y -z l{0.2, r, r} [ -x l{0.2, r, r/2} A{r/2} m{0xf695c3, 0.7, 0} sphere ] +x A{r/2}\nl{a, b, c} -> l{a*2.5, b, c}\nl{a, b, c} -> l{a*2, b, c}\nsphere -> sphere{random()/7+0.1}",
  };

  let turtle = new Turtle();
  turtle.generate(
    iterate(data.axiom, data.productions, iterations),
    camera,
    controls
  );

  return turtle;
}

export class Turtle {
  scene;
  lights;
  material;
  materials;
  geometries;
  pos;
  dir;
  tension;
  radius;

  static defaults = defaults;

  constructor() {
    this.lights = [];
    this.group = new THREE.Group();
    this.anchor = this.group; // For naming purposes
    this.materials = [];
    this.geometries = [];

    this.defaults = Object.assign({}, Turtle.defaults);

    this.tmpVec = new Vector3();

    this.reset();
  }

  getPos() {
    return this.object.getWorldPosition(this.tmpVec);
  }

  getDir() {
    return this.object.getWorldDirection(this.tmpVec);
  }

  reset() {
    this.object = new THREE.Object3D();
    this.object.lookAt(new THREE.Vector3(0, 1, 0));
    this.tension = 0.5;
    this.radius = this.defaults.radius;
    this.stack = [];
    this.currentCurve = [];

    this.lights.forEach((element) => element.dispose());
    this.materials.forEach((element) => element.dispose());
    this.geometries.forEach((element) => element.dispose());

    this.lights = [];
    this.group.children = [];
    this.materials = [];
    this.geometries = [];

    this.resetMaterial();
    return this;
  }

  resetMaterial() {
    this.setMaterial();
    return this;
  }

  setDefaults(new_defaults = {}) {
    assignExisting(this.defaults, new_defaults);
    return this;
  }

  setMaterial(
    color = 0xffffff,
    roughness = 0.1,
    metalness = 0.1,
    flatShading = false,
    fog = true,
    wireframe = false,
    transparent = false,
    opacity = 1,
    side = 0
  ) {
    const s = [THREE.FrontSide, THREE.BackSide, THREE.DoubleSide];
    this.material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      flatShading,
      fog,
      wireframe,
      transparent,
      opacity,
      side: s[side],
    });
    this.materials.push(this.material);
    return this;
  }

  setTension(tension = 0.5) {
    this.tension = tension;
    return this;
  }

  setRadius(radius = this.defaults.radius) {
    this.radius = radius;
    return this;
  }

  forward(length = this.defaults.length) {
    this.object.translateZ(length);
    // this.getPos().addScaledVector(this.getDir(), length);
    if (this.drawing) this.currentCurve.push(this.getPos().clone());
    return this;
  }

  // rotate(axis, angle) {
  //   this.getDir().applyAxisAngle(axis, angle);
  //   return this;
  // }

  rotateX(angle = this.defaults.angle) {
    this.object.rotateX(THREE.MathUtils.degToRad(angle));
    // this.rotate(new THREE.Vector3(1, 0, 0), angle);
    return this;
  }

  rotateY(angle = this.defaults.angle) {
    this.object.rotateY(THREE.MathUtils.degToRad(angle));
    // this.rotate(new THREE.Vector3(0, 1, 0), angle);
    return this;
  }

  rotateZ(angle = this.defaults.angle) {
    this.object.rotateZ(THREE.MathUtils.degToRad(angle));
    // this.rotate(new THREE.Vector3(0, 0, 1), angle);
    return this;
  }

  startLine() {
    if (this.drawing) return this;
    this.drawing = true;
    this.currentCurve.push(this.getPos().clone());
    return this;
  }

  endLine() {
    if (!this.drawing) return this;
    this.drawing = false;
    if (this.currentCurve.length <= 1) {
      this.currentCurve.length = 0;
      return this;
    }
    const curve = new THREE.CatmullRomCurve3(
      this.currentCurve,
      false,
      "catmullrom",
      this.tension
    );

    const tubularSegments = this.currentCurve.length * 5;

    const geometry = new THREE.TubeGeometry(
      curve,
      tubularSegments,
      this.radius,
      8,
      false
    );
    this.geometries.push(geometry);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);

    this.currentCurve.length = 0;
    return this;
  }

  line(
    length = this.defaults.length,
    startR = this.radius,
    endR = this.radius
  ) {
    const geometry = new THREE.CylinderGeometry(endR, startR, length);
    this.geometries.push(geometry);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.lookAt(this.getDir());
    mesh.geometry.rotateX(Math.PI / 2);
    mesh.position.copy(this.getPos());
    mesh.geometry.translate(0, 0, length / 2);
    this.group.add(mesh);

    this.forward(length);
    return this;
  }

  push() {
    if (this.drawing) {
      this.endLine();
      this.startLine();
    }
    this.stack.push({
      object: this.object.clone(false),
      // pos: this.getPos().clone(),
      // dir: this.getDir().clone(),
      material: this.material,
      tension: this.tension,
      radius: this.radius,
    });
    return this;
  }

  pop() {
    if (this.drawing) {
      this.endLine();
      this.startLine();
    }
    const x = this.stack.pop();
    if (!x) return this;
    Object.assign(this, x);
    return this;
  }

  sphere(
    radius = this.defaults.size / 2,
    widthSeg = 12,
    heightSeg = 6,
    ...args
  ) {
    const geometry = new THREE.SphereGeometry(
      radius,
      widthSeg,
      heightSeg,
      ...args
    );
    this.geometries.push(geometry);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.geometry.rotateX(Math.PI / 2);
    mesh.lookAt(this.getDir());
    mesh.position.copy(this.getPos());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);

    return this;
  }

  box(
    width = this.defaults.size,
    height = this.defaults.size,
    depth = this.defaults.size,
    ...args
  ) {
    const geometry = new THREE.BoxGeometry(width, height, depth, ...args);
    this.geometries.push(geometry);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.lookAt(this.getDir());
    mesh.position.copy(this.getPos());
    this.group.add(mesh);

    return this;
  }

  cube(side = this.defaults.size, ...args) {
    this.box(side, side, side, ...args);
    return this;
  }

  cone(radius = this.defaults.size / 2, height = this.defaults.size, ...args) {
    const geometry = new THREE.ConeGeometry(radius, height, ...args);
    this.geometries.push(geometry);

    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.geometry.rotateX(Math.PI / 2);
    mesh.lookAt(this.getDir());
    mesh.position.copy(this.getPos());
    this.group.add(mesh);

    return this;
  }

  do(command) {
    switch (command.sym) {
      case "+x":
        this.rotateX(command.params[0]);
        break;
      case "-x":
        this.rotateX(-(command.params[0] ?? this.defaults.angle));
        break;
      case "+y":
        this.rotateY(command.params[0]);
        break;
      case "-y":
        this.rotateY(-(command.params[0] ?? this.defaults.angle));
        break;
      case "+z":
        this.rotateZ(command.params[0]);
        break;
      case "-z":
        this.rotateZ(-(command.params[0] ?? this.defaults.angle));
        break;
      case "f":
        this.forward(...command.params);
        break;
      case "s":
        this.startLine();
        break;
      case "e":
        this.endLine();
        break;
      case "l":
        this.line(...command.params);
        break;
      case "[":
        this.push();
        break;
      case "]":
        this.pop();
        break;
      case "sphere":
        this.sphere(...command.params);
        break;
      case "box":
        this.box(...command.params);
        break;
      case "cube":
        this.cube(...command.params);
        break;
      case "cone":
        this.cone(...command.params);
        break;
      case "r":
        this.setRadius(...command.params);
        break;
      case "t":
        this.setTension(...command.params);
        break;
      case "m":
        this.setMaterial(...command.params);
        break;

      default:
        break;
    }
  }

  generate(commands, camera, controls) {
    this.setDefaults(Turtle.defaults);

    this.reset();
    for (const command of commands) {
      this.do(command);
    }
    this.group.rotation.y = THREE.MathUtils.degToRad(0);

    // bounding box
    const aabb = new THREE.Box3().setFromObject(this.group);
    const target = new THREE.Vector3();
    aabb.getCenter(target);
    target.setX(0);
    camera.position.set(0, target.y, -15);
    controls.target.copy(target);
    controls.update();
  }
}
