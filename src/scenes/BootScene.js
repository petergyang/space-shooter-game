export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Show loading progress
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
            font: '20px monospace',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // ============== MUSIC ==============

        this.load.audio('music-title', 'assets/music/title.wav');
        this.load.audio('music-level1', 'assets/music/level1.wav');
        this.load.audio('music-level2', 'assets/music/level2.wav');
        this.load.audio('music-level3', 'assets/music/level3.wav');
        this.load.audio('music-ending', 'assets/music/ending.wav');

        // ============== SOUND EFFECTS ==============

        this.load.audio('sfx-explosion', 'assets/sounds/explosion.wav');
        this.load.audio('sfx-hit', 'assets/sounds/hit.wav');
        this.load.audio('sfx-powerup', 'assets/sounds/powerup.wav');
        this.load.audio('sfx-player-death', 'assets/sounds/player-death.wav');
        this.load.audio('sfx-boss-warning', 'assets/sounds/boss-warning.wav');

        // ============== PLAYER & ENEMIES ==============

        this.load.spritesheet('ship', 'assets/sprites/ship.png', {
            frameWidth: 16, frameHeight: 24
        });

        this.load.spritesheet('enemy-small', 'assets/sprites/enemy-small.png', {
            frameWidth: 16, frameHeight: 16
        });

        this.load.spritesheet('enemy-medium', 'assets/sprites/enemy-medium.png', {
            frameWidth: 32, frameHeight: 16
        });

        this.load.spritesheet('enemy-big', 'assets/sprites/enemy-big.png', {
            frameWidth: 32, frameHeight: 32
        });

        // Boss: 960x144, 5 frames of 192x144
        this.load.spritesheet('boss', 'assets/sprites/boss.png', {
            frameWidth: 192, frameHeight: 144
        });

        // Boss thrust: 256x48, 4 frames of 64x48
        this.load.spritesheet('boss-thrust', 'assets/sprites/boss-thrust.png', {
            frameWidth: 64, frameHeight: 48
        });

        // ============== PROJECTILES & POWERUPS ==============

        this.load.spritesheet('laser', 'assets/sprites/laser-bolts.png', {
            frameWidth: 16, frameHeight: 16
        });

        // Fireball projectile (78x26, 3 frames of 26x26)
        this.load.spritesheet('fireball', 'assets/sprites/fireball.png', {
            frameWidth: 26, frameHeight: 26
        });

        this.load.spritesheet('powerup', 'assets/sprites/power-up.png', {
            frameWidth: 16, frameHeight: 16
        });

        // ============== EXPLOSIONS ==============

        this.load.spritesheet('explosion', 'assets/sprites/explosion.png', {
            frameWidth: 16, frameHeight: 16
        });

        this.load.spritesheet('explosion-large', 'assets/sprites/explosion-large.png', {
            frameWidth: 32, frameHeight: 32
        });

        this.load.spritesheet('explosion-big', 'assets/sprites/explosion-big.png', {
            frameWidth: 64, frameHeight: 64
        });

        // Boss explosion: 560x80, 7 frames of 80x80
        this.load.spritesheet('explosion-boss', 'assets/sprites/explosion-boss.png', {
            frameWidth: 80, frameHeight: 80
        });

        // ============== BACKGROUNDS ==============

        // Level 1: Deep space
        this.load.image('background', 'assets/backgrounds/parallax-space-backgound.png');
        this.load.image('stars', 'assets/backgrounds/parallax-space-stars.png');
        this.load.image('far-planets', 'assets/backgrounds/parallax-space-far-planets.png');

        // Level 2: Desert Canyon
        this.load.image('desert-bg', 'assets/backgrounds/level2/desert-backgorund.png');
        this.load.image('desert-clouds', 'assets/backgrounds/level2/clouds.png');

        // Level 3: Lava/Hell
        this.load.image('lava-bg', 'assets/backgrounds/level3/lava-background.png');
        // Animated lava flow (96x32, 3 frames of 32x32)
        this.load.spritesheet('lava-flow', 'assets/backgrounds/level3/lava-flow.png', {
            frameWidth: 32, frameHeight: 32
        });

        // ============== LEVEL 2 ENEMIES (Desert) ==============

        // Green mech - small (240x48, 5 frames)
        this.load.spritesheet('l2-enemy-small', 'assets/sprites/level2/enemy-01.png', {
            frameWidth: 48, frameHeight: 48
        });

        // Blue robot - medium (192x48, 4 frames)
        this.load.spritesheet('l2-enemy-medium', 'assets/sprites/level2/enemy-02.png', {
            frameWidth: 48, frameHeight: 48
        });

        // Red armored - big (192x48, 4 frames)
        this.load.spritesheet('l2-enemy-big', 'assets/sprites/level2/enemy-03.png', {
            frameWidth: 48, frameHeight: 48
        });

        // Fire Skull boss (768x112, 8 frames)
        this.load.spritesheet('fire-skull', 'assets/sprites/level2/fire-skull.png', {
            frameWidth: 96, frameHeight: 112
        });

        // ============== LEVEL 3 ENEMIES (Lava/Hell) ==============

        // Bat - small (48x16, 3 frames of 16x16)
        this.load.spritesheet('l3-enemy-small', 'assets/sprites/level3/bat.png', {
            frameWidth: 16, frameHeight: 16
        });

        // Ghost - medium (48x16, 3 frames of 16x16)
        this.load.spritesheet('l3-enemy-medium', 'assets/sprites/level3/ghost.png', {
            frameWidth: 16, frameHeight: 16
        });

        // Flying eye - big (384x48, 8 frames of 48x48)
        this.load.spritesheet('l3-enemy-big', 'assets/sprites/level3/flying-eye.png', {
            frameWidth: 48, frameHeight: 48
        });

        // Demon boss - idle (960x144, 6 frames of 160x144)
        this.load.spritesheet('demon-idle', 'assets/sprites/level3/demon-idle.png', {
            frameWidth: 160, frameHeight: 144
        });

        // Demon boss - attack (2640x192, 11 frames of 240x192)
        this.load.spritesheet('demon-attack', 'assets/sprites/level3/demon-attack.png', {
            frameWidth: 240, frameHeight: 192
        });
    }

    create() {
        // ============== PLAYER ANIMATIONS ==============

        this.anims.create({
            key: 'ship-idle',
            frames: this.anims.generateFrameNumbers('ship', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'ship-thrust',
            frames: this.anims.generateFrameNumbers('ship', { start: 5, end: 9 }),
            frameRate: 15,
            repeat: -1
        });

        // ============== ENEMY ANIMATIONS ==============

        this.anims.create({
            key: 'enemy-small-fly',
            frames: this.anims.generateFrameNumbers('enemy-small', { start: 0, end: 1 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'enemy-medium-fly',
            frames: this.anims.generateFrameNumbers('enemy-medium', { start: 0, end: 1 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'enemy-big-fly',
            frames: this.anims.generateFrameNumbers('enemy-big', { start: 0, end: 1 }),
            frameRate: 6,
            repeat: -1
        });

        // ============== BOSS ANIMATIONS ==============

        this.anims.create({
            key: 'boss-idle',
            frames: this.anims.generateFrameNumbers('boss', { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });

        this.anims.create({
            key: 'boss-damage-1',
            frames: [{ key: 'boss', frame: 2 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'boss-damage-2',
            frames: [{ key: 'boss', frame: 3 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'boss-damage-3',
            frames: [{ key: 'boss', frame: 4 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'boss-thrust',
            frames: this.anims.generateFrameNumbers('boss-thrust', { start: 0, end: 3 }),
            frameRate: 12,
            repeat: -1
        });

        // ============== EXPLOSION ANIMATIONS ==============

        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 4 }),
            frameRate: 15,
            repeat: 0
        });

        this.anims.create({
            key: 'explode-large',
            frames: this.anims.generateFrameNumbers('explosion-large', { start: 0, end: 7 }),
            frameRate: 15,
            repeat: 0
        });

        this.anims.create({
            key: 'explode-big',
            frames: this.anims.generateFrameNumbers('explosion-big', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'explode-boss',
            frames: this.anims.generateFrameNumbers('explosion-boss', { start: 0, end: 6 }),
            frameRate: 10,
            repeat: 0
        });

        // ============== LEVEL 2 ENEMY ANIMATIONS (Desert) ==============

        this.anims.create({
            key: 'l2-enemy-small-fly',
            frames: this.anims.generateFrameNumbers('l2-enemy-small', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'l2-enemy-medium-fly',
            frames: this.anims.generateFrameNumbers('l2-enemy-medium', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'l2-enemy-big-fly',
            frames: this.anims.generateFrameNumbers('l2-enemy-big', { start: 0, end: 3 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'fire-skull-idle',
            frames: this.anims.generateFrameNumbers('fire-skull', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        // ============== LEVEL 3 ENEMY ANIMATIONS (Lava/Hell) ==============

        this.anims.create({
            key: 'l3-enemy-small-fly',
            frames: this.anims.generateFrameNumbers('l3-enemy-small', { start: 0, end: 2 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'l3-enemy-medium-fly',
            frames: this.anims.generateFrameNumbers('l3-enemy-medium', { start: 0, end: 2 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'l3-enemy-big-fly',
            frames: this.anims.generateFrameNumbers('l3-enemy-big', { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'demon-idle',
            frames: this.anims.generateFrameNumbers('demon-idle', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'demon-attack',
            frames: this.anims.generateFrameNumbers('demon-attack', { start: 0, end: 10 }),
            frameRate: 12,
            repeat: 0
        });

        // Lava flow animation
        this.anims.create({
            key: 'lava-flow',
            frames: this.anims.generateFrameNumbers('lava-flow', { start: 0, end: 2 }),
            frameRate: 6,
            repeat: -1
        });

        // Fireball animation
        this.anims.create({
            key: 'fireball-spin',
            frames: this.anims.generateFrameNumbers('fireball', { start: 0, end: 2 }),
            frameRate: 12,
            repeat: -1
        });

        // Start menu scene
        this.scene.start('MenuScene');
    }
}
