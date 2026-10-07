export class InputManager {
  constructor() {
    this.moveVector = { x: 0, z: 0 };
    this.isShooting = false;
    this.isTurbo = false;
    this.keys = {};

    this.initKeyboard();
    this.initTouch();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') this.isShooting = true;
      if (e.shiftKey) this.isTurbo = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') this.isShooting = false;
      if (!e.shiftKey) this.isTurbo = false;
    });
  }

  initTouch() {
    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    const btnShoot = document.getElementById('btn-shoot');
    const btnTurbo = document.getElementById('btn-turbo');

    if (!zone || !knob) return;

    let touchId = null;
    let startX = 0, startY = 0;
    const maxRadius = 40;

    zone.addEventListener('touchstart', (e) => {
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = zone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
      this.updateJoystick(touch.clientX, touch.clientY, startX, startY, maxRadius, knob);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          this.updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY, startX, startY, maxRadius, knob);
          break;
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          this.moveVector.x = 0;
          this.moveVector.z = 0;
          knob.style.transform = 'translate(-50%, -50%)';
          break;
        }
      }
    };

    window.addEventListener('touchend', endTouch);
    window.addEventListener('touchcancel', endTouch);

    btnShoot.addEventListener('touchstart', (e) => { e.preventDefault(); this.isShooting = true; });
    btnShoot.addEventListener('touchend', (e) => { e.preventDefault(); this.isShooting = false; });

    btnTurbo.addEventListener('touchstart', (e) => { e.preventDefault(); this.isTurbo = true; });
    btnTurbo.addEventListener('touchend', (e) => { e.preventDefault(); this.isTurbo = false; });
  }

  updateJoystick(clientX, clientY, cx, cy, maxRadius, knob) {
    let dx = clientX - cx;
    let dy = clientY - cy;
    let dist = Math.hypot(dx, dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    knob.style.transform = 'translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))';
    this.moveVector.x = dx / maxRadius;
    this.moveVector.z = dy / maxRadius;
  }

  getMovement() {
    let x = this.moveVector.x;
    let z = this.moveVector.z;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

    let len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }

    return { x, z, turbo: this.isTurbo };
  }
}