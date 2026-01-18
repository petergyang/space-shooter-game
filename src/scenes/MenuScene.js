export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Stop any previous music and start title music
        this.sound.stopAll();
        this.music = this.sound.add('music-title', { loop: true, volume: 0.5 });
        this.music.play();

        // Dynamic background with all three level backgrounds cycling
        this.bgIndex = 0;
        this.backgrounds = ['background', 'desert-bg', 'lava-bg'];
        this.bg = this.add.image(240, 320, this.backgrounds[0])
            .setDisplaySize(480, 640);

        // Cycle backgrounds every 3 seconds
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                this.bgIndex = (this.bgIndex + 1) % 3;
                this.tweens.add({
                    targets: this.bg,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.bg.setTexture(this.backgrounds[this.bgIndex]);
                        this.tweens.add({
                            targets: this.bg,
                            alpha: 1,
                            duration: 500
                        });
                    }
                });
            },
            loop: true
        });

        // Scrolling stars layer
        this.stars = this.add.tileSprite(0, 0, 480, 640, 'stars')
            .setOrigin(0, 0)
            .setTileScale(2)
            .setAlpha(0.7);

        // Spawn animated enemies in background
        this.bgEnemies = [];
        this.time.addEvent({
            delay: 800,
            callback: () => this.spawnBackgroundEnemy(),
            loop: true
        });

        // Dark overlay for better text readability
        this.add.rectangle(240, 320, 480, 640, 0x000000, 0.4);

        // ===== EPIC TITLE =====

        // Title glow/shadow layers for "INTO THE"
        for (let i = 3; i > 0; i--) {
            this.add.text(width / 2, 70, 'INTO THE', {
                fontFamily: 'monospace',
                fontSize: '36px',
                fill: '#ff6600'
            }).setOrigin(0.5).setAlpha(0.3 / i).setScale(1 + i * 0.05);
        }

        // Main title - INTO THE
        const titleInto = this.add.text(width / 2, 70, 'INTO THE', {
            fontFamily: 'monospace',
            fontSize: '36px',
            fill: '#ffaa00',
            stroke: '#ff4400',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Title glow effect for INFERNO
        for (let i = 3; i > 0; i--) {
            this.add.text(width / 2, 120, 'INFERNO', {
                fontFamily: 'monospace',
                fontSize: '56px',
                fill: '#ff2200'
            }).setOrigin(0.5).setAlpha(0.3 / i).setScale(1 + i * 0.05);
        }

        // Main title - INFERNO
        const titleInferno = this.add.text(width / 2, 120, 'INFERNO', {
            fontFamily: 'monospace',
            fontSize: '56px',
            fill: '#ff4400',
            stroke: '#ffcc00',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Title animation - fire flicker effect
        this.tweens.add({
            targets: [titleInto],
            scaleX: { from: 1, to: 1.02 },
            scaleY: { from: 1, to: 0.98 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: [titleInferno],
            scaleX: { from: 1, to: 1.03 },
            scaleY: { from: 1, to: 0.97 },
            alpha: { from: 1, to: 0.9 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ===== SCROLLING STORY =====

        const storyText =
            'The Vega-9 colony went dark.\n\n' +
            'Recon footage shows sand where\n' +
            'there should be steel, fire where\n' +
            'there should be sky.\n\n' +
            'Something is tearing the planet\n' +
            'apart from the inside.\n\n' +
            'You\'re the only pilot in range.\n\n' +
            'Get in. Get answers.';

        const story = this.add.text(width / 2, 380, storyText, {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888888',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5, 0);

        // Slow scroll animation - loops
        this.tweens.add({
            targets: story,
            y: { from: 380, to: 140 },
            duration: 18000,
            repeat: -1,
            ease: 'Linear'
        });

        // ===== DECORATIVE SHIP =====

        this.ship = this.add.sprite(240, 500, 'ship').setScale(4);
        this.ship.play('ship-thrust');

        // Ship floating animation
        this.tweens.add({
            targets: this.ship,
            y: { from: 500, to: 520 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Ship subtle rotation
        this.tweens.add({
            targets: this.ship,
            angle: { from: -3, to: 3 },
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ===== MENU BUTTON =====

        const playBtn = this.createButton(width / 2, 560, '[ LAUNCH ]', '#00ff00', () => {
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('GameScene', { level: 1 });
            });
        });

        // Pulsing effect on play button
        this.tweens.add({
            targets: playBtn,
            alpha: { from: 1, to: 0.7 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Version
        this.add.text(width / 2, 625, 'v1.0', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#222222'
        }).setOrigin(0.5);

        // Keyboard shortcuts
        this.input.keyboard.once('keydown-SPACE', () => {
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('GameScene', { level: 1 });
            });
        });

        this.input.keyboard.once('keydown-ENTER', () => {
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('GameScene', { level: 1 });
            });
        });

        // Initial screen flash
        this.cameras.main.flash(1000, 0, 0, 0);
    }

    update() {
        this.stars.tilePositionY -= 1;

        // Update background enemies
        this.bgEnemies.forEach((enemy, index) => {
            if (enemy.y > 700) {
                enemy.destroy();
                this.bgEnemies.splice(index, 1);
            }
        });
    }

    spawnBackgroundEnemy() {
        const enemies = [
            { key: 'enemy-small', anim: 'enemy-small-fly', scale: 2 },
            { key: 'enemy-medium', anim: 'enemy-medium-fly', scale: 2 },
            { key: 'l2-enemy-small', anim: 'l2-enemy-small-fly', scale: 1 },
            { key: 'l3-enemy-small', anim: 'l3-enemy-small-fly', scale: 0.3 }
        ];
        const config = Phaser.Math.RND.pick(enemies);

        const x = Phaser.Math.Between(50, 430);
        const enemy = this.add.sprite(x, -30, config.key)
            .setScale(config.scale)
            .setAlpha(0.4)
            .setDepth(-1);

        enemy.play(config.anim);

        this.tweens.add({
            targets: enemy,
            y: 700,
            duration: Phaser.Math.Between(4000, 8000),
            ease: 'Linear'
        });

        this.bgEnemies.push(enemy);
    }

    createButton(x, y, text, color, callback) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: color,
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            btn.setScale(1.15);
            btn.setFill('#ffffff');
            this.tweens.add({
                targets: btn,
                x: x + 5,
                duration: 50,
                yoyo: true
            });
        });

        btn.on('pointerout', () => {
            btn.setScale(1);
            btn.setFill(color);
        });

        btn.on('pointerdown', callback);

        return btn;
    }
}
