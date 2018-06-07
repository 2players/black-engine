/**
 * Pair is used for narrow test, and resolve collision within two colliders.
 *
 * @cat physics.arcade.pairs
 */

/* @echo EXPORT */
class Pair {

  /**
   * Creates new instance of Pair.
   */
  constructor() {

    /** @private @type {Collider|null} Collider from body A */
    this.a = null;

    /** @private @type {Collider|null} Collider from body B */
    this.b = null;

    /** @private @type {RigidBody|null} Parent of collider a */
    this.bodyA = null;

    /** @private @type {RigidBody|null} Parent of collider b */
    this.bodyB = null;

    /** @private @type {Boolean} Flag to indicate collision state */
    this.mInCollision = false;

    /** @private @type {Number} Cached normal impulse to apply in next iteration or frame if collision still exist */
    this.mNormalImpulse = 0;

    /** @private @type {Number} Cached tangent impulse to apply in next iteration or frame if collision still exist */
    this.mTangentImpulse = 0;

    /** @private @type {Number} Position impulse cache to use within iterations */
    this.mPositionImpulse = 0;

    /** @private @type {Number} This colliders cached friction */
    this.mFriction = 0;

    /** @private @type {Number} This colliders cached bounce factor */
    this.mBias = 0;

    /** @private @type {Number} This colliders cached inverse mass sum */
    this.mMass = 0;

    /** @private @type {Vector} Offset within the colliders on preSolve to correct overlap on each iteration */
    this.mOffset = new Vector();

    /** @private @type {Vector} Normal collision direction from a to b */
    this.mNormal = new Vector();

    /** @private @type {Number} Positive number. Penetration within colliders */
    this.mOverlap = 0;
  }

  /**
   * Setter
   *
   * @internal
   *
   * @param {Collider} a
   * @param {Collider} b
   * @param {RigidBody} bodyA
   * @param {RigidBody} bodyB
   *
   * return {Pair} This
   */
  set(a, b, bodyA, bodyB) {
    this.a = a;
    this.b = b;
    this.bodyA = bodyA;
    this.bodyB = bodyB;

    return this;
  }

  /**
   * Tests the collision state. Updates normal and overlap for solve
   *
   * @internal
   *
   * return {Boolean} This pair in collision flag
   */
  test() {
    return this.mInCollision;
  }

  /**
   * Prepares the solve properties depends on bodies physics characteristics and test result
   *
   * @internal
   *
   * return {void}
   */
  preSolve() {
    const normalX = this.mNormal.x;
    const normalY = this.mNormal.y;
    const tangentX = -normalY;
    const tangentY = +normalX;
    const positionA = this.bodyA.mPosition;
    const positionB = this.bodyB.mPosition;
    const velocityA = this.bodyA.mVelocity;
    const velocityB = this.bodyB.mVelocity;
    const invMassA = this.bodyA.mInvMass;
    const invMassB = this.bodyB.mInvMass;
    const offset = this.mOffset;

    const impulseX = this.mNormalImpulse * normalX + this.mTangentImpulse * tangentX;
    const impulseY = this.mNormalImpulse * normalY + this.mTangentImpulse * tangentY;

    offset.x = positionB.x - positionA.x;
    offset.y = positionB.y - positionA.y;

    velocityA.x -= impulseX * invMassA;
    velocityA.y -= impulseY * invMassA;

    velocityB.x += impulseX * invMassB;
    velocityB.y += impulseY * invMassB;

    const relVelX = velocityB.x - velocityA.x;
    const relVelY = velocityB.y - velocityA.y;
    const relVel = relVelX * normalX + relVelY * normalY;

    this.mBias = relVel < -Pair.bounceTrashhold ? -Math.max(this.bodyA.bounce, this.bodyB.bounce) * relVel : 0;
    this.mMass = 1 / (invMassA + invMassB);
    this.mFriction = Math.min(this.bodyA.friction, this.bodyB.friction);
    this.mPositionImpulse = 0;
  }

  /**
   * Updates the bodies velocities to solve collision
   *
   * @internal
   *
   * return {void}
   */
  solveVelocity() {
    const normalX = this.mNormal.x;
    const normalY = this.mNormal.y;
    const tangentX = -normalY;
    const tangentY = +normalX;
    const velocityA = this.bodyA.mVelocity;
    const velocityB = this.bodyB.mVelocity;
    const invMassA = this.bodyA.mInvMass;
    const invMassB = this.bodyB.mInvMass;

    {
      const relVelX = velocityB.x - velocityA.x;
      const relVelY = velocityB.y - velocityA.y;
      const relVel = relVelX * normalX + relVelY * normalY;
      let impulse = -(relVel - this.mBias) * this.mMass;
      const newImpulse = Math.max(this.mNormalImpulse + impulse, 0);
      impulse = newImpulse - this.mNormalImpulse;
      this.mNormalImpulse = newImpulse;

      const impulseX = impulse * normalX;
      const impulseY = impulse * normalY;

      velocityA.x -= impulseX * invMassA;
      velocityA.y -= impulseY * invMassA;

      velocityB.x += impulseX * invMassB;
      velocityB.y += impulseY * invMassB;
    }

    {
      const relVelX = velocityB.x - velocityA.x;
      const relVelY = velocityB.y - velocityA.y;
      const relVel = relVelX * tangentX + relVelY * tangentY;
      let impulse = -relVel * this.mMass;
      const maxFriction = this.mFriction * this.mNormalImpulse;
      const newImpulse = MathEx.clamp(this.mTangentImpulse + impulse, -maxFriction, maxFriction);
      impulse = newImpulse - this.mTangentImpulse;
      this.mTangentImpulse = newImpulse;

      const impulseX = impulse * tangentX;
      const impulseY = impulse * tangentY;

      velocityA.x -= impulseX * invMassA;
      velocityA.y -= impulseY * invMassA;

      velocityB.x += impulseX * invMassB;
      velocityB.y += impulseY * invMassB;
    }
  }

  /**
   * Updates the bodies positions to solve collision.
   *
   * @internal
   *
   * return {void}
   */
  solvePosition() {
    const normalX = this.mNormal.x;
    const normalY = this.mNormal.y;
    const invMassA = this.bodyA.mInvMass;
    const invMassB = this.bodyB.mInvMass;
    const positionA = this.bodyA.mPosition;
    const positionB = this.bodyB.mPosition;
    const offset = this.mOffset;

    const dx = offset.x - positionB.x + positionA.x;
    const dy = offset.y - positionB.y + positionA.y;

    const overlap = this.mOverlap + (dx * normalX + dy * normalY);
    const correction = (overlap - Pair.slop) * Pair.baumgarte;

    if (correction <= 0)
      return;

    let normalImpulse = correction * this.mMass;
    const impulsePrev = this.mPositionImpulse;
    this.mPositionImpulse = Math.max(impulsePrev + normalImpulse, 0);
    normalImpulse = this.mPositionImpulse - impulsePrev;

    const impulseX = normalImpulse * normalX;
    const impulseY = normalImpulse * normalY;

    positionA.x -= impulseX * invMassA;
    positionA.y -= impulseY * invMassA;

    positionB.x += impulseX * invMassB;
    positionB.y += impulseY * invMassB;
  }

  /**
   * Generates pair id.
   *
   * @internal
   * @param {Collider} a pair collider
   * @param {Collider} b pair collider
   *
   * return {String} Pair unique id
   */
  static __id(a, b) {
    return a.mId > b.mId ? `${a.mId}&${b.mId}` : `${b.mId}&${a.mId}`;
  }

  /**
   * Solving settings
   *
   * @public
   * @param {Number} [unitsPerMeter=1] To preserve physics reactions in different screen resolutions
   * @param {Number} [baumgarte=0.2] Baumgarte coefficient for position solve. From 0.2 to 0.8
   * @param {Number} [slop=0.5] Allowed overlap to skip position solve
   *
   * return {void}
   */
  static settings(unitsPerMeter = 1, baumgarte = 0.2, slop = 0.5) {
    Pair.slop = slop;
    Pair.baumgarte = baumgarte;
    Pair.unitsPerMeter = unitsPerMeter;
    Pair.bounceTrashhold = Pair.unitsPerMeter; // Pair.unitsPerMeter / 1.0
  }
}

Pair.settings();