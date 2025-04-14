// Global variables
let gameState = "start";
let backgroundImg, playerImg, powerUpImg;
let enemyImages = [];
let bg, player;
let enemies = [];
let playerBullets = [];
let enemyBullets = [];
let explosions = [];
let powerUps = [];
let score = 0;
let highScore = 0; // Add high score tracking
let lives = 5; // Increased to 5 lives
let difficulty = 0;
let lastWaveTime = 0;
let waveInterval = 5000; // 5 seconds between waves
let isIndestructible = false; // Add indestructible mode flag
let gameOverTime = 0; // Time when game over started
let powerUpActive = false; // Track if power-up is active
let powerUpStartTime = 0; // When the power-up was activated
let powerUpDuration = 30000; // 30 seconds in milliseconds (changed from 60000)
let shouldSpawnPowerUp = false; // Flag to track if we should spawn a power-up
let powerUpWaveThreshold = 6; // Wave number when power-up should spawn
let powerUpSpawned = false; // Track if we've spawned the power-up for this level
let victoryTime = 0; // Time when victory started
let victoryDuration = 5000; // 5 seconds for victory screen
let fireworks = []; // Array to store fireworks

// Level progression variables
let currentLevel = 1;
let maxLevel = 100; // Changed from 4 to 100 to effectively disable the victory screen
let backgroundImages = [];
let bossDefeated = false;
let levelTransitionTime = 0;
let levelTransitionDelay = 2000; // 2 second delay before transition starts
let levelTransitionDuration = 3000; // 3 seconds for level transition
let gameOverDuration = 5000; // 5 seconds for game over screen

// Music variables
let levelMusic = [];
let currentMusic;

// Level transition variables
let levelTransition = null; // Instance of LevelTransition
let isTransitioning = false; // Flag to track if we're in a transition
let transitionStarted = false; // Flag to track if we've started the transition after delay

// Class to handle level transitions with fade effects
class LevelTransition {
  constructor(oldBackground, newBackground) {
    this.oldBackground = oldBackground;
    this.newBackground = newBackground;
    this.fadeOutStartTime = millis();
    this.fadeInStartTime = 0;
    this.fadeDuration = 1000; // 1 second for each fade
    this.state = "fadeOut"; // States: fadeOut, fadeIn
    this.alpha = 0;
  }
  
  update() {
    let currentTime = millis();
    
    if (this.state === "fadeOut") {
      // Calculate fade out progress (0 to 255)
      this.alpha = map(currentTime - this.fadeOutStartTime, 0, this.fadeDuration, 0, 255);
      
      if (currentTime - this.fadeOutStartTime >= this.fadeDuration) {
        // Switch to fade in
        this.state = "fadeIn";
        this.fadeInStartTime = currentTime;
        this.alpha = 255;
      }
    } else if (this.state === "fadeIn") {
      // Calculate fade in progress (255 to 0)
      this.alpha = map(currentTime - this.fadeInStartTime, 0, this.fadeDuration, 255, 0);
      
      if (currentTime - this.fadeInStartTime >= this.fadeDuration) {
        return true; // Transition complete
      }
    }
    
    return false; // Transition still in progress
  }
  
  render() {
    if (this.state === "fadeOut") {
      // Draw old background
      this.oldBackground.render();
    } else {
      // Draw new background
      this.newBackground.render();
    }
    
    // Draw fade overlay
    noStroke();
    fill(0, this.alpha);
    rect(0, 0, width, height);
  }
}

// Make enemies array accessible globally for enemy spawning logic
window.enemies = enemies;

// Preload assets
function preload() {
  // Load background images for each level
  backgroundImages[0] = loadImage('assets/background_level1.jpg');
  backgroundImages[1] = loadImage('assets/background_level2.jpg');
  backgroundImages[2] = loadImage('assets/background_level3.jpg');
  backgroundImages[3] = loadImage('assets/background_level4.jpg');
  
  // Set initial background
  backgroundImg = backgroundImages[0];
  
  playerImg = loadImage('assets/player.png');
  powerUpImg = loadImage('assets/power-up.png');
  
  // Load regular enemy images
  enemyImages[0] = loadImage('assets/regular_enemy_1.png'); // Type 1
  enemyImages[1] = loadImage('assets/regular_enemy_2.png'); // Type 2
  enemyImages[2] = loadImage('assets/regular_enemy_3.png'); // Type 3
  enemyImages[3] = loadImage('assets/regular_enemy_4.png'); // Type 4
  enemyImages[4] = loadImage('assets/regular_enemy_5.png'); // Type 5
  enemyImages[5] = loadImage('assets/regular_enemy_6.png'); // Type 6
  
  // Load boss images for each level
  enemyImages[6] = loadImage('assets/boss_level1.png'); // Level 1 Boss
  enemyImages[7] = loadImage('assets/boss_level2.png'); // Level 2 Boss
  enemyImages[8] = loadImage('assets/boss_level3.png'); // Level 3 Boss
  enemyImages[9] = loadImage('assets/boss_level4.png'); // Level 4 Boss
  
  // Load music for each level
  levelMusic[0] = loadSound('assets/level_1.mp3');
  levelMusic[1] = loadSound('assets/level_2.mp3');
  levelMusic[2] = loadSound('assets/level_3.mp3');
  levelMusic[3] = loadSound('assets/level_4.mp3');
  
  // Note: If any image or sound fails to load, p5.js will show a warning
  // and use a default empty image or sound. You can add error handling if needed.
}

// Setup function
function setup() {
  createCanvas(800, 600);
  frameRate(60);
  bg = new Background(backgroundImg);
  player = new PlayerShip(playerImg);
  lastWaveTime = millis();
  lives = 5; // Ensure lives is set to 5
}

// Background class for scrolling
class Background {
  constructor(image) {
    this.image = image;
    // Make the background just 5% taller than the canvas
    this.displayHeight = height * 1.05;
    // Maintain aspect ratio for width
    this.displayWidth = (this.image.width / this.image.height) * this.displayHeight;
    this.x = 0;
    // Y position of the background (will change based on player position)
    this.y = -this.displayHeight * 0.025; // Start with top 2.5% off-screen
    this.speed = 1;
  }

  update() {
    // Horizontal scrolling
    this.x -= this.speed;
    if (this.x <= -this.displayWidth) {
      this.x += this.displayWidth;
    }
    
    // Vertical parallax based on player position
    if (player) {
      // Calculate how far the player is from the center of the screen (as a percentage)
      let playerVerticalPosition = player.pos.y / height;
      
      // Map player position (0-1) to background position
      // When player is at top (0), background should show top (0%)
      // When player is at center (0.5), background should be at -2.5%
      // When player is at bottom (1), background should show bottom (-5%)
      this.y = map(playerVerticalPosition, 0, 1, 0, -this.displayHeight * 0.05);
    }
  }

  render() {
    // Draw the horizontally scrolling background with vertical parallax
    image(this.image, this.x, this.y, this.displayWidth, this.displayHeight);
    image(this.image, this.x + this.displayWidth, this.y, this.displayWidth, this.displayHeight);
  }
}

// PlayerShip class
class PlayerShip {
  constructor(image) {
    this.pos = createVector(100, height / 2);
    this.vel = createVector(0, 0); // Add velocity vector for inertia
    this.image = image;
    this.displayWidth = 80; // Increased from 64
    this.displayHeight = 80; // Increased from 64
    this.hitboxWidth = 65; // Increased from 50
    this.hitboxHeight = 65; // Increased from 50
    this.speed = 5;
    this.maxSpeed = 8; // Maximum speed
    this.friction = 0.9; // Friction coefficient (0-1) - lower means more friction
    this.acceleration = 0.8; // Acceleration rate
    this.normalShootInterval = 200; // milliseconds
    this.powerUpShootInterval = 100; // 50% faster (200 * 0.5 = 100)
    this.shootInterval = this.normalShootInterval; // Current shoot interval
    this.lastShotTime = 0;
    
    // Rotation properties
    this.rotation = 0; // Rotation in radians (0 = facing right)
    this.rotationSpeed = 0.1; // Rotation speed in radians per frame
    
    // Glow effect properties
    this.glowSize = 10;
    this.glowAlpha = 100;
    this.glowColor = [100, 150, 255]; // Blue glow
    this.glowPulseSpeed = 0.05;
    
    // Damage effect properties
    this.isDamaged = false;
    this.damageTime = 0;
    this.damageFlashDuration = 1000; // 1 second of red flash
    this.normalGlowColor = [100, 150, 255]; // Store normal color
    this.damageGlowColor = [255, 50, 50]; // Red damage color
    
    // Power-up effect properties
    this.powerUpColors = [
      [255, 0, 0],   // Red
      [255, 255, 255], // White
      [0, 0, 255]    // Blue
    ];
    this.currentPowerUpColorIndex = 0;
    this.powerUpColorChangeSpeed = 0.05;
  }

  move() {
    // Handle rotation with Z and X keys
    if (keyIsDown(90)) { // Z key - counter-clockwise
      this.rotation -= this.rotationSpeed;
    }
    if (keyIsDown(88)) { // X key - clockwise
      this.rotation += this.rotationSpeed;
    }
    
    // Apply acceleration based on key presses
    let accelX = 0;
    let accelY = 0;
    
    if (keyIsDown(LEFT_ARROW)) accelX -= this.acceleration;
    if (keyIsDown(RIGHT_ARROW)) accelX += this.acceleration;
    if (keyIsDown(UP_ARROW)) accelY -= this.acceleration;
    if (keyIsDown(DOWN_ARROW)) accelY += this.acceleration;
    
    // Apply acceleration to velocity
    this.vel.x += accelX;
    this.vel.y += accelY;
    
    // Limit maximum speed
    this.vel.limit(this.maxSpeed);
    
    // Apply friction when no keys are pressed or to slow down
    if (accelX === 0) this.vel.x *= this.friction;
    if (accelY === 0) this.vel.y *= this.friction;
    
    // Stop completely if moving very slowly
    if (abs(this.vel.x) < 0.1) this.vel.x = 0;
    if (abs(this.vel.y) < 0.1) this.vel.y = 0;
    
    // Update position based on velocity
    this.pos.add(this.vel);
    
    // Constrain to screen boundaries
    this.pos.x = constrain(this.pos.x, 0, width - this.displayWidth);
    this.pos.y = constrain(this.pos.y, 0, height - this.displayHeight);
    
    // If hitting a boundary, stop velocity in that direction
    if (this.pos.x <= 0 || this.pos.x >= width - this.displayWidth) {
      this.vel.x = 0;
    }
    if (this.pos.y <= 0 || this.pos.y >= height - this.displayHeight) {
      this.vel.y = 0;
    }
    
    // Update damage effect
    if (this.isDamaged && millis() - this.damageTime > this.damageFlashDuration) {
      this.isDamaged = false;
      this.glowColor = this.normalGlowColor;
    }
  }

  takeDamage() {
    // Only take damage if not invincible
    if (!powerUpActive && !isIndestructible) {
      this.isDamaged = true;
      this.damageTime = millis();
      this.glowColor = this.damageGlowColor;
      
      // Create a screen flash effect
      explosions.push(new ScreenFlash());
    }
  }

  shoot() {
    if (millis() - this.lastShotTime > this.shootInterval) {
      // Calculate bullet direction based on ship rotation
      let bulletVelocity = p5.Vector.fromAngle(this.rotation).mult(10);
      
      // Calculate bullet spawn position (from center of ship)
      let centerX = this.pos.x + this.displayWidth / 2;
      let centerY = this.pos.y + this.displayHeight / 2;
      
      // Offset the bullet spawn position slightly in the direction of shooting
      let spawnOffset = p5.Vector.fromAngle(this.rotation).mult(this.displayWidth / 2);
      let bulletX = centerX + spawnOffset.x;
      let bulletY = centerY + spawnOffset.y;
      
      let bullet = new Bullet(bulletX, bulletY, bulletVelocity);
      playerBullets.push(bullet);
      this.lastShotTime = millis();
    }
  }

  render() {
    push();
    
    // Calculate pulsing glow size and alpha
    let pulseValue = sin(frameCount * this.glowPulseSpeed);
    let currentGlowSize = this.glowSize + pulseValue * 5;
    let currentGlowAlpha = this.glowAlpha + pulseValue * 20;
    
    // If power-up is active, create red-white-blue pulsating effect
    if (powerUpActive) {
      // Cycle through red, white, blue colors
      this.currentPowerUpColorIndex = (frameCount * this.powerUpColorChangeSpeed) % 3;
      let colorIndex1 = Math.floor(this.currentPowerUpColorIndex);
      let colorIndex2 = (colorIndex1 + 1) % 3;
      let lerpAmount = this.currentPowerUpColorIndex - colorIndex1;
      
      // Interpolate between colors
      this.glowColor = [
        lerp(this.powerUpColors[colorIndex1][0], this.powerUpColors[colorIndex2][0], lerpAmount),
        lerp(this.powerUpColors[colorIndex1][1], this.powerUpColors[colorIndex2][1], lerpAmount),
        lerp(this.powerUpColors[colorIndex1][2], this.powerUpColors[colorIndex2][2], lerpAmount)
      ];
      
      // Make the glow larger and more intense for power-up
      pulseValue = sin(frameCount * 0.15); // Faster pulse
      currentGlowSize = this.glowSize + 15 + pulseValue * 10; // Larger glow
      currentGlowAlpha = this.glowAlpha + 100 + pulseValue * 50; // More intense
    }
    // If damaged, make the glow pulse faster and larger
    else if (this.isDamaged) {
      pulseValue = sin(frameCount * 0.2); // Faster pulse
      currentGlowSize = this.glowSize + 10 + pulseValue * 10; // Larger glow
      currentGlowAlpha = this.glowAlpha + 50 + pulseValue * 50; // More intense
    }
    
    // Calculate center position of the ship
    let centerX = this.pos.x + this.displayWidth / 2;
    let centerY = this.pos.y + this.displayHeight / 2;
    
    // Draw outer glow
    noStroke();
    fill(
      this.glowColor[0], 
      this.glowColor[1], 
      this.glowColor[2], 
      currentGlowAlpha
    );
    
    // Draw glow as a circle around the ship's center
    ellipse(
      centerX, 
      centerY, 
      this.displayWidth + currentGlowSize, 
      this.displayHeight + currentGlowSize
    );
    
    // Draw the ship image with rotation
    imageMode(CENTER);
    if (this.isDamaged) {
      // Apply damage tint
      tint(255, 100, 100, 255);
    } else if (powerUpActive) {
      // Apply power-up tint (subtle white glow)
      tint(255, 255, 255, 255);
    }
    
    // Apply rotation to the ship
    translate(centerX, centerY);
    rotate(this.rotation);
    image(
      this.image, 
      0, 
      0, 
      this.displayWidth, 
      this.displayHeight
    );
    
    // Reset drawing settings
    imageMode(CORNER);
    pop();
    
    // Debug hitbox (uncomment for debugging)
    // noFill();
    // stroke(255, 0, 0);
    // rect(this.pos.x, this.pos.y, this.hitboxWidth, this.hitboxHeight);
  }
}

// Screen flash effect when player takes damage
class ScreenFlash {
  constructor() {
    this.alpha = 100;
    this.fadeSpeed = 5;
  }
  
  update() {
    this.alpha -= this.fadeSpeed;
  }
  
  render() {
    if (this.alpha > 0) {
      noStroke();
      fill(255, 0, 0, this.alpha);
      rect(0, 0, width, height);
    }
  }
  
  isFinished() {
    return this.alpha <= 0;
  }
}

// Bullet class
class Bullet {
  constructor(x, y, vel) {
    this.pos = createVector(x, y);
    this.vel = vel;
  }

  update() {
    this.pos.add(this.vel);
  }

  render() {
    // Draw black outline
    stroke(0);
    strokeWeight(2);
    // Draw yellow fill
    fill(255, 255, 0);
    // Make bullet larger (15x8 instead of 10x5)
    rect(this.pos.x, this.pos.y, 15, 8);
  }

  isOffScreen() {
    return this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height;
  }
}

// Simple Explosion class for player explosions
class Explosion {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.size = 50;
    this.alpha = 255;
    this.color = [255, 200, 100]; // Default explosion color
  }

  update() {
    this.size += 5;
    this.alpha -= 10;
  }

  render() {
    noStroke();
    fill(this.color[0], this.color[1], this.color[2], this.alpha);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  isFinished() {
    return this.alpha <= 0;
  }
}

// PowerUp class for invincibility power-up
class PowerUp {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(-1, 0); // Slow movement to the left
    this.displayWidth = 60; // Increased from 40
    this.displayHeight = 60; // Increased from 40
    this.hitboxWidth = 60; // Increased from 40
    this.hitboxHeight = 60; // Increased from 40
    this.rotation = 0;
    this.rotationSpeed = 0.05;
    
    // Glow effect properties
    this.glowSize = 30; // Increased from 20
    this.glowAlpha = 150;
    this.glowColor = [255, 255, 255]; // Changed from [255, 255, 100] to white
    this.glowPulseSpeed = 0.1;
  }
  
  update() {
    // Move slowly to the left
    this.pos.add(this.vel);
    
    // Rotate the power-up
    this.rotation += this.rotationSpeed;
    
    return this.isOffScreen();
  }
  
  render() {
    push();
    
    // Calculate pulsing glow size and alpha
    let pulseValue = sin(frameCount * this.glowPulseSpeed);
    let currentGlowSize = this.glowSize + pulseValue * 10;
    let currentGlowAlpha = this.glowAlpha + pulseValue * 50;
    
    // Calculate center position
    let centerX = this.pos.x + this.displayWidth / 2;
    let centerY = this.pos.y + this.displayHeight / 2;
    
    // Draw outer glow
    noStroke();
    fill(
      this.glowColor[0], 
      this.glowColor[1], 
      this.glowColor[2], 
      currentGlowAlpha
    );
    
    // Draw glow as a circle
    ellipse(
      centerX, 
      centerY, 
      this.displayWidth + currentGlowSize, 
      this.displayHeight + currentGlowSize
    );
    
    // Draw the power-up image with rotation
    imageMode(CENTER);
    translate(centerX, centerY);
    rotate(this.rotation);
    image(
      powerUpImg, 
      0, 
      0, 
      this.displayWidth, 
      this.displayHeight
    );
    
    // Reset drawing settings
    imageMode(CORNER);
    pop();
  }
  
  isOffScreen() {
    return this.pos.x < -this.displayWidth;
  }
}

// Firework class for victory celebration
class Firework {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, random(-10, -15)); // Initial upward velocity
    this.exploded = false;
    this.particles = [];
    this.color = [
      random(150, 255), // R
      random(150, 255), // G
      random(150, 255)  // B
    ];
    this.lifespan = 255;
  }
  
  update() {
    if (!this.exploded) {
      // Move upward with gravity
      this.vel.y += 0.2; // Gravity
      this.pos.add(this.vel);
      
      // Check if it's time to explode
      if (this.vel.y >= 0) {
        this.explode();
      }
    } else {
      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update();
        if (this.particles[i].isDead()) {
          this.particles.splice(i, 1);
        }
      }
      
      // Decrease lifespan
      this.lifespan -= 5;
    }
  }
  
  explode() {
    this.exploded = true;
    
    // Create particles in all directions
    for (let i = 0; i < 100; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 8);
      let velocity = p5.Vector.fromAngle(angle).mult(speed);
      this.particles.push(new FireworkParticle(this.pos.x, this.pos.y, velocity, this.color));
    }
  }
  
  render() {
    if (!this.exploded) {
      // Draw rocket
      push();
      noStroke();
      fill(this.color[0], this.color[1], this.color[2]);
      ellipse(this.pos.x, this.pos.y, 8, 8);
      
      // Draw trail
      fill(this.color[0], this.color[1], this.color[2], 150);
      ellipse(this.pos.x, this.pos.y + 10, 5, 15);
      pop();
    } else {
      // Draw particles
      for (let particle of this.particles) {
        particle.render();
      }
    }
  }
  
  isDead() {
    return this.exploded && this.particles.length === 0;
  }
}

// Particle for firework explosion
class FireworkParticle {
  constructor(x, y, vel, color) {
    this.pos = createVector(x, y);
    this.vel = vel;
    this.acc = createVector(0, 0.1); // Gravity
    this.color = color;
    this.lifespan = 255;
    this.size = random(2, 5);
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.lifespan -= random(5, 10);
  }
  
  render() {
    if (this.lifespan > 0) {
      push();
      noStroke();
      fill(this.color[0], this.color[1], this.color[2], this.lifespan);
      ellipse(this.pos.x, this.pos.y, this.size, this.size);
      pop();
    }
  }
  
  isDead() {
    return this.lifespan <= 0;
  }
}

// Draw UI with glowing frame and ship icons for lives
function drawUI() {
  // Create glowing frame for stats
  push();
  
  // Outer glow
  noFill();
  strokeWeight(4);
  stroke(100, 150, 255, 80);
  rectMode(CENTER);
  rect(width/2, 40, 300, 60, 10);
  
  // Inner glow
  strokeWeight(2);
  stroke(150, 200, 255, 150);
  rect(width/2, 40, 290, 50, 8);
  
  // Background for text
  fill(0, 0, 50, 180);
  noStroke();
  rect(width/2, 40, 280, 40, 6);
  
  // Score text
  textAlign(CENTER, CENTER);
  textSize(24);
  fill(255);
  text("SCORE: " + score, width/2, 30);
  
  // Lives as ship icons
  textSize(14);
  fill(200, 200, 255);
  text("LIVES:", width/2 - 100, 55);
  
  // Draw ship icons for lives
  for (let i = 0; i < lives; i++) {
    // Calculate position for each ship icon
    let iconX = width/2 - 50 + i * 30;
    let iconY = 55;
    
    // Draw small version of player ship
    push();
    imageMode(CENTER);
    image(playerImg, iconX, iconY, 20, 20);
    pop();
  }
  
  // Wave level indicator
  textAlign(LEFT, CENTER);
  textSize(14);
  fill(200, 200, 255);
  text("WAVE: " + floor((difficulty * 2) + 1), width/2 + 80, 55);
  
  // Power-up status indicator
  if (powerUpActive) {
    // Calculate remaining time
    let remainingTime = ceil((powerUpDuration - (millis() - powerUpStartTime)) / 1000);
    
    // Create pulsating effect for the text
    let pulseValue = sin(frameCount * 0.1);
    let textColor = [
      255, // Red
      100 + 155 * pulseValue, // Pulsing green
      100 + 155 * pulseValue  // Pulsing blue
    ];
    
    // Draw power-up status at the bottom of the screen
    textAlign(CENTER, CENTER);
    textSize(18);
    fill(textColor[0], textColor[1], textColor[2]);
    text("BULLETPROOF + RAPID FIRE: " + remainingTime + "s", width/2, height - 30);
  }
  
  pop();
}

// Draw game over screen with glowing frame
function drawGameOver() {
  // Darken background
  fill(0, 0, 0, 200);
  rect(0, 0, width, height);
  
  // Create glowing frame for game over screen
  push();
  
  // Outer glow
  noFill();
  strokeWeight(6);
  stroke(255, 100, 100, 80);
  rectMode(CENTER);
  rect(width/2, height/2, 400, 300, 15);
  
  // Inner glow
  strokeWeight(3);
  stroke(255, 150, 150, 150);
  rect(width/2, height/2, 380, 280, 12);
  
  // Background for text
  fill(50, 0, 0, 200);
  noStroke();
  rect(width/2, height/2, 360, 260, 10);
  
  // Game over text with pulsing effect
  let pulseValue = sin(frameCount * 0.05);
  let titleSize = 40 + pulseValue * 5;
  
  textAlign(CENTER, CENTER);
  textSize(titleSize);
  fill(255, 100, 100);
  text("GAME OVER", width/2, height/2 - 80);
  
  // Score and high score
  textSize(24);
  fill(255);
  text("SCORE: " + score, width/2, height/2 - 20);
  
  // Check if this is a new high score
  let isNewHighScore = score > highScore;
  if (isNewHighScore) {
    highScore = score;
    
    // Display new high score message with glow
    textSize(28);
    fill(255, 255, 100);
    text("NEW HIGH SCORE!", width/2, height/2 + 20);
  } else {
    textSize(24);
    fill(200, 200, 255);
    text("HIGH SCORE: " + highScore, width/2, height/2 + 20);
  }
  
  // Show countdown timer
  let remainingTime = ceil((gameOverDuration - (millis() - gameOverTime)) / 1000);
  textSize(20);
  fill(255, 255, 255, 200);
  text("Returning to title in " + remainingTime + "...", width/2, height/2 + 80);
  
  pop();
}

// Draw victory screen with fireworks and flashing text
function drawVictory() {
  // Create a dark background with stars
  background(0, 0, 50, 200);
  
  // Spawn new fireworks randomly
  if (random(1) < 0.2) {
    fireworks.push(new Firework(random(width), height));
  }
  
  // Update and render fireworks
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].render();
    
    if (fireworks[i].isDead()) {
      fireworks.splice(i, 1);
    }
  }
  
  // Create flashing text effect
  push();
  textAlign(CENTER, CENTER);
  
  // Calculate flashing effect
  let flashSpeed = 0.15;
  let redPulse = sin(frameCount * flashSpeed) * 127 + 128;
  let bluePulse = sin(frameCount * flashSpeed + PI/2) * 127 + 128;
  let whitePulse = sin(frameCount * flashSpeed + PI) * 127 + 128;
  
  // Create shadow for depth
  fill(0, 0, 0, 150);
  textSize(52);
  text("YOU MADE AMERICA GREAT", width/2 + 4, height/2 + 4);
  
  // Main text with color cycling (red, white, blue)
  fill(redPulse, whitePulse, bluePulse);
  textSize(50);
  text("YOU MADE AMERICA GREAT", width/2, height/2);
  
  // Add a glowing effect
  let glowSize = sin(frameCount * 0.1) * 10 + 20;
  noFill();
  strokeWeight(3);
  stroke(redPulse, whitePulse, bluePulse, 100);
  rectMode(CENTER);
  rect(width/2, height/2, 500 + glowSize, 100 + glowSize, 20);
  
  // Add score display
  textSize(24);
  fill(255);
  text("FINAL SCORE: " + score, width/2, height/2 + 80);
  
  // Show countdown timer
  let remainingTime = ceil((victoryDuration - (millis() - victoryTime)) / 1000);
  textSize(18);
  fill(255, 255, 255, 200);
  text("Returning to title in " + remainingTime + "...", width/2, height - 50);
  
  pop();
}

// Main draw loop
function draw() {
  if (gameState === "start") {
    // Draw animated start screen
    background(0);
    
    // Draw stars in the background
    drawStarfield();
    
    // Draw player ship in the center behind the text
    push();
    imageMode(CENTER);
    // Draw with a glow effect
    let pulseValue = sin(frameCount * 0.05);
    let glowSize = 20 + pulseValue * 10;
    
    // Draw glow
    noStroke();
    fill(100, 150, 255, 80);
    ellipse(width/2, height/2, 100 + glowSize, 100 + glowSize);
    
    // Draw player ship slightly larger
    image(playerImg, width/2, height/2, 80, 80);
    pop();
    
    // Draw enemy ships circling around the player
    drawCirclingEnemies();
    
    // Create glowing title
    push();
    let titlePulse = sin(frameCount * 0.05);
    let titleSize = 50 + titlePulse * 5;
    let titleGlowSize = 15 + titlePulse * 5;
    
    // Glow effect
    noStroke();
    fill(100, 150, 255, 100);
    textAlign(CENTER, CENTER);
    textSize(titleSize + titleGlowSize);
    text("PEPE-DEFENDER", width/2, height/2 - 120);
    
    // Title text
    fill(255);
    textSize(titleSize);
    text("PEPE-DEFENDER", width/2, height/2 - 120);
    
    // Instructions
    textSize(20);
    fill(200, 200, 255, 150 + titlePulse * 100);
    text("Arrow keys to move, Space to shoot", width/2, height/2 + 120);
    text("Z and X keys to rotate ship", width/2, height/2 + 150);
    
    // Start prompt
    textSize(24);
    fill(255, 255, 255, 150 + titlePulse * 100);
    text("Press any key to start", width/2, height/2 + 170);
    
    // Display high score if it exists
    if (highScore > 0) {
      textSize(18);
      fill(200, 200, 255);
      text("HIGH SCORE: " + highScore, width/2, height/2 + 220);
    }
    
    pop();
    
  } else if (gameState === "playing") {
    background(0);

    // Update and render background
    bg.update();
    bg.render();

    // Handle player
    player.move();
    if (keyIsDown(32)) player.shoot(); // Spacebar to shoot
    player.render();

    // Check if power-up should be active
    if (powerUpActive && millis() - powerUpStartTime > powerUpDuration) {
      powerUpActive = false;
      isIndestructible = false;
      player.shootInterval = player.normalShootInterval; // Reset fire rate to normal
    }

    // Check if we should spawn a power-up based on wave number
    let currentWave = floor((difficulty * 2) + 1);
    if (currentWave >= powerUpWaveThreshold && !powerUpSpawned && !powerUpActive && powerUps.length === 0) {
      shouldSpawnPowerUp = true;
      // Don't set powerUpSpawned to true here - we'll set it when an enemy is actually destroyed
    }

    // Spawn enemy waves based on time
    if (millis() - lastWaveTime > waveInterval) {
      // Update the global enemies reference before spawning new enemies
      window.enemies = enemies;
      
      let newEnemies = spawnEnemyWave(difficulty, player, enemyImages, currentLevel, bossDefeated);
      enemies = enemies.concat(newEnemies);
      lastWaveTime = millis();
      
      // Increase difficulty over time
      difficulty += 0.5;
      
      // Decrease wave interval as difficulty increases (min 3 seconds)
      waveInterval = max(3000, 5000 - difficulty * 200);
    }

    // Update and render player bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      playerBullets[i].update();
      playerBullets[i].render();
      if (playerBullets[i].isOffScreen()) {
        playerBullets.splice(i, 1);
      }
    }

    // Update and render enemies and handle their bullets
    for (let i = enemies.length - 1; i >= 0; i--) {
      let result = enemies[i].update();
      enemies[i].render();
      
      // Handle enemy shooting or special actions
      if (result) {
        if (Array.isArray(result)) {
          // Multiple bullets (for patterns)
          for (let bullet of result) {
            if (bullet instanceof Mine) {
              // Handle mines differently if needed
              enemyBullets.push(bullet);
            } else {
              enemyBullets.push(bullet);
            }
          }
        } else if (result instanceof Bullet || result instanceof Mine) {
          // Single bullet
          enemyBullets.push(result);
        }
      }
      
      if (enemies[i].isOffScreen()) {
        enemies.splice(i, 1);
      }
    }

    // Update and render enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let remove = false;
      
      if (enemyBullets[i] instanceof Mine) {
        // Special update for mines
        remove = enemyBullets[i].update();
      } else {
        enemyBullets[i].update();
      }
      
      enemyBullets[i].render();
      
      if (remove || enemyBullets[i].isOffScreen()) {
        enemyBullets.splice(i, 1);
      }
    }

    // Update and render power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      let isOffScreen = powerUps[i].update();
      powerUps[i].render();
      
      if (isOffScreen) {
        powerUps.splice(i, 1);
      }
    }

    // Update and render explosions
    for (let i = explosions.length - 1; i >= 0; i--) {
      explosions[i].update();
      explosions[i].render();
      if (explosions[i].isFinished()) {
        explosions.splice(i, 1);
      }
    }

    // Collision detection
    // Player bullets vs enemies
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      for (let j = enemies.length - 1; j >= 0; j--) {
        if (
          playerBullets[i].pos.x > enemies[j].pos.x &&
          playerBullets[i].pos.x < enemies[j].pos.x + enemies[j].hitboxWidth &&
          playerBullets[i].pos.y > enemies[j].pos.y &&
          playerBullets[i].pos.y < enemies[j].pos.y + enemies[j].hitboxHeight
        ) {
          // Enemy takes damage
          let destroyed = enemies[j].takeDamage(1);
          
          if (destroyed) {
            // Check if the destroyed enemy is a boss (type 101-104)
            if (enemies[j] instanceof BossEnemy) {
              bossDefeated = true;
              levelTransitionTime = millis();
            }
            
            // Create custom explosion based on enemy type
            let enemyExplosions = enemies[j].createExplosion();
            explosions = explosions.concat(enemyExplosions);
            
            score += 10 * (enemies[j].type || 1); // More points for higher-type enemies
            
            // Spawn power-up if conditions are met (first enemy destroyed after wave 6)
            if (shouldSpawnPowerUp) {
              powerUps.push(new PowerUp(enemies[j].pos.x, enemies[j].pos.y));
              shouldSpawnPowerUp = false;
              powerUpSpawned = true; // Mark that we've spawned the power-up for this level
            }
            
            enemies.splice(j, 1);
          }
          
          playerBullets.splice(i, 1);
          break;
        }
      }
    }

    // Player vs power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (
        powerUps[i].pos.x < player.pos.x + player.hitboxWidth &&
        powerUps[i].pos.x + powerUps[i].hitboxWidth > player.pos.x &&
        powerUps[i].pos.y < player.pos.y + player.hitboxHeight &&
        powerUps[i].pos.y + powerUps[i].hitboxHeight > player.pos.y
      ) {
        // Activate power-up
        powerUpActive = true;
        isIndestructible = true;
        powerUpStartTime = millis();
        
        // Increase fire rate
        player.shootInterval = player.powerUpShootInterval;
        
        // Create a special effect for power-up collection
        for (let j = 0; j < 10; j++) {
          let explosion = new Explosion(
            powerUps[i].pos.x + powerUps[i].displayWidth / 2,
            powerUps[i].pos.y + powerUps[i].displayHeight / 2
          );
          explosion.color = [255, 255, 255]; // Changed from yellow to white
          explosions.push(explosion);
        }
        
        powerUps.splice(i, 1);
      }
    }

    // Enemy bullets vs player
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      let hit = false;
      
      if (!isIndestructible) { // Check if player is not indestructible
        if (enemyBullets[i] instanceof Mine) {
          // Special collision for mines
          hit = enemyBullets[i].checkCollision(player);
          
          // If mine exploded and hit player, create mine explosion
          if (hit && enemyBullets[i].exploded) {
            let mineExplosions = enemyBullets[i].createExplosion();
            explosions = explosions.concat(mineExplosions);
          }
        } else {
          hit = (
            enemyBullets[i].pos.x > player.pos.x &&
            enemyBullets[i].pos.x < player.pos.x + player.hitboxWidth &&
            enemyBullets[i].pos.y > player.pos.y &&
            enemyBullets[i].pos.y < player.pos.y + player.hitboxHeight
          );
        }
        
        if (hit) {
          // Player takes damage
          player.takeDamage();
          
          if (!(enemyBullets[i] instanceof Mine) || !enemyBullets[i].exploded) {
            enemyBullets.splice(i, 1);
          }
          lives -= 1;
          if (lives <= 0) {
            gameState = "gameOver";
            gameOverTime = millis(); // Record when game over started
          }
        }
      }
    }

    // Enemies vs player
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (
        enemies[i].pos.x < player.pos.x + player.hitboxWidth &&
        enemies[i].pos.x + enemies[i].hitboxWidth > player.pos.x &&
        enemies[i].pos.y < player.pos.y + player.hitboxHeight &&
        enemies[i].pos.y + enemies[i].hitboxHeight > player.pos.y
      ) {
        // Create enemy explosion
        let enemyExplosions = enemies[i].createExplosion();
        explosions = explosions.concat(enemyExplosions);
        
        // Player takes damage
        player.takeDamage();
        
        enemies.splice(i, 1);
        lives -= 1;
        if (lives <= 0) {
          gameState = "gameOver";
          gameOverTime = millis(); // Record when game over started
        }
      }
    }

    // Handle level transition
    if (bossDefeated && !isTransitioning) {
      // Start the transition process
      isTransitioning = true;
      transitionStarted = false;
      levelTransitionTime = millis();
      
      // Create new background for next level
      let nextLevel = currentLevel < 4 ? currentLevel + 1 : 1;
      let newBg = new Background(backgroundImages[nextLevel - 1]);
      levelTransition = new LevelTransition(bg, newBg);
    }
    
    // Handle the transition animation
    if (isTransitioning) {
      // Wait for delay before starting the fade effect
      if (!transitionStarted && millis() - levelTransitionTime >= levelTransitionDelay) {
        transitionStarted = true;
      }
      
      // Once transition has started, handle the fade effect
      if (transitionStarted && levelTransition) {
        // Update and render the transition
        levelTransition.render();
        if (levelTransition.update()) {
          // Transition is complete
          isTransitioning = false;
          transitionStarted = false;
          bossDefeated = false;
          
          if (currentLevel < 4) {
            // Normal level progression
            currentLevel++;
            
            // Update the game state with the new background
            backgroundImg = backgroundImages[currentLevel - 1];
            bg = levelTransition.newBackground;
            levelTransition = null;
            
            // Stop current music and play new level music
            if (currentMusic) {
              currentMusic.stop();
            }
            currentMusic = levelMusic[currentLevel - 1];
            currentMusic.loop();
            
            // Reset player position and other necessary variables
            player.pos.set(100, height / 2);
            enemies = [];
            playerBullets = [];
            enemyBullets = [];
            explosions = [];
            
            // Reset difficulty to start fresh with the new level
            difficulty = 0;
            
            // Reset power-up state for the new level
            powerUpSpawned = false;
            
            // Update the global enemies reference
            window.enemies = enemies;
            
            // Reset wave timing to start wave progression
            lastWaveTime = millis();
            waveInterval = 5000; // Reset to initial wave interval
          } else {
            // After defeating level 4 boss, return to level 1 with increased difficulty
            currentLevel = 1;
            
            // Update the game state with level 1 background
            backgroundImg = backgroundImages[0];
            bg = new Background(backgroundImg);
            levelTransition = null;
            
            // Stop current music and play level 1 music
            if (currentMusic) {
              currentMusic.stop();
            }
            currentMusic = levelMusic[0];
            currentMusic.loop();
            
            // Reset player position and clear all entities
            player.pos.set(100, height / 2);
            enemies = [];
            playerBullets = [];
            enemyBullets = [];
            explosions = [];
            
            // Increase base difficulty for the next cycle
            difficulty = 2; // Start with higher difficulty
            
            // Reset power-up state
            powerUpSpawned = false;
            
            // Update the global enemies reference
            window.enemies = enemies;
            
            // Set faster wave interval for increased challenge
            lastWaveTime = millis();
            waveInterval = 4000; // Faster wave spawns
          }
        }
      }
    }

    // Draw the UI with the new function
    drawUI();
  } else if (gameState === "gameOver") {
    // Keep rendering the game in the background
    background(0);
    bg.render();
    
    // Draw game over screen
    drawGameOver();
    
    // Check if 5 seconds have passed
    if (millis() - gameOverTime > gameOverDuration) {
      // Reset game state
      resetGame();
      gameState = "start";
    }
  } else if (gameState === "victory") {
    // Draw the victory screen
    drawVictory();
    
    // Check if 5 seconds have passed
    if (millis() - victoryTime > victoryDuration) {
      // Reset game state
      resetGame();
      gameState = "start";
    }
  }
}

// Handle state transitions
function keyPressed() {
  if (gameState === "start") {
    gameState = "playing";
    // Start the music for the first level
    if (currentMusic) {
      currentMusic.stop();
    }
    currentMusic = levelMusic[0];
    currentMusic.loop();
  } else if (gameState === "gameOver") {
    // Skip the remaining time if any key is pressed during game over
    resetGame();
    gameState = "start";
  } else if (gameState === "victory") {
    // Skip the remaining time if any key is pressed during victory
    resetGame();
    gameState = "start";
  } else if (key === 'i' || key === 'I') {
    isIndestructible = !isIndestructible; // Toggle indestructible mode
  }
}

// Function to draw a zooming starfield background
function drawStarfield() {
  // Create an array to store star data if it doesn't exist yet
  if (!window.stars) {
    window.stars = [];
    
    // Initialize 200 stars with random positions and depths
    for (let i = 0; i < 200; i++) {
      window.stars.push({
        x: random(-width/2, width/2),
        y: random(-height/2, height/2),
        z: random(width), // Depth (distance from viewer)
        size: random(1, 3),
        brightness: random(150, 255)
      });
    }
  }
  
  // Set drawing mode to center for the zooming effect
  translate(width/2, height/2);
  
  // Draw and update each star
  for (let i = 0; i < window.stars.length; i++) {
    let star = window.stars[i];
    
    // Calculate star size based on depth (closer = larger)
    let sizeFactor = map(star.z, 0, width, 3, 0.1);
    let currentSize = star.size * sizeFactor;
    
    // Calculate brightness based on depth (closer = brighter)
    let brightnessFactor = map(star.z, 0, width, 1, 0.4);
    let currentBrightness = star.brightness * brightnessFactor;
    
    // Draw the star
    noStroke();
    fill(currentBrightness);
    ellipse(star.x * (width / star.z), star.y * (width / star.z), currentSize, currentSize);
    
    // Move the star closer (decrease z)
    star.z -= 2;
    
    // If star is too close (passed the viewer), reset it far away
    if (star.z <= 0) {
      star.z = width;
      star.x = random(-width/2, width/2);
      star.y = random(-height/2, height/2);
    }
  }
  
  // Reset translation
  resetMatrix();
}

// Function to draw enemy ships circling around the player
function drawCirclingEnemies() {
  // Number of enemies to draw
  let numEnemies = 7; // One for each enemy type
  
  // Calculate radius and angle increment
  let radius = 180;
  let angleIncrement = TWO_PI / numEnemies;
  
  // Base rotation speed
  let rotationSpeed = frameCount * 0.005;
  
  // Draw each enemy
  for (let i = 0; i < numEnemies; i++) {
    // Calculate position on the circle
    // Each enemy type moves at slightly different speed
    let angle = rotationSpeed * (1 + i * 0.2) + i * angleIncrement;
    let x = width/2 + cos(angle) * radius;
    let y = height/2 + sin(angle) * radius;
    
    // Draw the enemy with a small glow
    push();
    // Add glow
    noStroke();
    // Use color based on enemy type (ROYGBIV)
    let glowColors = [
      [255, 0, 0],      // Red (Type 1)
      [255, 127, 0],    // Orange (Type 2)
      [255, 255, 0],    // Yellow (Type 3)
      [0, 255, 0],      // Green (Type 4)
      [0, 127, 255],    // Blue (Type 5)
      [75, 0, 130],     // Indigo (Type 6)
      [148, 0, 211]     // Violet (Type 7)
    ];
    
    fill(glowColors[i][0], glowColors[i][1], glowColors[i][2], 100);
    ellipse(x, y, 50, 50);
    
    // Draw the enemy
    imageMode(CENTER);
    image(enemyImages[i], x, y, 40, 40);
    pop();
  }
}

// Function to reset the game
function resetGame() {
  // Stop any playing music
  if (currentMusic) {
    currentMusic.stop();
    currentMusic = null;
  }
  
  // Reset transition-related variables
  isTransitioning = false;
  transitionStarted = false;
  levelTransition = null;
  
  score = 0;
  lives = 5; // Reset to 5 lives
  difficulty = 0;
  currentLevel = 1; // Reset to level 1
  bossDefeated = false; // Reset boss defeated flag
  
  // Reset background to level 1
  backgroundImg = backgroundImages[0];
  bg = new Background(backgroundImg);
  
  enemies = [];
  playerBullets = [];
  enemyBullets = [];
  explosions = []; // This will clear all explosions, including enhanced ones
  powerUps = []; // Clear any power-ups
  
  // Reset power-up related variables
  powerUpActive = false;
  isIndestructible = false;
  shouldSpawnPowerUp = false;
  powerUpSpawned = false; // Reset the power-up spawned flag
  
  // Reset player's shoot interval
  if (player) {
    player.shootInterval = player.normalShootInterval;
  }
  
  // Reset stars for the title screen
  window.stars = null;
  
  // Update the global enemies reference
  window.enemies = enemies;
  
  player.pos.set(100, height / 2);
  lastWaveTime = millis();
  waveInterval = 5000;
}