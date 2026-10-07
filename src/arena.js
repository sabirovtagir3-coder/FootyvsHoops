import * as THREE from 'three';

export function buildArena(scene, roundType) {
  // Clear previous field
  const toRemove = [];
  scene.traverse(child => {
    if (child.userData.isEnvironment) toRemove.push(child);
  });
  toRemove.forEach(obj => scene.remove(obj));

  const envGroup = new THREE.Group();
  envGroup.userData.isEnvironment = true;

  // Arena Dimensions
  const width = 36;
  const depth = 24;

  if (roundType === 1) {
    // FOOTBALL FIELD
    const pitchGeo = new THREE.PlaneGeometry(width, depth);
    const pitchMat = new THREE.MeshStandardMaterial({ color: 0x1d7c34, roughness: 0.8 });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    envGroup.add(pitch);

    // Goal Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const centerCircle = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
      new THREE.Path().absarc(0, 0, 4, 0, Math.PI * 2, true).getPoints(32)
    ), lineMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.02;
    envGroup.add(centerCircle);

    // Football Goals
    envGroup.add(createGoal(-width / 2, 0x00d2ff));
    envGroup.add(createGoal(width / 2, 0xff3366, true));

  } else if (roundType === 2) {
    // BASKETBALL COURT
    const courtGeo = new THREE.PlaneGeometry(width, depth);
    const courtMat = new THREE.MeshStandardMaterial({ color: 0xb35a20, roughness: 0.4 });
    const court = new THREE.Mesh(courtGeo, courtMat);
    court.rotation.x = -Math.PI / 2;
    court.receiveShadow = true;
    envGroup.add(court);

    // Basketball Hoops
    envGroup.add(createHoop(-width / 2 + 2, 0x00d2ff));
    envGroup.add(createHoop(width / 2 - 2, 0xff3366, true));

  } else {
    // FINAL CLASH (HYBRID)
    const hybridGeo = new THREE.PlaneGeometry(width, depth);
    const hybridMat = new THREE.MeshStandardMaterial({ color: 0x1a2130, roughness: 0.5 });
    const hybrid = new THREE.Mesh(hybridGeo, hybridMat);
    hybrid.rotation.x = -Math.PI / 2;
    hybrid.receiveShadow = true;
    envGroup.add(hybrid);

    // Football goals on ends
    envGroup.add(createGoal(-width / 2, 0x00d2ff));
    envGroup.add(createGoal(width / 2, 0xff3366, true));

    // Basketball Hoops on sides
    envGroup.add(createHoop(0, 0xffcc00, false, depth / 2 - 2, 0));
    envGroup.add(createHoop(0, 0xffcc00, false, -depth / 2 + 2, Math.PI));
  }

  // Border Barriers
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.2 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(width + 2, 1, 0.5), barrierMat);
  b1.position.set(0, 0.5, depth / 2);
  const b2 = b1.clone();
  b2.position.set(0, 0.5, -depth / 2);
  envGroup.add(b1, b2);

  scene.add(envGroup);
}

function createGoal(xPos, color, isRotated = false) {
  const goal = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color });

  const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3), mat);
  postL.position.set(0, 1.5, -3);
  const postR = postL.clone();
  postR.position.set(0, 1.5, 3);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 6), mat);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0, 3, 0);

  goal.add(postL, postR, bar);
  goal.position.x = xPos;
  if (isRotated) goal.rotation.y = Math.PI;
  return goal;
}

function createHoop(xPos, color, isRotated = false, zPos = 0, yRot = null) {
  const hoopGroup = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4.5), mat);
  pole.position.set(0, 2.25, 0);

  const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 2.2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  backboard.position.set(0.6, 4, 0);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0xff3300 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(1.3, 3.6, 0);
  hoopGroup.add(pole, backboard, rim);
  hoopGroup.position.set(xPos, 0, zPos);

  if (yRot !== null) {
    hoopGroup.rotation.y = yRot;
  } else if (isRotated) {
    hoopGroup.rotation.y = Math.PI;
  }
  return hoopGroup;
}