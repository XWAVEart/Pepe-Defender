// Enemy Types and Behaviors
// This file contains all enemy-related classes and behaviors

// Base Enemy class that all enemy types will extend
class Enemy {
    constructor(x, y, type, image) {
      this.pos = createVector(x, y);
      this.startX = x;
      this.startY = y;
      this.type = type;
      this.image = image;
      this.speed = 2;
      this.displayWidth = 80;
      this.displayHeight = 80;
      this.hitboxWidth = 65;
      this.hitboxHeight = 65;
      this.health = 1;
      this.rotation = 0; // For rotating enemies
      this.tint = null; // For tinting enemies
      
      // Default explosion color (white)
      this.explosionColor = [255, 255, 255];
      this.explosionSecondaryColor = [200, 200, 200];
    }
  
    update() {
      // Base movement - override in subclasses
      this.pos.x -= this.speed;
      return null;
    }
  
    shoot() {
      // Base shooting behavior - override in subclasses
      return null; // Return null if no bullet is created
    }
  
    render() {
      push(); // Save current drawing state
      
      // Apply tint if specified
      if (this.tint) {
        tint(this.tint);
      }
      
      // Apply rotation if needed
      if (this.rotation !== 0) {
        translate(this.pos.x + this.displayWidth/2, this.pos.y + this.displayHeight/2);
        rotate(this.rotation);
        image(this.image, -this.displayWidth/2, -this.displayHeight/2, this.displayWidth, this.displayHeight);
      } else {
        // Normal rendering
        image(this.image, this.pos.x, this.pos.y, this.displayWidth, this.displayHeight);
      }
      
      // Reset drawing state
      pop();
      
      // Debug hitbox (uncomment for debugging)
      // noFill();
      // stroke(255, 0, 0);
      // rect(this.pos.x, this.pos.y, this.hitboxWidth, this.hitboxHeight);
    }
  
    isOffScreen() {
      return this.pos.x < -this.displayWidth;
    }
  
    takeDamage(amount) {
      this.health -= amount;
      return this.health <= 0; // Return true if enemy is destroyed
    }
    
    // Create custom explosion for this enemy type
    createExplosion() {
      // Create array of explosions (main explosion + ripples)
      let explosions = [];
      
      // Center position of the enemy
      let centerX = this.pos.x + this.displayWidth/2;
      let centerY = this.pos.y + this.displayHeight/2;
      
      // Main explosion
      explosions.push(new EnhancedExplosion(
        centerX, 
        centerY, 
        15, // Base radius
        this.explosionColor, 
        this.explosionSecondaryColor,
        1.0, // Full opacity
        2.5, // Growth rate
        5 // Fade rate
      ));
      
      // Add 3 outer ripple explosions with decreasing opacity
      for (let i = 1; i <= 3; i++) {
        explosions.push(new EnhancedExplosion(
          centerX, 
          centerY, 
          10 + i * 8, // Increasing starting radius
          this.explosionColor, 
          this.explosionSecondaryColor,
          0.7 - (i * 0.15), // Decreasing opacity
          3 + i * 0.5, // Faster growth for outer ripples
          4 // Fade rate
        ));
      }
      
      return explosions;
    }
  }
  
  // Regular enemy types (1-6)
  class SineWaveEnemy extends Enemy {
    constructor(x, y, image, amplitude, frequency, phase) {
      super(x, y, 1, image);
      this.amplitude = amplitude || 50;
      this.frequency = frequency || 0.02;
      this.phase = phase || 0;
      // Standard size for basic enemy
      this.displayWidth = 80;
      this.displayHeight = 80;
      this.hitboxWidth = 65;
      this.hitboxHeight = 65;
      
      // Red explosion (R)
      this.explosionColor = [255, 0, 0];
      this.explosionSecondaryColor = [200, 50, 50];
    }
  
    update() {
      this.pos.x -= this.speed;
      this.pos.y = this.startY + this.amplitude * sin(this.frequency * (this.startX - this.pos.x) + this.phase);
      return null;
    }
  }
  
  class ShooterEnemy extends Enemy {
    constructor(x, y, image, player) {
      super(x, y, 2, image);
      this.player = player;
      this.shootInterval = 2000;
      this.lastShotTime = millis();
      this.health = 2; // Tougher than basic enemies
      // Slightly larger than basic enemy
      this.displayWidth = 90;
      this.displayHeight = 90;
      this.hitboxWidth = 75;
      this.hitboxHeight = 75;
      
      // Orange explosion (O)
      this.explosionColor = [255, 127, 0];
      this.explosionSecondaryColor = [200, 100, 0];
    }
  
    update() {
      this.pos.x -= this.speed * 0.8; // Moves slower than basic enemies
      
      // Rotate to face the player, plus 90 degrees (PI/2)
      let dx = this.player.pos.x - this.pos.x;
      let dy = this.player.pos.y - this.pos.y;
      this.rotation = atan2(dy, dx) + PI/2;
      
      // Check if it's time to shoot
      if (millis() - this.lastShotTime > this.shootInterval) {
        this.lastShotTime = millis();
        return this.shoot();
      }
      return null;
    }
  
    shoot() {
      let dx = this.player.pos.x - this.pos.x;
      let dy = this.player.pos.y - this.pos.y;
      let angle = atan2(dy, dx);
      let vel = p5.Vector.fromAngle(angle).setMag(5);
      return new Bullet(this.pos.x + this.displayWidth/2, this.pos.y + this.displayHeight/2, vel);
    }
  }
  
  class KamikazeEnemy extends Enemy {
    constructor(x, y, image, player) {
      super(x, y, 3, image);
      this.player = player;
      this.chargeSpeed = 8;
      this.isCharging = false;
      this.chargeDistance = 300;
      // Smaller but faster
      this.displayWidth = 75;
      this.displayHeight = 75;
      this.hitboxWidth = 60;
      this.hitboxHeight = 60;
      // Red tint when charging
      this.normalTint = null;
      this.chargeTint = [255, 100, 100, 255]; // Red tint
      
      // Yellow explosion (Y)
      this.explosionColor = [255, 255, 0];
      this.explosionSecondaryColor = [200, 200, 0];
    }
  
    update() {
      if (!this.isCharging && dist(this.pos.x, this.pos.y, this.player.pos.x, this.player.pos.y) < this.chargeDistance) {
        this.isCharging = true;
        this.tint = this.chargeTint; // Apply red tint when charging
      }
      
      if (this.isCharging) {
        // Calculate direction to player
        let dx = this.player.pos.x - this.pos.x;
        let dy = this.player.pos.y - this.pos.y;
        let angle = atan2(dy, dx);
        
        // Rotate to face direction of movement
        this.rotation = angle;
        
        // Move towards player
        this.pos.x += cos(angle) * this.chargeSpeed;
        this.pos.y += sin(angle) * this.chargeSpeed;
      } else {
        // Normal movement
        this.pos.x -= this.speed;
        this.tint = this.normalTint;
      }
      
      return null; // No shooting
    }
    
    // Override explosion for kamikaze to be more intense
    createExplosion() {
      let explosions = super.createExplosion();
      
      // Add an extra large ripple for kamikaze enemies
      let centerX = this.pos.x + this.displayWidth/2;
      let centerY = this.pos.y + this.displayHeight/2;
      
      explosions.push(new EnhancedExplosion(
        centerX, 
        centerY, 
        25, // Larger base radius
        this.explosionColor, 
        this.explosionSecondaryColor,
        0.4, // Lower opacity
        4, // Faster growth
        3 // Slower fade for longer-lasting effect
      ));
      
      return explosions;
    }
  }
  
  class SwarmEnemy extends Enemy {
    constructor(x, y, image, formationIndex) {
      super(x, y, 4, image);
      this.formationIndex = formationIndex;
      this.formationSize = 5; // Fixed formation size of 5
      // Single file formation - each enemy follows the same path with a delay
      this.formationOffset = formationIndex * 80; // Spacing between enemies in the line
      this.speed = 3;
      // Regular size like other enemies
      this.displayWidth = 80;
      this.displayHeight = 80;
      this.hitboxWidth = 65;
      this.hitboxHeight = 65;
      
      // Path parameters
      this.pathTime = 0; // Individual time counter for path
      this.pathSpeed = 0.02; // Speed of movement along the path
      this.loopHeight = 150; // Height of the loops
      this.baseY = y; // Store initial Y position
      
      // Green explosion (G)
      this.explosionColor = [0, 255, 0];
      this.explosionSecondaryColor = [0, 200, 50];
    }
  
    update() {
      // Update path time - each enemy has a time offset based on formation index
      this.pathTime += this.pathSpeed;
      
      // Calculate horizontal position - move from right to left with spacing
      this.pos.x -= this.speed;
      
      // Calculate vertical position using a figure-8 pattern
      // This creates a looping pattern that crosses over itself
      this.pos.y = this.baseY + 
                   this.loopHeight * sin(this.pathTime) * cos(this.pathTime * 0.5);
      
      // Rotate based on movement direction
      let angle = atan2(
        this.loopHeight * (cos(this.pathTime) * cos(this.pathTime * 0.5) - 
                          0.5 * sin(this.pathTime) * sin(this.pathTime * 0.5)),
        -this.speed
      );
      this.rotation = angle + PI/2;
      
      return null;
    }
    
    // Regular sized explosion
    createExplosion() {
      let explosions = [];
      
      let centerX = this.pos.x + this.displayWidth/2;
      let centerY = this.pos.y + this.displayHeight/2;
      
      // Main explosion
      explosions.push(new EnhancedExplosion(
        centerX, 
        centerY, 
        15, // Regular size radius
        this.explosionColor, 
        this.explosionSecondaryColor,
        1.0,
        2.5,
        5
      ));
      
      // Add ripple effects
      for (let i = 1; i <= 2; i++) {
        explosions.push(new EnhancedExplosion(
          centerX, 
          centerY, 
          10 + i * 8,
          this.explosionColor, 
          this.explosionSecondaryColor,
          0.7 - (i * 0.2),
          2.5 + i * 0.5,
          4
        ));
      }
      
      return explosions;
    }
  }
  
  class TurretEnemy extends Enemy {
    constructor(x, y, image) {
      super(x, y, 5, image);
      this.shootInterval = 1500;
      this.lastShotTime = millis();
      this.bulletPattern = 0;
      this.health = 3;
      this.speed = 1; // Moves very slowly
      // Larger size for turret
      this.displayWidth = 100;
      this.displayHeight = 100;
      this.hitboxWidth = 85;
      this.hitboxHeight = 85;
      // Rotation for visual effect
      this.baseRotation = 0;
      this.rotationSpeed = 0.01;
      
      // Blue explosion (B)
      this.explosionColor = [0, 0, 255];
      this.explosionSecondaryColor = [50, 50, 200];
    }
  
    update() {
      // Barely moves horizontally
      this.pos.x -= this.speed * 0.5;
      
      // Rotate slowly for visual effect
      this.baseRotation += this.rotationSpeed;
      this.rotation = this.baseRotation;
      
      if (millis() - this.lastShotTime > this.shootInterval) {
        this.lastShotTime = millis();
        this.bulletPattern = (this.bulletPattern + 1) % 3;
        return this.shoot();
      }
      return null;
    }
  
    shoot() {
      // Different bullet patterns
      let bullets = [];
      
      switch(this.bulletPattern) {
        case 0: // 3-way spread
          for (let angle = -PI/6; angle <= PI/6; angle += PI/6) {
            let vel = p5.Vector.fromAngle(PI + angle).setMag(5);
            bullets.push(new Bullet(this.pos.x, this.pos.y + this.displayHeight/2, vel));
          }
          break;
        case 1: // Vertical line
          for (let offset = -30; offset <= 30; offset += 30) {
            let vel = createVector(-5, 0);
            bullets.push(new Bullet(this.pos.x, this.pos.y + this.displayHeight/2 + offset, vel));
          }
          break;
        case 2: // Single powerful shot
          let vel = createVector(-8, 0);
          bullets.push(new Bullet(this.pos.x, this.pos.y + this.displayHeight/2, vel));
          break;
      }
      
      return bullets;
    }
  }
  
  class MinelayerEnemy extends Enemy {
    constructor(x, y, image) {
      super(x, y, 7, image);
      this.dropInterval = 1000;
      this.lastDropTime = millis();
      this.speed = 3;
      // Medium size
      this.displayWidth = 90;
      this.displayHeight = 90;
      this.hitboxWidth = 75;
      this.hitboxHeight = 75;
      // Slight yellow tint
      this.tint = [255, 255, 150, 255];
      
      // Violet explosion (V)
      this.explosionColor = [143, 0, 255];
      this.explosionSecondaryColor = [120, 0, 200];
    }
  
    update() {
      // Move in a zigzag pattern
      this.pos.x -= this.speed;
      this.pos.y = this.startY + sin(frameCount * 0.1) * 50;
      
      // Rotate based on vertical movement direction
      this.rotation = atan2(cos(frameCount * 0.1) * 50 * 0.1, -this.speed) + PI/2;
      
      if (millis() - this.lastDropTime > this.dropInterval) {
        this.lastDropTime = millis();
        return this.dropMine();
      }
      
      return null;
    }
  
    dropMine() {
      // Create a stationary "mine" bullet
      let vel = createVector(0, 0); // Stationary
      return new Mine(this.pos.x + this.displayWidth/2, this.pos.y + this.displayHeight/2, vel);
    }
  }
  
  // Enhanced Explosion class with more customization options
  class EnhancedExplosion {
    constructor(x, y, radius, color, secondaryColor, alpha, growthRate, fadeRate) {
      this.pos = createVector(x, y);
      this.radius = radius || 10;
      this.color = color || [255, 100, 0]; // Default orange
      this.secondaryColor = secondaryColor || [255, 200, 0]; // Default yellow
      this.alpha = alpha || 1.0;
      this.maxAlpha = alpha || 1.0;
      this.growthRate = growthRate || 2;
      this.fadeRate = fadeRate || 5;
      this.finished = false;
    }
  
    update() {
      this.radius += this.growthRate;
      this.alpha -= this.fadeRate / 255;
      
      if (this.alpha <= 0) {
        this.alpha = 0;
        this.finished = true;
      }
    }
  
    render() {
      if (this.finished) return;
      
      noStroke();
      
      // Outer explosion
      fill(
        this.color[0], 
        this.color[1], 
        this.color[2], 
        this.alpha * 255
      );
      ellipse(this.pos.x, this.pos.y, this.radius * 2);
      
      // Inner explosion (brighter)
      fill(
        this.secondaryColor[0], 
        this.secondaryColor[1], 
        this.secondaryColor[2], 
        this.alpha * 255 * 0.8
      );
      ellipse(this.pos.x, this.pos.y, this.radius);
    }
  
    isFinished() {
      return this.finished;
    }
  }
  
  // Mine class - special type of bullet that doesn't move but explodes after a delay
  class Mine {
    constructor(x, y, vel) {
      this.pos = createVector(x, y);
      this.vel = vel;
      this.radius = 10;
      this.lifespan = 3000; // 3 seconds until explosion
      this.creationTime = millis();
      this.exploded = false;
      this.explosionRadius = 0;
      this.maxExplosionRadius = 100;
    }
  
    update() {
      this.pos.add(this.vel);
      
      if (!this.exploded && millis() - this.creationTime > this.lifespan) {
        this.exploded = true;
      }
      
      if (this.exploded) {
        this.explosionRadius += 5;
        if (this.explosionRadius > this.maxExplosionRadius) {
          return true; // Remove the mine
        }
      }
      
      return false;
    }
  
    render() {
      if (!this.exploded) {
        // Pulsing mine
        let pulseSize = 10 + sin(frameCount * 0.2) * 2;
        fill(255, 0, 0);
        noStroke();
        ellipse(this.pos.x, this.pos.y, pulseSize, pulseSize);
        
        // Warning indicator
        let warningAlpha = map(sin(frameCount * 0.2), -1, 1, 50, 200);
        fill(255, 0, 0, warningAlpha);
        ellipse(this.pos.x, this.pos.y, 20, 20);
      } else {
        // Explosion
        noStroke();
        fill(255, 100, 0, 150);
        ellipse(this.pos.x, this.pos.y, this.explosionRadius * 2);
        
        // Inner explosion
        fill(255, 200, 0, 100);
        ellipse(this.pos.x, this.pos.y, this.explosionRadius);
      }
    }
  
    isOffScreen() {
      return this.pos.x < -this.radius || this.pos.x > width + this.radius || 
             this.pos.y < -this.radius || this.pos.y > height + this.radius;
    }
    
    checkCollision(target) {
      if (!this.exploded) {
        return false;
      }
      
      // Check if target is within explosion radius
      let d = dist(this.pos.x, this.pos.y, target.pos.x + target.displayWidth/2, target.pos.y + target.displayHeight/2);
      return d < this.explosionRadius + (target.hitboxWidth + target.hitboxHeight) / 4;
    }
    
    // Create explosion for mine
    createExplosion() {
      let explosions = [];
      
      // Mine explosions are orange-red
      let mineExplosionColor = [255, 100, 0];
      let mineSecondaryColor = [255, 200, 0];
      
      // Main explosion
      explosions.push(new EnhancedExplosion(
        this.pos.x, 
        this.pos.y, 
        20, // Larger radius
        mineExplosionColor, 
        mineSecondaryColor,
        1.0,
        3,
        4
      ));
      
      // Add ripples
      for (let i = 1; i <= 3; i++) {
        explosions.push(new EnhancedExplosion(
          this.pos.x, 
          this.pos.y, 
          15 + i * 10,
          mineExplosionColor, 
          mineSecondaryColor,
          0.7 - (i * 0.15),
          3.5 + i * 0.5,
          4
        ));
      }
      
      return explosions;
    }
  }
  
  // Boss enemy base class
  class BossEnemy extends Enemy {
    constructor(x, y, image, player, level) {
        super(x, y, 100 + level, image); // Types 101, 102, 103, 104 for bosses
        this.level = level;
        this.player = player;
        this.health = 45; // Increased from 20 to 45
        this.phase = 0;
        this.shootInterval = 1000;
        this.lastShotTime = millis();
        // Much larger size for boss
        this.displayWidth = 250;
        this.displayHeight = 250;
        this.hitboxWidth = 150;
        this.hitboxHeight = 150;
        this.speed = 1;
        // Target position - center of the screen
        this.targetX = width / 2;
        this.targetY = height / 2; // Set initial target to center of screen
        this.hasReachedCenter = false; // Flag to track if boss has reached center
        // Tints for different phases
        this.phaseTints = [
            null, // Phase 0: Normal
            [150, 150, 255, 255], // Phase 1: Blue tint
            [255, 100, 100, 255]  // Phase 2: Red tint
        ];
        this.tint = this.phaseTints[0];
        
        // Indigo explosion (I)
        this.explosionColor = [75, 0, 130];
        this.explosionSecondaryColor = [60, 0, 100];
    }

    update() {
        // Phase-based behavior
        if (this.health > 30) { // Phase 0 - changed from 15 to 30
            if (!this.hasReachedCenter) {
                // Move to center of the screen (both horizontally and vertically)
                let distX = this.targetX - this.pos.x;
                let distY = this.targetY - this.pos.y;
                
                // Move horizontally
                if (abs(distX) > 5) {
                    this.pos.x += distX * 0.05;
                }
                
                // Move vertically
                if (abs(distY) > 5) {
                    this.pos.y += distY * 0.05;
                }
                
                // Check if boss has reached center
                if (abs(distX) < 5 && abs(distY) < 5) {
                    this.hasReachedCenter = true;
                }
            } else {
                // After reaching center, do gentle vertical movement
                this.pos.y += (this.targetY - this.pos.y) * 0.05;
                if (abs(this.pos.y - this.targetY) < 10) {
                    this.targetY = random(100, height - 100);
                }
            }
            
            // Slow rotation
            this.rotation = sin(frameCount * 0.02) * 0.2;
        } else if (this.health > 15) { // Phase 1 - changed from 10 to 15
            // Circle movement - centered at the target X position
            let centerX = this.targetX;
            let centerY = height / 2;
            let radius = 100;
            let angle = frameCount * 0.02;
            
            this.pos.x = centerX + cos(angle) * radius;
            this.pos.y = centerY + sin(angle) * radius;
            
            // Rotation follows movement
            this.rotation = angle + PI/2;
        } else { // Phase 2 - final phase
            // Erratic movement
            this.pos.x += sin(frameCount * 0.1) * 3;
            this.pos.y += cos(frameCount * 0.13) * 3;
            
            // Constrain to screen - allow movement around the center
            this.pos.x = constrain(this.pos.x, this.targetX - 150, this.targetX + 150);
            this.pos.y = constrain(this.pos.y, 50, height - 50);
            
            // Erratic rotation
            this.rotation = sin(frameCount * 0.1) * 0.5;
        }
        
        // Shooting based on current phase
        if (millis() - this.lastShotTime > this.shootInterval) {
            this.lastShotTime = millis();
            return this.shoot();
        }
        
        return null;
    }

    shoot() {
        let bullets = [];
        
        if (this.health > 30) { // Phase 0 - changed from 15 to 30
            // Simple aimed shot
            let dx = this.player.pos.x - this.pos.x;
            let dy = this.player.pos.y - this.pos.y;
            let angle = atan2(dy, dx);
            let vel = p5.Vector.fromAngle(angle).setMag(6);
            bullets.push(new Bullet(this.pos.x + this.displayWidth/2, this.pos.y + this.displayHeight/2, vel));
        } else if (this.health > 15) { // Phase 1 - changed from 10 to 15
            // Spiral pattern
            for (let i = 0; i < 8; i++) {
                let angle = (frameCount * 0.1) + (i * TWO_PI / 8);
                let vel = p5.Vector.fromAngle(angle).setMag(4);
                bullets.push(new Bullet(this.pos.x + this.displayWidth/2, this.pos.y + this.displayHeight/2, vel));
            }
        } else { // Phase 2
            // Random spray
            for (let i = 0; i < 5; i++) {
                let angle = random(-PI, PI);
                let vel = p5.Vector.fromAngle(angle).setMag(random(3, 7));
                bullets.push(new Bullet(this.pos.x + this.displayWidth/2, this.pos.y + this.displayHeight/2, vel));
            }
        }
        
        return bullets;
    }

    takeDamage(amount) {
        this.health -= amount;
        
        // Change phase if health threshold is crossed
        if (this.health <= 30 && this.phase === 0) { // Changed from 15 to 30
            this.phase = 1;
            this.shootInterval = 800; // Shoot faster in phase 1
            this.tint = this.phaseTints[1]; // Change tint
        } else if (this.health <= 15 && this.phase === 1) { // Changed from 10 to 15
            this.phase = 2;
            this.shootInterval = 500; // Shoot even faster in phase 2
            this.tint = this.phaseTints[2]; // Change tint
        }
        
        return this.health <= 0;
    }
    
    // Boss has a much more dramatic explosion
    createExplosion() {
        let explosions = [];
        
        let centerX = this.pos.x + this.displayWidth/2;
        let centerY = this.pos.y + this.displayHeight/2;
        
        // Main explosion (larger)
        explosions.push(new EnhancedExplosion(
            centerX, 
            centerY, 
            30, // Larger radius
            this.explosionColor, 
            this.explosionSecondaryColor,
            1.0,
            3,
            3 // Slower fade
        ));
        
        // Multiple ripples for boss
        for (let i = 1; i <= 5; i++) {
            explosions.push(new EnhancedExplosion(
                centerX, 
                centerY, 
                20 + i * 15, // Much larger ripples
                this.explosionColor, 
                this.explosionSecondaryColor,
                0.8 - (i * 0.12),
                3 + i * 0.4,
                2 + i * 0.5 // Variable fade rates
            ));
        }
        
        return explosions;
    }
  }
  
  // Level-specific boss classes
  class BossLevel1 extends BossEnemy {
    constructor(x, y, image, player) {
        super(x, y, image, player, 1);
    }
  }
  
  class BossLevel2 extends BossEnemy {
    constructor(x, y, image, player) {
        super(x, y, image, player, 2);
    }
  }
  
  class BossLevel3 extends BossEnemy {
    constructor(x, y, image, player) {
        super(x, y, image, player, 3);
    }
  }
  
  class BossLevel4 extends BossEnemy {
    constructor(x, y, image, player) {
        super(x, y, image, player, 4);
    }
  }
  
  // Factory function to create enemies based on type
  function createEnemy(type, x, y, player, enemyImages) {
    switch(type) {
      case 1: // Type 1 - Currently uses sine wave movement
        return new SineWaveEnemy(x, y, enemyImages[0], random(30, 80), random(0.01, 0.05), random(TWO_PI));
      case 2: // Type 2 - Currently a shooter that aims at player
        return new ShooterEnemy(x, y, enemyImages[1], player);
      case 3: // Type 3 - Currently a kamikaze that charges at player
        return new KamikazeEnemy(x, y, enemyImages[2], player);
      case 4: // Type 4 - Currently moves in formation with others
        // Create all 5 swarm enemies in a single file line
        let swarmEnemies = [];
        for (let i = 0; i < 5; i++) {
          // Space them horizontally with increasing distance from the right
          let enemyX = x + (i * 80); // 80 pixel spacing between each enemy
          // Initialize each with a different starting point in the path
          let enemy = new SwarmEnemy(enemyX, y, enemyImages[3], i);
          // Offset the path time to create a train effect
          enemy.pathTime = i * PI / 3; // Offset each enemy's starting position in the path
          swarmEnemies.push(enemy);
        }
        return swarmEnemies;
      case 5: // Type 5 - Currently a stationary turret with bullet patterns
        return new TurretEnemy(x, y, enemyImages[4]);
      case 6: // Type 6 - Currently drops mines
        return new MinelayerEnemy(x, y, enemyImages[5]);
      case 101: // Boss level 1
        return new BossLevel1(x, y, enemyImages[6], player);
      case 102: // Boss level 2
        return new BossLevel2(x, y, enemyImages[7], player);
      case 103: // Boss level 3
        return new BossLevel3(x, y, enemyImages[8], player);
      case 104: // Boss level 4
        return new BossLevel4(x, y, enemyImages[9], player);
      default:
        return new SineWaveEnemy(x, y, enemyImages[0]);
    }
  }
  
  // Function to spawn boss for current level
  function spawnBossForLevel(level, player, enemyImages) {
    let bossType = 100 + level; // 101 for level 1, 102 for level 2, etc.
    return createEnemy(bossType, width + 100, height/2, player, enemyImages);
  }
  
  // Function to spawn a wave of enemies
  function spawnEnemyWave(difficulty, player, enemyImages, currentLevel, bossDefeated) {
    let newEnemies = [];
    
    // Check if a boss is already present in the global enemies array
    // This should be passed in from the main game
    let bossPresent = window.enemies && window.enemies.some(enemy => enemy instanceof BossEnemy);
    
    // If a boss is already present, don't spawn any new enemies
    if (bossPresent) {
      return newEnemies; // Return empty array - no new enemies while boss is on screen
    }
    
    // If we haven't defeated the boss yet, difficulty is high enough, and no boss is present, spawn boss
    if (!bossDefeated && difficulty >= 5 && !bossPresent) {
      newEnemies.push(spawnBossForLevel(currentLevel, player, enemyImages));
      return newEnemies; // Only spawn boss, no other enemies
    }
    
    let numEnemies = floor(random(3, 6 + difficulty));
    
    // Determine which enemy types can spawn based on difficulty
    let availableTypes = [1]; // Always allow basic enemies
    
    if (difficulty >= 1) availableTypes.push(2); // Shooter
    if (difficulty >= 2) availableTypes.push(3, 4); // Kamikaze and Swarm
    if (difficulty >= 3) availableTypes.push(5, 6); // Turret and Minelayer
    
    // Count existing turret enemies in the global enemies array
    let turretCount = window.enemies ? window.enemies.filter(enemy => enemy instanceof TurretEnemy).length : 0;
    
    // Create regular enemies
    for (let i = 0; i < numEnemies; i++) {
      let type = random(availableTypes);
      
      // Limit turret spawning to 2
      if (type === 5 && turretCount >= 2) {
        // Skip this iteration and try a different enemy type
        i--; // Decrement i to try again
        continue;
      }
      
      let x = width + i * 80;
      let y = random(50, height - 50);
      
      let newEnemy = createEnemy(type, x, y, player, enemyImages);
      
      // Handle swarm enemies (which come in groups of 5)
      if (Array.isArray(newEnemy)) {
        newEnemies = newEnemies.concat(newEnemy);
        // Skip next few iterations since we added multiple enemies
        i += 4; // Skip 4 more iterations since we added 5 enemies
      } else {
        newEnemies.push(newEnemy);
        
        // Increment turret count if a turret is spawned
        if (newEnemy instanceof TurretEnemy) {
          turretCount++;
        }
      }
    }
    
    return newEnemies;
  }