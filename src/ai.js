export class SimpleAI {
  constructor(mesh, isFooty) {
    this.mesh = mesh;
    this.isFooty = isFooty;
    this.speed = 4.8;
  }

  update(delta, ball, targetGoalPos) {
    if (!ball || !this.mesh) return false;

    const myPos = this.mesh.position;
    const ballPos = ball.mesh.position;
    const distToBall = myPos.distanceTo(ballPos);

    let wantShoot = false;

    if (distToBall > 1.2) {
      // Подбегаем к мячу
      const dir = ballPos.clone().sub(myPos).normalize();
      myPos.x += dir.x * this.speed * delta;
      myPos.z += dir.z * this.speed * delta;
      this.mesh.lookAt(ballPos.x, myPos.y, ballPos.z);
    } else {
      // С мячом: целимся в чужую цель
      const dirToTarget = targetGoalPos.clone().sub(myPos).normalize();
      myPos.x += dirToTarget.x * (this.speed * 0.7) * delta;
      myPos.z += dirToTarget.z * (this.speed * 0.7) * delta;
      this.mesh.lookAt(targetGoalPos.x, myPos.y, targetGoalPos.z);

      // Бьем при достаточной близости или случайности
      if (myPos.distanceTo(targetGoalPos) < 14) {
        wantShoot = true;
      }
    }

    return wantShoot;
  }
}