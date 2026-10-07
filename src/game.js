import * as THREE from 'three';
import { buildArena } from './arena.js';
import { SimpleAI } from './ai.js';

export class GameManager {
  constructor(input, onScoreUpdate, onRoundEnd, onMatchEnd) {
    this.input = input;
    this.onScoreUpdate = onScoreUpdate;
    this.onRoundEnd = onRoundEnd;
    this.onMatchEnd = onMatchEnd;

    this.round = 1;
    this.playerScore = 0;
    this.aiScore = 0;
    this.playerTeam = 'FOOTY';
    this.roundTime = 45;
    this.isPaused = false;
    this.isMatchRunning = false;

    this.initThree();
    this.balls = [];
    this.animTime = 0;
  }

  initThree() {
    this.canvas = document.getElementById('webgl-canvas');
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e17);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 16, 22);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(12, 22, 10);
    sun.castShadow = true;
    this.scene.add(ambient, sun);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.clock = new THREE.Clock();
  }

  startMatch(playerTeam) {
    this.playerTeam = playerTeam;
    this.round = 1;
    this.playerScore = 0;
    this.aiScore = 0;
    this.startRound(1);
  }

  startRound(roundNum) {
    this.round = roundNum;
    this.roundTime = 45;
    this.isPaused = false;
    this.isMatchRunning = true;

    buildArena(this.scene, roundNum);
    this.spawnEntities();
    this.onScoreUpdate(this.playerScore, this.aiScore, this.round, this.roundTime);
  }

  createHumanAthlete(jerseyColor, skinColor = 0xf0c299) {
    const root = new THREE.Group();
    const matJersey = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.4 });
    const matSkin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x1f2430 });

    // Торс (майка)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), matJersey);
    torso.position.y = 1.35;
    root.add(torso);

    // Голова
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), matSkin);
    head.position.y = 2.05;
    root.add(head);

    // Волосы / повязка
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.58), matDark);
    hair.position.y = 2.22;
    root.add(hair);

    // Руки
    const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.65, 8);
    const armL = new THREE.Mesh(armGeo, matSkin);
    armL.position.set(-0.48, 1.3, 0);
    const armR = new THREE.Mesh(armGeo, matSkin);
    armR.position.set(0.48, 1.3, 0);
    root.add(armL, armR);

    // Ноги
    const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.75, 8);
    const legL = new THREE.Mesh(legGeo, matJersey);
    legL.position.set(-0.22, 0.55, 0);
    const legR = new THREE.Mesh(legGeo, matJersey);
    legR.position.set(0.22, 0.55, 0);
    root.add(legL, legR);

    // Прицельная стрелка на полу
    const arrowGeo = new THREE.ConeGeometry(0.25, 0.7, 3);
    arrowGeo.rotateX(Math.PI / 2);
    const arrowMat = new THREE.MeshBasicMaterial({ color: jerseyColor, transparent: true, opacity: 0.8 });
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.position.set(0, 0.05, 1.2);
    root.add(arrow);

    root.userData = { armL, armR, legL, legR, arrow };
    return root;
  }

  spawnEntities() {
    if (this.playerMesh) this.scene.remove(this.playerMesh);
    if (this.aiMesh) this.scene.remove(this.aiMesh);
    this.balls.forEach(b => this.scene.remove(b.mesh));
    this.balls = [];

    const isPlayerFooty = this.playerTeam === 'FOOTY';
    const playerColor = isPlayerFooty ? 0x00d2ff : 0xff8c00;
    const aiColor = isPlayerFooty ? 0xff8c00 : 0x00d2ff;

    this.playerMesh = this.createHumanAthlete(playerColor, 0xffd1a4);
    this.playerMesh.position.set(-6, 0, 0);
    this.scene.add(this.playerMesh);

    this.aiMesh = this.createHumanAthlete(aiColor, 0xd89562);
    this.aiMesh.position.set(6, 0, 0);
    this.aiMesh.userData.arrow.visible = false; // стрелка только для игрока
    this.scene.add(this.aiMesh);

    this.aiController = new SimpleAI(this.aiMesh, !isPlayerFooty);

    if (this.round === 1) {
      this.balls.push(this.createSoccerBall(new THREE.Vector3(0, 0.45, 0)));
    } else if (this.round === 2) {
      this.balls.push(this.createBasketball(new THREE.Vector3(0, 0.5, 0)));
    } else {
      this.balls.push(this.createSoccerBall(new THREE.Vector3(-2, 0.45, 0)));
      this.balls.push(this.createBasketball(new THREE.Vector3(2, 0.5, 0)));
    }
  }

  createSoccerBall(pos) {
    const geo = new THREE.SphereGeometry(0.42, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    this.scene.add(mesh);

    return { type: 'football', mesh, vel: new THREE.Vector3(), isAttachedTo: null, inAir: false };
  }

  createBasketball(pos) {
    const geo = new THREE.SphereGeometry(0.5, 16, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xe65c00, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true;
    this.scene.add(mesh);

    return { type: 'basketball', mesh, vel: new THREE.Vector3(), isAttachedTo: null, inAir: false };
  }

  animateLegs(charMesh, speedFactor) {
    if (!charMesh?.userData?.legL) return;
    const angle = Math.sin(this.animTime * 12) * speedFactor * 0.6;
    charMesh.userData.legL.rotation.x = angle;
    charMesh.userData.legR.rotation.x = -angle;
    charMesh.userData.armL.rotation.x = -angle;
    charMesh.userData.armR.rotation.x = angle;
  }

  update() {
    requestAnimationFrame(() => this.update());
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.isMatchRunning || this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    this.animTime += delta;

    this.roundTime -= delta;
    if (this.roundTime <= 0) {
      this.handleRoundFinish();
      return;
    }
    this.onScoreUpdate(this.playerScore, this.aiScore, this.round, Math.ceil(this.roundTime));

    // Player Move
    const move = this.input.getMovement();
    const speed = move.turbo ? 9 : 5.8;
    const isMoving = move.x !== 0 || move.z !== 0;

    this.playerMesh.position.x += move.x * speed * delta;
    this.playerMesh.position.z += move.z * speed * delta;
    this.playerMesh.position.x = THREE.MathUtils.clamp(this.playerMesh.position.x, -16.5, 16.5);
    this.playerMesh.position.z = THREE.MathUtils.clamp(this.playerMesh.position.z, -10.5, 10.5);

    if (isMoving) {
      this.playerMesh.rotation.y = Math.atan2(move.x, move.z);
      this.animateLegs(this.playerMesh, 1);
    } else {
      this.animateLegs(this.playerMesh, 0);
    }

    // Camera follow
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.playerMesh.position.x * 0.45, 0.05);
    this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, this.playerMesh.position.z * 0.35 + 17, 0.05);

    // AI
    const activeBall = this.balls[0];
    const aiTargetGoal = new THREE.Vector3(-18, 0, 0);
    const aiShoot = this.aiController.update(delta, activeBall, aiTargetGoal);
    this.animateLegs(this.aiMesh, 0.8);

    // Ball physics & Goals
    this.balls.forEach(ball => {
      this.handleBallPhysics(ball, delta);
      this.checkGoal(ball);
    });

    // Shooting
    if (this.input.isShooting) {
      this.shootBall(this.playerMesh, 20);
    }
    if (aiShoot) {
      this.shootBall(this.aiMesh, 18);
    }

    this.renderer.render(this.scene, this.camera);
  }

  handleBallPhysics(ball, delta) {
    const pDist = ball.mesh.position.distanceTo(this.playerMesh.position);
    const aiDist = ball.mesh.position.distanceTo(this.aiMesh.position);

    // Дриблинг (подбор мяча возможен, только если мяч не летит на высокой скорости от удара)
    if (!ball.isAttachedTo && !ball.inAir) {
      if (pDist < 1.3) ball.isAttachedTo = 'player';
      else if (aiDist < 1.3) ball.isAttachedTo = 'ai';
    }

    if (ball.isAttachedTo === 'player') {
      const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerMesh.rotation.y);
      ball.mesh.position.copy(this.playerMesh.position).add(fwd.multiplyScalar(0.9));
      ball.mesh.position.y = ball.type === 'basketball' ? 0.7 : 0.42;
      ball.vel.set(0, 0, 0);
    } else if (ball.isAttachedTo === 'ai') {
      const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.aiMesh.rotation.y);
      ball.mesh.position.copy(this.aiMesh.position).add(fwd.multiplyScalar(0.9));
      ball.mesh.position.y = ball.type === 'basketball' ? 0.7 : 0.42;
      ball.vel.set(0, 0, 0);
    } else {
      // Свободный полет с гравитацией
      ball.mesh.position.addScaledVector(ball.vel, delta);

      if (ball.inAir) {
        ball.vel.y -= 18 * delta; // Гравитация
        if (ball.mesh.position.y <= 0.45) {
          ball.mesh.position.y = 0.45;
          ball.vel.y = -ball.vel.y * 0.4; // Отскок
          if (Math.abs(ball.vel.y) < 1) {
            ball.vel.y = 0;
            ball.inAir = false;
          }
        }
      }

      ball.vel.x *= 0.97;
      ball.vel.z *= 0.97;

      // Стены
      if (Math.abs(ball.mesh.position.x) > 17.5) {
        ball.vel.x *= -0.7;
        ball.mesh.position.x = Math.sign(ball.mesh.position.x) * 17.4;
      }
      if (Math.abs(ball.mesh.position.z) > 11.5) {
        ball.vel.z *= -0.7;
        ball.mesh.position.z = Math.sign(ball.mesh.position.z) * 11.4;
      }
    }
  }

  shootBall(character, power) {
    this.balls.forEach(ball => {
      const isCarrier = (character === this.playerMesh && ball.isAttachedTo === 'player') ||
                        (character === this.aiMesh && ball.isAttachedTo === 'ai');
      if (isCarrier) {
        ball.isAttachedTo = null;
        ball.inAir = true;

        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), character.rotation.y);

        if (ball.type === 'basketball') {
          // Бросок навесом в сторону кольца
          ball.vel.copy(forward.multiplyScalar(power * 0.85));
          ball.vel.y = 8.5; // Высокая параболическая траектория
        } else {
          // Плотный удар низом с легким подъемом
          ball.vel.copy(forward.multiplyScalar(power));
          ball.vel.y = 2.2;
        }
      }
    });
  }

  checkGoal(ball) {
    // Гол засчитывается ТОЛЬКО если мяч летит в отрыве от игрока
    if (ball.isAttachedTo) return;

    const pos = ball.mesh.position;
    let scored = false;

    if (ball.type === 'football') {
      // Правые ворота (забивает игрок)
      if (pos.x >= 17 && Math.abs(pos.z) < 3.2 && pos.y < 3.2) {
        scored = true;
        this.playerScore += 1;
      }
      // Левые ворота (забивает ИИ)
      else if (pos.x <= -17 && Math.abs(pos.z) < 3.2 && pos.y < 3.2) {
        scored = true;
        this.aiScore += 1;
      }
    } else if (ball.type === 'basketball') {
      // Правое кольцо (x = 16, y = 3.6): попадание сверху вниз
      if (pos.x >= 14.5 && pos.x <= 17.5 && Math.abs(pos.z) < 1.6 && pos.y <= 3.8 && ball.vel.y < 0) {
        scored = true;
        this.playerScore += 2;
      }
      // Левое кольцо
      else if (pos.x <= -14.5 && pos.x >= -17.5 && Math.abs(pos.z) < 1.6 && pos.y <= 3.8 && ball.vel.y < 0) {
        scored = true;
        this.aiScore += 2;
      }
    }

    if (scored) {
      this.resetRoundEntities();
    }
  }

  resetRoundEntities() {
    this.balls.forEach(b => {
      b.mesh.position.set(0, 0.5, 0);
      b.vel.set(0, 0, 0);
      b.isAttachedTo = null;
      b.inAir = false;
    });
    this.playerMesh.position.set(-6, 0, 0);
    this.playerMesh.rotation.y = Math.PI / 2;
    this.aiMesh.position.set(6, 0, 0);
    this.aiMesh.rotation.y = -Math.PI / 2;
  }

  handleRoundFinish() {
    this.isMatchRunning = false;
    if (this.round < 3) {
      this.onRoundEnd(this.round, this.playerScore, this.aiScore, () => {
        this.startRound(this.round + 1);
      });
    } else {
      this.onMatchEnd(this.playerScore, this.aiScore);
    }
  }
}