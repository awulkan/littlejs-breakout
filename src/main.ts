'use strict';

import {
  engineInit,
  EngineObject,
  randColor,
  vec2,
  setCameraPos,
  setCanvasFixedSize,
  drawRect,
  cameraPos,
  Color,
  clamp,
  mousePos,
  Vector2,
  drawTextScreen,
  mainCanvasSize,
  Sound,
  mouseWasPressed,
  ParticleEmitter,
  TileInfo,
  max,
  min,
} from 'littlejsengine';

// Globals
const LEVEL_SIZE: Vector2 = vec2(38, 20);
let BALL: Ball | undefined;
let PADDLE: Paddle;
let SCORE: number = 0;
const SOUND_BOUNCE = new Sound([, , 1e3, , .03, .02, 1, 2, , , 940, .03, , , , , .2, .6, , .06], 0);
const SOUND_BREAK = new Sound([, , 90, , .01, .03, 4, , , , , , , 9, 50, .2, , .2, .01], 0);
const SOUND_START = new Sound([, 0, 500, , .04, .3, 1, 2, , , 570, .02, .02, , , , .04]);

class Wall extends EngineObject {
  constructor(pos: Vector2, size: Vector2) {
    super(pos, size); // set the object position and size.
    this.setCollision(); // make object collide.
    this.mass = 0; // make object have static physics.
    this.color = new Color(0, 0, 0, 0); // make object invisible.
  }
}

class Brick extends EngineObject {
  constructor(pos: Vector2, size: Vector2) {
    super(pos, size); // set the object position and size.
    this.setCollision(); // make object collide.
    this.mass = 0; // make object have static physics.
  }

  collideWithObject(_: EngineObject) {
    SOUND_BREAK.play(this.pos);
    // create explosion effect
    new ParticleEmitter(this.pos, 0, 0, 0.1, 100, 3.14, new TileInfo(this.pos), new Color(1, 1, 1, 1), new Color(1, 1, 1, 1), new Color(1, 1, 1, 0), new Color(1, 1, 1, 0), 0.5, 0.1, 1, 0.1, 0.05, 1, 1, 0, 3.14, 0.1, 0.2, false, false, true);
    this.destroy(); // destroy block when hit
    ++SCORE;
    return true;
  }
}

class Paddle extends EngineObject {
  maxRight = LEVEL_SIZE.x - this.size.x / 2;
  minLeft = this.size.x / 2;

  constructor() {
    super(vec2(0, 1), vec2(6, .5)); // set object position and size
    this.setCollision(); // make object collide
    this.mass = 0; // make object have static physics
  }

  update() {
    this.pos.x = clamp(mousePos.x, this.minLeft, this.maxRight);
  };
}

class Ball extends EngineObject {
  constructor(pos: Vector2) {
    super(pos, vec2(.5)); // set object position and size

    this.velocity = vec2(-.1, -.1);
    this.setCollision(); // make object collide
    this.elasticity = 1;
  }

  collideWithObject(object: EngineObject) {
    // prevent colliding with paddle if moving upwards
    if (object === PADDLE && this.velocity.y > 0) {
      return false;
    }

    // speed up ball
    const speed = min(1.01 * this.velocity.length(), .3);
    this.velocity = this.velocity.normalize(speed);
    console.log('speed', speed);

    SOUND_BOUNCE.play(this.pos, 1, speed); // play bounce sound

    if (object === PADDLE) {
      // control bounce angle when ball collides with paddle
      const deltaX = this.pos.x - PADDLE.pos.x;
      this.velocity = this.velocity.rotate(.3 * deltaX);

      // make sure ball is moving upwards with a minimum speed.
      this.velocity.y = max(-this.velocity.y, .2);

      // prevent default collision code
      return false;
    }

    return true; // allow object to collide
  }
}

function gameInit() {
  drawRect(cameraPos, vec2(100), new Color(.5, .5, .5));
  drawRect(cameraPos, LEVEL_SIZE, new Color(.1, .1, .1));

  // Create walls
  new Wall(vec2(-.5, LEVEL_SIZE.y / 2), vec2(1, 100)); // left wall
  new Wall(vec2(LEVEL_SIZE.x + .5, LEVEL_SIZE.y / 2), vec2(1, 100)); // right wall
  new Wall(vec2(LEVEL_SIZE.x / 2, LEVEL_SIZE.y + .5), vec2(100, 1)); // top wall

  // Create paddle
  PADDLE = new Paddle();

  // Create bricks
  // Use a 720p fixed size canvas
  setCanvasFixedSize(vec2(1280, 720));
  for (let x = 2; x <= LEVEL_SIZE.x - 2; x += 2) {
    for (let y = 12; y <= LEVEL_SIZE.y - 2; y += 1) {
      const brick = new Brick(vec2(x, y), vec2(2, 1));
      brick.color = randColor();
    }
  }

  setCameraPos(LEVEL_SIZE.scale(.5));
}

function gameUpdate() {
  // called every frame at 60 frames per second
  // handle input and update the game state

  if (BALL && BALL.pos.y < -1) {
    BALL.destroy();
    BALL = undefined;
  }
  if (!BALL && mouseWasPressed(0)) {
    BALL = new Ball(cameraPos);
    SOUND_START.play();
  }
}

function gameUpdatePost() {
  // called after physics and objects are updated
  // setup camera and prepare for render
}

function gameRender() {
  // called before objects are rendered
  // draw any background effects that appear behind objects
}

function gameRenderPost() {
  // called after objects are rendered
  // draw effects or hud that appear above all objects
  drawTextScreen(`Score ${SCORE}`, vec2(mainCanvasSize.x / 2, 70), 50); // show score
}

// Startup LittleJS Engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);