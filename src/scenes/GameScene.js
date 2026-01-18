export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        // Level system
        this.level = data.level || 1;
        this.wave = 1;
        // Fewer waves = boss appears faster! Level 1 is quick intro
        this.wavesPerLevel = this.level === 1 ? 2 : 3;
        this.waveInProgress = false;

        // Player stats
        this.lives = 3;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.score = data.score || 0;
        this.isInvincible = false;
        this.isDead = false;

        // Player movement
        this.playerSpeed = 200;
        this.playerSpeedBoost = 1;

        // Weapon stats - faster firing to handle more enemies!
        this.bulletSpeed = 450;
        this.lastFired = 0;
        this.fireRate = 150; // Faster fire rate
        this.weaponLevel = data.weaponLevel || 1;

        // Boss state
        this.bossActive = false;
        this.boss = null;
        this.bossHP = 0;
        this.bossMaxHP = 0;

        // Timers
        this.shieldActive = false;
        this.shieldTimer = null;
        this.speedBoostTimer = null;

        // Fireball powerup (piercing shots)
        this.fireballActive = false;
        this.fireballTimer = null;

        // Touch controls
        this.touchPointer = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.playerStartX = 0;
        this.playerStartY = 0;
    }

    create() {
        // Create backgrounds based on level
        this.createBackgrounds();

        // Create player
        this.createPlayer();

        // Create groups
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.enemies = this.physics.add.group();
        this.powerups = this.physics.add.group();
        this.bossGroup = this.physics.add.group(); // Dedicated group for boss

        // Setup input
        this.setupInput();

        // Setup collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.playerHitByEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);

        // Create UI
        this.createUI();

        // Stop any previous music before starting new
        this.sound.stopAll();

        // Setup sounds
        this.sounds = {
            explosion: this.sound.add('sfx-explosion', { volume: 0.6 }),
            hit: this.sound.add('sfx-hit', { volume: 0.5 }),
            powerup: this.sound.add('sfx-powerup', { volume: 0.6 }),
            playerDeath: this.sound.add('sfx-player-death', { volume: 0.5 })
        };

        // Start level music
        const musicKey = `music-level${this.level}`;
        this.music = this.sound.add(musicKey, { loop: true, volume: 0.4 });
        this.music.play();

        // Show level intro then start
        this.showLevelIntro();
    }

    // ============== BACKGROUNDS ==============

    createBackgrounds() {
        // Clear any existing background elements
        this.bgLayers = [];

        // Use static images for backgrounds (no seams), tileSprites only for stars
        if (this.level === 1) {
            // Level 1: Deep space - static background, scrolling stars
            this.bg = this.add.image(240, 320, 'background')
                .setDisplaySize(480, 640);
            this.farPlanets = this.add.image(240, 320, 'far-planets')
                .setDisplaySize(480, 640);
            this.stars = this.add.tileSprite(0, 0, 480, 640, 'stars')
                .setOrigin(0, 0).setTileScale(2);

            this.bgLayers = [
                { sprite: this.stars, speed: 0.5, isTileSprite: true }
            ];
        } else if (this.level === 2) {
            // Level 2: Desert Canyon
            this.bg = this.add.image(240, 320, 'desert-bg')
                .setDisplaySize(480, 640);
            this.clouds = this.add.tileSprite(0, 0, 480, 640, 'desert-clouds')
                .setOrigin(0, 0).setTileScale(3).setAlpha(0.4);

            this.bgLayers = [
                { sprite: this.clouds, speed: 0.3, isTileSprite: true }
            ];
        } else if (this.level === 3) {
            // Level 3: Lava/Hell
            this.bg = this.add.image(240, 320, 'lava-bg')
                .setDisplaySize(480, 640);

            // Rising embers effect - reuse stars with orange tint, scrolling UP
            this.embers = this.add.tileSprite(0, 0, 480, 640, 'stars')
                .setOrigin(0, 0).setTileScale(2).setAlpha(0.5).setTint(0xff6600);

            // Animated lava flow at the bottom
            this.lavaSprites = [];
            for (let i = 0; i < 16; i++) {
                const lava = this.add.sprite(i * 32, 620, 'lava-flow')
                    .setScale(1).setOrigin(0, 0.5).setDepth(2);
                lava.play('lava-flow');
                lava.anims.setProgress(i * 0.0625); // Offset timing
                this.lavaSprites.push(lava);
            }

            this.bgLayers = [
                { sprite: this.embers, speed: -0.3, isTileSprite: true } // Negative = scroll up
            ];
        }
    }

    // ============== PLAYER ==============

    createPlayer() {
        this.player = this.physics.add.sprite(240, 550, 'ship');
        this.player.setScale(2.55);
        this.player.setCollideWorldBounds(true);
        this.player.play('ship-idle');
        this.player.setSize(10, 17);
        this.player.setDepth(10);

        this.shieldSprite = this.add.graphics();
        this.shieldSprite.setDepth(11);
    }

    setupInput() {
        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Debug: Z key to skip to boss immediately
        this.input.keyboard.on('keydown-Z', () => {
            if (!this.bossActive && !this.isDead) {
                // Stop current wave spawning
                if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
                // Clear all enemies
                this.enemies.clear(true, true);
                this.waveInProgress = false;
                // Start boss fight
                this.startBossFight();
            }
        });

        // Secret: X key to skip to next level
        this.input.keyboard.on('keydown-X', () => {
            if (!this.isDead && !this.isSkipping) {
                this.isSkipping = true;
                // Stop all spawning and clear enemies
                if (this.enemySpawnTimer) this.enemySpawnTimer.remove();
                this.enemies.clear(true, true);
                this.bossGroup.clear(true, true);
                this.enemyBullets.clear(true, true);
                this.bossActive = false;
                this.waveInProgress = false;

                if (this.level >= 3) {
                    // Victory!
                    this.scene.start('VictoryScene', { score: this.score });
                } else {
                    // Next level
                    this.scene.start('GameScene', {
                        level: this.level + 1,
                        score: this.score,
                        weaponLevel: this.weaponLevel
                    });
                }
            }
        });

        // Touch controls - relative movement (drag direction controls ship)
        this.input.on('pointerdown', (pointer) => {
            this.touchPointer = pointer;
            this.touchStartX = pointer.x;
            this.touchStartY = pointer.y;
            this.playerStartX = this.player.x;
            this.playerStartY = this.player.y;
        });

        this.input.on('pointermove', (pointer) => {
            if (pointer.isDown && !this.isDead && this.touchPointer) {
                // Calculate delta from touch start position
                const deltaX = pointer.x - this.touchStartX;
                const deltaY = pointer.y - this.touchStartY;

                // Apply delta to player's starting position
                const newX = this.playerStartX + deltaX;
                const newY = this.playerStartY + deltaY;

                this.player.x = Phaser.Math.Clamp(newX, 30, 450);
                this.player.y = Phaser.Math.Clamp(newY, 30, 610);
            }
        });

        this.input.on('pointerup', () => {
            this.touchPointer = null;
        });
    }

    // ============== UI ==============

    createUI() {
        // Score
        this.scoreText = this.add.text(16, 16, 'SCORE: ' + this.score, {
            fontFamily: 'monospace', fontSize: '18px',
            fill: '#fff', stroke: '#000', strokeThickness: 3
        }).setDepth(100);

        // Level & Wave
        this.levelText = this.add.text(240, 16, `LEVEL ${this.level}`, {
            fontFamily: 'monospace', fontSize: '18px',
            fill: '#ff0', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5, 0).setDepth(100);

        // Lives icon and text
        this.livesIcon = this.add.sprite(420, 22, 'ship', 0).setScale(1.2).setDepth(100);
        this.livesText = this.add.text(438, 14, this.lives.toString(), {
            fontFamily: 'monospace', fontSize: '20px',
            fill: '#0f0', stroke: '#000', strokeThickness: 3
        }).setDepth(100);

        // Health bar
        this.healthBarBg = this.add.rectangle(240, 620, 200, 14, 0x333333).setDepth(100);
        this.healthBar = this.add.rectangle(141, 620, 196, 10, 0x00ff00)
            .setOrigin(0, 0.5).setDepth(100);
        this.add.rectangle(240, 620, 200, 14).setStrokeStyle(2, 0xffffff).setDepth(100);

        // Announcement text
        this.announceText = this.add.text(240, 300, '', {
            fontFamily: 'monospace', fontSize: '42px',
            fill: '#fff', stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(100).setAlpha(0);

        // Boss health bar (hidden initially)
        this.createBossHealthBar();
    }

    createBossHealthBar() {
        this.bossHealthContainer = this.add.container(240, 60).setDepth(100).setVisible(false);

        const label = this.add.text(0, -20, 'BOSS', {
            fontFamily: 'monospace', fontSize: '16px',
            fill: '#f00', stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5);

        const bg = this.add.rectangle(0, 0, 300, 20, 0x333333);
        this.bossHealthBar = this.add.rectangle(-148, 0, 296, 16, 0xff0000).setOrigin(0, 0.5);
        const border = this.add.rectangle(0, 0, 300, 20).setStrokeStyle(2, 0xffffff);

        this.bossHealthContainer.add([label, bg, this.bossHealthBar, border]);
    }

    // ============== GAME LOOP ==============

    update(time) {
        if (this.isDead) return;

        // Scroll backgrounds
        this.bgLayers.forEach(layer => {
            layer.sprite.tilePositionY -= layer.speed;
        });

        // Level 2 planet movement
        if (this.level === 2) {
            if (this.bigPlanet) this.bigPlanet.y += 0.1;
            if (this.ringPlanet) this.ringPlanet.y += 0.15;
        }

        // Player
        this.handlePlayerMovement();
        this.handleShooting(time);
        this.updateShield();

        // Enemies
        this.updateEnemies(time);

        // Boss
        if (this.bossActive && this.boss) {
            this.updateBoss(time);
        }

        // Cleanup
        this.cleanupOffscreen();

        // Check wave/boss completion
        if (!this.bossActive) {
            this.checkWaveComplete();
        }
    }

    handlePlayerMovement() {
        // Skip if touch is active
        if (this.touchPointer && this.touchPointer.isDown) {
            this.player.play('ship-idle', true);
            return;
        }

        const { left, right, up, down } = this.cursors;
        let velocityX = 0;
        let velocityY = 0;
        const speed = this.playerSpeed * this.playerSpeedBoost;

        if (left.isDown || this.wasd.left.isDown) velocityX = -speed;
        else if (right.isDown || this.wasd.right.isDown) velocityX = speed;

        if (up.isDown || this.wasd.up.isDown) velocityY = -speed;
        else if (down.isDown || this.wasd.down.isDown) velocityY = speed;

        this.player.setVelocity(velocityX, velocityY);
        this.player.play(velocityY < 0 ? 'ship-thrust' : 'ship-idle', true);
    }

    handleShooting(time) {
        const isShooting = this.spaceKey.isDown ||
            (this.touchPointer && this.touchPointer.isDown);

        if (isShooting && time > this.lastFired) {
            this.fireBullet();
            this.lastFired = time + this.fireRate;
        }
    }

    fireBullet() {
        const x = this.player.x;
        const y = this.player.y - 20;

        if (this.weaponLevel === 1) {
            this.createBullet(x, y, 0);
        } else if (this.weaponLevel === 2) {
            this.createBullet(x - 15, y, 0);
            this.createBullet(x + 15, y, 0);
        } else {
            this.createBullet(x, y, 0);
            this.createBullet(x - 15, y + 5, -50);
            this.createBullet(x + 15, y + 5, 50);
        }
    }

    createBullet(x, y, velocityX) {
        if (this.fireballActive) {
            // Fireball - piercing shot
            const bullet = this.bullets.create(x, y, 'fireball');
            bullet.setScale(1.5);
            bullet.play('fireball-spin');
            bullet.body.setSize(20, 20);
            bullet.setVelocity(velocityX * 0.8, -this.bulletSpeed * 0.9);
            bullet.isPiercing = true; // Mark as piercing
        } else {
            // Normal laser
            const bullet = this.bullets.create(x, y, 'laser', 0);
            bullet.setScale(2);
            bullet.body.setSize(8, 14);
            bullet.setVelocity(velocityX, -this.bulletSpeed);
        }
    }

    updateShield() {
        this.shieldSprite.clear();
        if (this.shieldActive) {
            this.shieldSprite.lineStyle(3, 0x00ffff, 0.8);
            this.shieldSprite.strokeCircle(this.player.x, this.player.y, 35);
        }
    }

    // ============== WAVE SYSTEM ==============

    showLevelIntro() {
        this.announceText.setText(`LEVEL ${this.level}`);
        this.announceText.setAlpha(1);

        this.tweens.add({
            targets: this.announceText,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                this.time.delayedCall(500, () => this.startWave());
            }
        });
    }

    startWave() {
        if (this.wave > this.wavesPerLevel) {
            // All waves done, spawn boss
            this.startBossFight();
            return;
        }

        this.waveInProgress = true;
        this.levelText.setText(`LEVEL ${this.level} - WAVE ${this.wave}`);

        this.announceText.setText(`WAVE ${this.wave}`);
        this.announceText.setAlpha(1);
        this.tweens.add({
            targets: this.announceText,
            alpha: 0,
            duration: 1500,
            ease: 'Power2'
        });

        // Spawn enemies - MORE enemies for frantic gameplay!
        // Stage 2 and 3 get extra enemies for chaos
        const baseCount = 8 + (this.level * 4) + (this.wave * 4);
        let enemyCount = baseCount;
        if (this.level === 2) enemyCount = baseCount + 4;
        if (this.level === 3) enemyCount = baseCount + 6;
        this.spawnWaveEnemies(enemyCount);
    }

    spawnWaveEnemies(count) {
        let spawned = 0;
        // Much faster spawn rate for frantic action! Stage 3 is even faster
        let spawnDelay = Math.max(250, 800 - (this.level * 80) - (this.wave * 40));
        if (this.level === 3) spawnDelay = Math.max(180, spawnDelay - 50);

        this.enemySpawnTimer = this.time.addEvent({
            delay: spawnDelay,
            callback: () => {
                if (spawned < count && !this.isDead && !this.bossActive) {
                    this.spawnEnemy();
                    spawned++;
                }
            },
            repeat: count - 1
        });
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(50, 430);
        const rand = Math.random();
        // Higher chances for tougher enemies = more chaos!
        const bigChance = Math.min(0.08 + (this.level * 0.06) + (this.wave * 0.03), 0.30);
        const mediumChance = Math.min(0.25 + (this.level * 0.08) + (this.wave * 0.04), 0.50);

        if (rand < bigChance) {
            this.createBigEnemy(x);
        } else if (rand < bigChance + mediumChance) {
            this.createMediumEnemy(x);
        } else {
            // Stage 2+: 25% chance to spawn a conga line of small enemies
            if (this.level >= 2 && Math.random() < 0.25) {
                this.spawnCongaLine(x);
            } else {
                this.createSmallEnemy(x);
            }
        }
    }

    spawnCongaLine(x) {
        const count = Phaser.Math.Between(3, 4);
        for (let i = 0; i < count; i++) {
            this.time.delayedCall(i * 150, () => {
                if (!this.isDead && !this.bossActive) {
                    this.createSmallEnemy(x + Phaser.Math.Between(-20, 20));
                }
            });
        }
    }

    createSmallEnemy(x) {
        // Level-specific sprites - normalized to ~48px display size
        const sprites = {
            1: { key: 'enemy-small', anim: 'enemy-small-fly', scale: 3, size: [14, 14] },       // 16*3=48
            2: { key: 'l2-enemy-small', anim: 'l2-enemy-small-fly', scale: 1.0, size: [40, 40] }, // 48*1=48
            3: { key: 'l3-enemy-small', anim: 'l3-enemy-small-fly', scale: 0.45, size: [45, 50] } // 112*0.45=50
        };
        const s = sprites[this.level] || sprites[1];

        const enemy = this.enemies.create(x, -30, s.key);
        enemy.setScale(s.scale);
        enemy.play(s.anim);
        enemy.setSize(s.size[0], s.size[1]);
        enemy.enemyType = 'small';
        enemy.health = 1;
        enemy.points = 100;
        enemy.setVelocityY(Phaser.Math.Between(120 + this.level * 20, 220 + this.level * 25));
        // Stage 2 enemies drift more
        const driftAmount = this.level === 2 ? 100 : 60;
        enemy.setVelocityX(Phaser.Math.Between(-driftAmount, driftAmount));
    }

    createMediumEnemy(x) {
        // Level-specific sprites - normalized to ~80-90px display size
        const sprites = {
            1: { key: 'enemy-medium', anim: 'enemy-medium-fly', scale: 3, size: [28, 14], rotate: false },   // 32*3=96
            2: { key: 'l2-enemy-medium', anim: 'l2-enemy-medium-fly', scale: 1.8, size: [40, 40], rotate: false }, // 48*1.8=86
            3: { key: 'l3-enemy-medium', anim: 'l3-enemy-medium-fly', scale: 0.85, size: [75, 75], rotate: false } // 101*0.85=86
        };
        const s = sprites[this.level] || sprites[1];

        const enemy = this.enemies.create(x, -30, s.key);
        enemy.setScale(s.scale);
        if (s.rotate) enemy.setAngle(90); // Rotate side-facing sprites to face down
        enemy.play(s.anim);
        enemy.setSize(s.size[0], s.size[1]);
        enemy.enemyType = 'medium';
        enemy.health = 2;
        enemy.points = 200;
        enemy.canShoot = true;
        enemy.lastShot = 0;
        // Stage 3 has slower fire rate to balance difficulty
        const minDelay = this.level === 3 ? 700 : 800 - this.level * 100;
        const maxDelay = this.level === 3 ? 1400 : 1500 - this.level * 150;
        enemy.shootDelay = Phaser.Math.Between(minDelay, maxDelay);
        enemy.setVelocityY(Phaser.Math.Between(80, 140));
        enemy.setVelocityX(Phaser.Math.Between(-40, 40));

        // Wobble movement for stage 2+
        if (this.level >= 2) {
            enemy.wobble = true;
            enemy.wobblePhase = Math.random() * Math.PI * 2;
            enemy.wobbleSpeed = Phaser.Math.Between(3, 5);
            enemy.wobbleAmount = Phaser.Math.Between(40, 70);
        }
    }

    createBigEnemy(x) {
        // Level-specific sprites - normalized to ~80px display size
        const sprites = {
            1: { key: 'enemy-big', anim: 'enemy-big-fly', scale: 2.5, size: [28, 28] },     // 32*2.5=80
            2: { key: 'l2-enemy-big', anim: 'l2-enemy-big-fly', scale: 1.7, size: [40, 40] }, // 48*1.7=82
            3: { key: 'l3-enemy-big', anim: 'l3-enemy-big-fly', scale: 1.7, size: [40, 40], rotate: false } // 48*1.7=82
        };
        const s = sprites[this.level] || sprites[1];

        const enemy = this.enemies.create(x, -50, s.key);
        enemy.setScale(s.scale);
        if (s.rotate) enemy.setAngle(90); // Rotate side-facing sprites to face down
        enemy.play(s.anim);
        enemy.setSize(s.size[0], s.size[1]);
        enemy.enemyType = 'big';
        enemy.health = 3 + this.level;
        enemy.points = 500;
        enemy.canShoot = true;
        enemy.lastShot = 0;
        // Stage 3 has slower fire rate to balance difficulty
        enemy.shootDelay = this.level === 3 ? Phaser.Math.Between(700, 1200) : Phaser.Math.Between(500, 1000);
        enemy.setVelocityY(Phaser.Math.Between(50, 90));
        enemy.trackPlayer = true;

        // Erratic speed bursts for stage 3
        if (this.level === 3) {
            enemy.erraticSpeed = true;
            enemy.nextSpeedChange = 0;
        }
    }

    updateEnemies(time) {
        this.enemies.getChildren().forEach(enemy => {
            // Skip if enemy was destroyed
            if (!enemy || !enemy.active) return;

            if (enemy.y > 680) {
                enemy.destroy();
                return;
            }

            if (enemy.canShoot && time > enemy.lastShot + enemy.shootDelay) {
                this.enemyShoot(enemy);
                enemy.lastShot = time;
            }

            if (enemy.trackPlayer && this.player && this.player.active) {
                const dx = this.player.x - enemy.x;
                enemy.setVelocityX(dx * 0.5);
            }

            // Wobble movement for medium enemies (stage 2+)
            if (enemy.wobble) {
                enemy.wobblePhase += 0.05 * enemy.wobbleSpeed;
                const wobbleX = Math.sin(enemy.wobblePhase) * enemy.wobbleAmount;
                enemy.setVelocityX(wobbleX);
            }

            // Erratic speed bursts for big enemies (stage 3)
            if (enemy.erraticSpeed && time > enemy.nextSpeedChange) {
                const burst = Phaser.Math.Between(0, 1) === 0;
                enemy.setVelocityY(burst ? Phaser.Math.Between(120, 180) : Phaser.Math.Between(40, 70));
                enemy.nextSpeedChange = time + Phaser.Math.Between(400, 1000);
            }
        });
    }

    enemyShoot(enemy) {
        // Safety check
        if (!enemy || !enemy.active || !this.player || !this.player.active) return;

        const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, 'laser', 2);
        bullet.setScale(2);
        bullet.setTint(0xff0000);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }

    checkWaveComplete() {
        if (!this.waveInProgress) return;

        const spawnDone = !this.enemySpawnTimer ||
            this.enemySpawnTimer.getRepeatCount() === 0;
        const enemiesCleared = this.enemies.countActive() === 0;

        if (spawnDone && enemiesCleared) {
            this.waveInProgress = false;
            this.wave++;

            this.time.delayedCall(2000, () => {
                if (!this.isDead) this.startWave();
            });
        }
    }

    // ============== BOSS FIGHT ==============

    startBossFight() {
        this.bossActive = true;

        this.announceText.setText('WARNING!\nBOSS APPROACHING');
        this.announceText.setFill('#ff0000');
        this.announceText.setAlpha(1);

        // Flash warning
        this.tweens.add({
            targets: this.announceText,
            alpha: { from: 1, to: 0.3 },
            duration: 200,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                this.announceText.setAlpha(0);
                this.announceText.setFill('#ffffff');
                this.spawnBoss();
            }
        });

        // Screen shake
        this.cameras.main.shake(500, 0.01);
    }

    spawnBoss() {
        // Clear the boss group first
        this.bossGroup.clear(true, true);

        // Level-specific boss configuration
        const bossConfigs = {
            1: {
                key: 'boss',
                anim: 'boss-idle',
                scale: 1.2,
                hitbox: { w: 160, h: 100, ox: 16, oy: 22 }
            },
            2: {
                key: 'fire-skull',
                anim: 'fire-skull-idle',
                scale: 2.25,
                hitbox: { w: 120, h: 135, ox: -12, oy: -12 }
            },
            3: {
                key: 'demon-idle',
                anim: 'demon-idle',
                scale: 1.8,
                hitbox: { w: 200, h: 180, ox: -20, oy: -18 }
            }
        };
        const config = bossConfigs[this.level] || bossConfigs[1];

        // Create boss and add to dedicated boss group
        this.boss = this.bossGroup.create(240, -100, config.key);
        this.boss.setScale(config.scale);
        this.boss.play(config.anim);
        this.boss.setDepth(5);

        // Store boss type for later reference
        this.boss.bossType = this.level;

        // Boss stats scale with level - ULTRA TANKY BOSS!
        // Store HP at SCENE level, not on sprite, to avoid any Phaser conflicts
        this.bossMaxHP = 1000; // Simple: 1000 HP, 10 damage per bullet = 100 hits to kill
        this.bossHP = this.bossMaxHP;
        this.boss.points = 5000 * this.level;
        this.boss.lastShot = 0; // Will be set properly when active

        // Mark this sprite as THE boss so we can identify it even if this.boss reference is lost
        this.boss.isBossSprite = true;

        this.boss.shootPattern = 0;
        this.boss.phaseTime = 0;

        // Set hitbox based on boss config
        this.boss.body.setSize(config.hitbox.w, config.hitbox.h);
        this.boss.body.setOffset(config.hitbox.ox, config.hitbox.oy);

        // Boss is invincible during entry
        this.boss.isEntering = true;

        // Reset boss health bar to full
        this.bossHealthBar.setScale(1, 1);

        // Enter animation
        this.tweens.add({
            targets: this.boss,
            y: 120,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                // NOW enable collisions after boss is visible - use bossGroup for clean collision handling
                this.bossCollider = this.physics.add.overlap(this.bullets, this.bossGroup, this.hitBoss, null, this);
                this.bossPlayerCollider = this.physics.add.overlap(this.player, this.bossGroup, this.playerHitByEnemy, null, this);

                this.bossHealthContainer.setVisible(true);
                this.boss.isEntering = false;
                this.boss.movementPhase = 'active';

                // Initialize lastShot to current time so boss shoots after first delay
                this.boss.lastShot = this.time.now;

                // Fire immediately on entry!
                this.bossShoot();
            }
        });
    }

    updateBoss(time) {
        if (!this.boss || !this.boss.active) return;
        if (this.boss.movementPhase !== 'active') return;

        // Movement pattern
        this.boss.phaseTime += 16;
        const moveX = Math.sin(this.boss.phaseTime * 0.002) * 100;
        this.boss.x = 240 + moveX;

        // Shooting patterns based on health
        // Use scene-level HP variables
        const healthPercent = this.bossHP / this.bossMaxHP;
        const bossType = this.boss.bossType || 1;
        let shootDelay = 600;

        if (bossType === 1) {
            // Boss 1: Easy - no phase changes, consistent speed
            shootDelay = 700;
            this.boss.shootPattern = 0;
        } else {
            // Boss 2 & 3: Progressive difficulty with phases
            if (healthPercent < 0.3) {
                shootDelay = 300;
                this.boss.shootPattern = 2;
            } else if (healthPercent < 0.6) {
                shootDelay = 450;
                this.boss.shootPattern = 1;
            } else {
                shootDelay = 600;
                this.boss.shootPattern = 0;
            }
        }

        if (time > this.boss.lastShot + shootDelay) {
            this.bossShoot();
            this.boss.lastShot = time;
        }

        // Update damage visual feedback
        if (this.boss.bossType === 1) {
            // Original boss has damage frames
            if (healthPercent < 0.3) {
                this.boss.play('boss-damage-3', true);
            } else if (healthPercent < 0.6) {
                this.boss.play('boss-damage-2', true);
            } else if (healthPercent < 0.85) {
                this.boss.play('boss-damage-1', true);
            }
        } else {
            // Other bosses use tint for damage feedback
            if (healthPercent < 0.3) {
                this.boss.setTint(0xff0000); // Red when critical
            } else if (healthPercent < 0.6) {
                this.boss.setTint(0xff8800); // Orange when damaged
            } else {
                this.boss.clearTint(); // Normal
            }
        }
    }

    bossShoot() {
        const bossType = this.boss.bossType || 1;

        if (bossType === 1) {
            // BOSS 1: Original - Simple attacks, no intense phases
            // Only uses pattern 0 (simple spread)
            for (let i = -1; i <= 1; i++) {
                const bullet = this.enemyBullets.create(this.boss.x + i * 40, this.boss.y + 60, 'laser', 2);
                bullet.setScale(2);
                bullet.setTint(0xff0000);
                bullet.setVelocity(i * 60, 200);
            }
        } else if (bossType === 2) {
            // BOSS 2: Fire Skull - Fireballs with varying patterns
            if (this.boss.shootPattern === 0) {
                // Wide fire spread (5 bullets in arc)
                for (let i = -2; i <= 2; i++) {
                    const bullet = this.enemyBullets.create(this.boss.x, this.boss.y + 60, 'laser', 2);
                    bullet.setScale(2);
                    bullet.setTint(0xff6600);
                    bullet.setVelocity(i * 70, 180);
                }
            } else if (this.boss.shootPattern === 1) {
                // Homing fireballs (3 that track player)
                for (let i = -1; i <= 1; i++) {
                    const bullet = this.enemyBullets.create(this.boss.x + i * 60, this.boss.y + 50, 'laser', 2);
                    bullet.setScale(2);
                    bullet.setTint(0xff4400);
                    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                    bullet.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
                }
            } else {
                // Fire rain - random fireballs dropping
                for (let i = 0; i < 5; i++) {
                    const x = this.boss.x + Phaser.Math.Between(-100, 100);
                    const bullet = this.enemyBullets.create(x, this.boss.y + 40, 'laser', 2);
                    bullet.setScale(2);
                    bullet.setTint(0xff2200);
                    bullet.setVelocity(Phaser.Math.Between(-30, 30), Phaser.Math.Between(200, 280));
                }
            }
        } else if (bossType === 3) {
            // BOSS 3: Demon - Blue fire breath and dark magic attacks
            if (this.boss.shootPattern === 0) {
                // Blue fire breath - wide spreading flames
                for (let i = -3; i <= 3; i++) {
                    const bullet = this.enemyBullets.create(this.boss.x + i * 25, this.boss.y + 80, 'laser', 2);
                    bullet.setScale(2);
                    bullet.setTint(0x00ccff); // Blue fire
                    bullet.setVelocity(i * 60, 200);
                }
            } else if (this.boss.shootPattern === 1) {
                // Dark orbs - homing projectiles from wings
                for (let i = -1; i <= 1; i++) {
                    const bullet = this.enemyBullets.create(this.boss.x + i * 80, this.boss.y + 40, 'laser', 2);
                    bullet.setScale(2);
                    bullet.setTint(0x8800ff); // Purple dark magic
                    const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, this.player.x, this.player.y);
                    bullet.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220);
                }
            } else {
                // Demon fury - spiral fire + rain of flames
                for (let i = 0; i < 10; i++) {
                    const angle = (this.boss.phaseTime * 0.025) + (i * Math.PI / 5);
                    const bullet = this.enemyBullets.create(this.boss.x, this.boss.y + 60, 'laser', 2);
                    bullet.setScale(2);
                    bullet.setTint(0x00aaff); // Blue flames
                    bullet.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 180 + 100);
                }
            }
        }
    }

    hitBoss(bullet, boss) {
        // Safety check - make sure boss exists and is valid
        if (!boss || !boss.active || !this.bossActive) {
            bullet.destroy();
            return;
        }

        // Piercing bullets don't get destroyed but track hits
        if (bullet.isPiercing) {
            if (!bullet.hitBoss) bullet.hitBoss = false;
            if (bullet.hitBoss) return; // Already hit boss this pass
            bullet.hitBoss = true;
            // Reset after a short delay so it can hit again if still in contact
            this.time.delayedCall(200, () => {
                if (bullet.active) bullet.hitBoss = false;
            });
        } else {
            bullet.destroy();
        }

        // Each bullet does 10 damage (fireballs do 5 vs boss since they pierce)
        const damage = bullet.isPiercing ? 5 : 10;
        this.bossHP = Math.max(0, this.bossHP - damage);

        // Update health bar using scene-level HP
        const healthPercent = this.bossHP / this.bossMaxHP;
        this.bossHealthBar.setScale(Math.max(0, healthPercent), 1);

        // Change health bar color based on health
        if (healthPercent < 0.3) {
            this.bossHealthBar.setFillStyle(0xff0000); // Red when critical
        } else if (healthPercent < 0.6) {
            this.bossHealthBar.setFillStyle(0xff8800); // Orange when damaged
        }

        // Flash effect
        boss.setTint(0xffffff);
        this.time.delayedCall(50, () => {
            const tints = [0xffffff, 0x8888ff, 0xffdd00];
            if (boss && boss.active) boss.setTint(tints[this.level - 1]);
        });

        // Only defeat boss when health reaches 0 - use SCENE-LEVEL HP
        if (this.bossHP <= 0 && this.bossActive) {
            this.defeatBoss();
        }
    }

    defeatBoss() {
        // Prevent multiple calls
        if (!this.bossActive) {
            return;
        }

        this.bossActive = false;
        this.bossHealthContainer.setVisible(false);

        // Remove colliders safely
        if (this.bossCollider) {
            this.bossCollider.destroy();
            this.bossCollider = null;
        }
        if (this.bossPlayerCollider) {
            this.bossPlayerCollider.destroy();
            this.bossPlayerCollider = null;
        }

        // Store boss position for explosions
        const bossX = this.boss ? this.boss.x : 240;
        const bossY = this.boss ? this.boss.y : 120;
        const bossPoints = 5000 * this.level;

        // Hide boss immediately
        if (this.boss) {
            this.boss.setVisible(false);
            if (this.boss.body) this.boss.body.enable = false;
        }

        // Multiple explosions
        for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 200, () => {
                const x = bossX + Phaser.Math.Between(-80, 80);
                const y = bossY + Phaser.Math.Between(-60, 60);
                this.createExplosion(x, y, 'boss');
                this.cameras.main.shake(100, 0.02);
            });
        }

        // Final big explosion and level complete
        this.time.delayedCall(1600, () => {
            this.createExplosion(bossX, bossY, 'boss');
            this.createExplosion(bossX - 40, bossY - 20, 'boss');
            this.createExplosion(bossX + 40, bossY + 20, 'boss');
            this.cameras.main.shake(300, 0.03);

            this.score += bossPoints;
            this.scoreText.setText('SCORE: ' + this.score);

            // Clear boss group and reference
            this.bossGroup.clear(true, true);
            this.boss = null;

            // Level complete after short delay
            this.time.delayedCall(1500, () => this.levelComplete());
        });
    }

    levelComplete() {

        // Save progress
        const bestLevel = parseInt(localStorage.getItem('bestLevel')) || 0;
        if (this.level > bestLevel) {
            localStorage.setItem('bestLevel', this.level);
        }

        if (this.level >= 3) {
            // Game complete!
            this.music.stop();
            this.scene.start('VictoryScene', { score: this.score });
        } else {
            // Next level - music keeps playing until next stage loads
            this.announceText.setText('LEVEL COMPLETE!');
            this.announceText.setAlpha(1);

            this.time.delayedCall(2500, () => {
                this.scene.start('GameScene', {
                    level: this.level + 1,
                    score: this.score,
                    weaponLevel: this.weaponLevel
                });
            });
        }
    }

    // ============== COLLISIONS ==============

    hitEnemy(bullet, enemy) {
        // Safety check - skip if already destroyed
        if (!enemy || !enemy.active || !bullet || !bullet.active) return;

        // CRITICAL: Never process the boss through this function
        // Check both the flag AND if it's in the bossGroup
        if (enemy.isBossSprite || this.bossGroup.contains(enemy)) {
            console.warn('hitEnemy called with boss sprite! Redirecting to hitBoss.');
            // Don't destroy bullet here - let hitBoss handle it
            return;
        }

        // Piercing bullets don't get destroyed (but have cooldown per enemy)
        if (bullet.isPiercing) {
            // Track which enemies this bullet has hit
            if (!bullet.hitEnemies) bullet.hitEnemies = new Set();
            if (bullet.hitEnemies.has(enemy)) return; // Already hit this enemy
            bullet.hitEnemies.add(enemy);
        } else {
            bullet.destroy();
        }

        enemy.health--;

        if (enemy.health <= 0) {
            this.createExplosion(enemy.x, enemy.y, enemy.enemyType);
            this.maybeDropPowerup(enemy.x, enemy.y);
            this.score += enemy.points;
            this.scoreText.setText('SCORE: ' + this.score);
            enemy.destroy();
        } else {
            enemy.setTint(0xff0000);
            this.time.delayedCall(100, () => {
                if (enemy.active) enemy.clearTint();
            });
        }
    }

    playerHitByEnemy(player, enemy) {
        // Safety check
        if (!enemy || !enemy.active || !player || !player.active) return;

        // Check if this is the boss - use multiple checks for safety
        const isBoss = (this.boss && enemy === this.boss) ||
                       enemy.isBossSprite === true ||
                       this.bossGroup.contains(enemy);

        if (this.isInvincible || this.shieldActive) {
            if (!isBoss && enemy.active) {
                this.createExplosion(enemy.x, enemy.y, enemy.enemyType || 'small');
                enemy.destroy();
            }
            return;
        }

        this.takeDamage(isBoss ? 30 : 50);
        if (!isBoss && enemy.active) {
            this.createExplosion(enemy.x, enemy.y, enemy.enemyType || 'small');
            enemy.destroy();
        }
    }

    playerHitByBullet(player, bullet) {
        if (this.isInvincible || this.shieldActive) {
            bullet.destroy();
            return;
        }
        this.takeDamage(20);
        bullet.destroy();
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();

        // Play hit sound
        this.sounds.hit.play();

        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (this.player.active) this.player.clearTint();
        });

        this.cameras.main.shake(100, 0.01);

        if (this.health <= 0) this.loseLife();
    }

    updateHealthBar() {
        const pct = Math.max(0, this.health / this.maxHealth);
        this.healthBar.setScale(pct, 1);
        this.healthBar.setFillStyle(pct > 0.6 ? 0x00ff00 : pct > 0.3 ? 0xffff00 : 0xff0000);
    }

    loseLife() {
        this.lives--;
        this.livesText.setText(this.lives.toString());

        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.respawn();
        }
    }

    respawn() {
        this.health = this.maxHealth;
        this.updateHealthBar();
        this.createExplosion(this.player.x, this.player.y, 'big');

        this.player.setPosition(240, 550);
        this.player.setVelocity(0, 0);

        this.isInvincible = true;
        this.tweens.add({
            targets: this.player,
            alpha: { from: 0.3, to: 0.8 },
            duration: 100,
            repeat: 15,
            yoyo: true,
            onComplete: () => {
                this.isInvincible = false;
                this.player.setAlpha(1);
            }
        });
    }

    gameOver() {
        this.isDead = true;
        this.createExplosion(this.player.x, this.player.y, 'big');
        this.sounds.playerDeath.play();
        this.music.stop();
        this.player.setVisible(false);
        this.player.body.enable = false;

        if (this.enemySpawnTimer) this.enemySpawnTimer.remove();

        // Save stats
        const highScore = parseInt(localStorage.getItem('highScore')) || 0;
        if (this.score > highScore) localStorage.setItem('highScore', this.score);

        const bestWave = parseInt(localStorage.getItem('bestWave')) || 0;
        const totalWave = (this.level - 1) * this.wavesPerLevel + this.wave;
        if (totalWave > bestWave) localStorage.setItem('bestWave', totalWave);

        this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene', { score: this.score, level: this.level, wave: this.wave });
        });
    }

    // ============== POWER-UPS ==============

    maybeDropPowerup(x, y) {
        // 20% drop rate
        if (Math.random() > 0.20) return;

        const weights = [0.30, 0.25, 0.20, 0.05, 0.20]; // weapon, shield, speed, life, fireball
        const types = ['weapon', 'shield', 'speed', 'life', 'fireball'];
        let rand = Math.random();
        let type = 'weapon';

        for (let i = 0; i < weights.length; i++) {
            if (rand < weights[i]) { type = types[i]; break; }
            rand -= weights[i];
        }

        const frameMap = { weapon: 0, shield: 1, speed: 2, life: 3, fireball: 0 };
        const powerup = this.powerups.create(x, y, 'powerup', frameMap[type]);
        powerup.setScale(2.5);
        powerup.powerupType = type;
        powerup.setVelocityY(80);

        // Fireball powerup has orange tint to distinguish from weapon
        if (type === 'fireball') powerup.setTint(0xff6600);

        this.tweens.add({
            targets: powerup,
            scale: { from: 2.5, to: 3 },
            duration: 300,
            yoyo: true,
            repeat: -1
        });
    }

    collectPowerup(player, powerup) {
        const type = powerup.powerupType;

        // Play powerup sound
        this.sounds.powerup.play();

        const messages = {
            weapon: ['WEAPON UP!', 0xff8800],
            shield: ['SHIELD!', 0x00ffff],
            speed: ['SPEED BOOST!', 0x00ff00],
            life: ['EXTRA LIFE!', 0xff00ff],
            fireball: ['FIREBALL!', 0xff4400]
        };

        if (type === 'weapon') this.weaponLevel = Math.min(this.weaponLevel + 1, 3);
        else if (type === 'shield') this.activateShield();
        else if (type === 'speed') this.activateSpeedBoost();
        else if (type === 'fireball') this.activateFireball();
        else if (type === 'life') {
            this.lives++;
            this.livesText.setText(this.lives.toString());
        }

        this.showPowerupText(messages[type][0], messages[type][1]);
        powerup.destroy();
    }

    activateShield() {
        this.shieldActive = true;
        if (this.shieldTimer) this.shieldTimer.remove();
        this.shieldTimer = this.time.delayedCall(5000, () => this.shieldActive = false);
    }

    activateSpeedBoost() {
        this.playerSpeedBoost = 1.5;
        if (this.speedBoostTimer) this.speedBoostTimer.remove();
        this.speedBoostTimer = this.time.delayedCall(5000, () => this.playerSpeedBoost = 1);
    }

    activateFireball() {
        this.fireballActive = true;
        if (this.fireballTimer) this.fireballTimer.remove();
        // Fireball lasts 8 seconds
        this.fireballTimer = this.time.delayedCall(8000, () => this.fireballActive = false);
    }

    showPowerupText(text, color) {
        const t = this.add.text(this.player.x, this.player.y - 50, text, {
            fontFamily: 'monospace', fontSize: '20px',
            fill: '#' + color.toString(16).padStart(6, '0'),
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);

        this.tweens.add({
            targets: t, y: t.y - 50, alpha: 0, duration: 1000,
            onComplete: () => t.destroy()
        });
    }

    // ============== EXPLOSIONS & CLEANUP ==============

    createExplosion(x, y, type) {
        const config = {
            small: ['explosion', 'explode', 4],
            medium: ['explosion-large', 'explode-large', 2.5],
            big: ['explosion-big', 'explode-big', 2],
            boss: ['explosion-boss', 'explode-boss', 1.5]
        };

        const [sprite, anim, scale] = config[type] || config.small;
        const explosion = this.add.sprite(x, y, sprite).setScale(scale).setDepth(50);
        explosion.play(anim);
        explosion.on('animationcomplete', () => explosion.destroy());

        // Play explosion sound
        this.sounds.explosion.play();

        if (type === 'big' || type === 'boss') {
            this.cameras.main.shake(200, 0.02);
        }
    }

    cleanupOffscreen() {
        this.bullets.getChildren().forEach(b => { if (b.y < -20) b.destroy(); });
        this.enemyBullets.getChildren().forEach(b => {
            if (b.y > 660 || b.y < -20 || b.x < -20 || b.x > 500) b.destroy();
        });
        this.powerups.getChildren().forEach(p => { if (p.y > 660) p.destroy(); });
    }
}
