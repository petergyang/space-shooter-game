export default class VictoryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'VictoryScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Stop any previous music and play victory/ending music
        this.sound.stopAll();
        this.music = this.sound.add('music-ending', { loop: true, volume: 0.5 });
        this.music.play();

        // Epic golden tinted background
        this.bg = this.add.image(240, 320, 'background')
            .setDisplaySize(480, 640)
            .setTint(0x332200);

        // Fast scrolling stars (victory zoom effect)
        this.stars = this.add.tileSprite(0, 0, 480, 640, 'stars')
            .setOrigin(0, 0)
            .setTileScale(2)
            .setTint(0xffdd88);

        // Celebration explosions - colorful fireworks!
        this.time.addEvent({
            delay: 400,
            callback: () => this.createFirework(),
            loop: true
        });

        // ===== VICTORY TITLE =====

        // Multiple glow layers for epic effect
        const colors = ['#ffdd00', '#ff8800', '#ffaa00'];
        for (let i = 5; i > 0; i--) {
            this.add.text(width / 2, 70, 'VICTORY', {
                fontFamily: 'monospace',
                fontSize: '64px',
                fill: colors[i % 3]
            }).setOrigin(0.5).setAlpha(0.15).setScale(1 + i * 0.03);
        }

        const victoryText = this.add.text(width / 2, 70, 'VICTORY', {
            fontFamily: 'monospace',
            fontSize: '64px',
            fill: '#ffffff',
            stroke: '#ff8800',
            strokeThickness: 10
        }).setOrigin(0.5);

        // Pulsing victory text
        this.tweens.add({
            targets: victoryText,
            scale: { from: 1, to: 1.08 },
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle
        const subtitleText = this.add.text(width / 2, 130, '>>> VEGA-9 SAVED <<<', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: subtitleText,
            alpha: { from: 1, to: 0.5 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // ===== HERO SHIP =====

        // Ship trail effect
        this.shipTrails = [];
        for (let i = 0; i < 5; i++) {
            const trail = this.add.sprite(240, 350 + i * 15, 'ship')
                .setScale(4 - i * 0.3)
                .setAlpha(0.3 - i * 0.05)
                .setTint(0x00aaff);
            this.shipTrails.push(trail);
        }

        // Main ship
        this.ship = this.add.sprite(240, 350, 'ship').setScale(5);
        this.ship.play('ship-thrust');

        // Ship floating with victory pose
        this.tweens.add({
            targets: this.ship,
            y: { from: 350, to: 320 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Ship rotation celebration
        this.tweens.add({
            targets: this.ship,
            angle: { from: -5, to: 5 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // ===== STATS =====

        const statsBox = this.add.rectangle(width / 2, 480, 340, 140, 0x000000, 0.7)
            .setStrokeStyle(3, 0xffcc00);

        // Final score label
        this.add.text(width / 2, 425, '=== MISSION COMPLETE ===', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#00ff00'
        }).setOrigin(0.5);

        // Animated score counter
        const scoreLabel = this.add.text(width / 2, 455, 'FINAL SCORE', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        const scoreText = this.add.text(width / 2, 490, '0', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fill: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Count up animation
        this.tweens.addCounter({
            from: 0,
            to: this.finalScore,
            duration: 2000,
            ease: 'Power2',
            onUpdate: (tween) => {
                scoreText.setText(Math.floor(tween.getValue()).toString());
            }
        });

        // High score check & celebration
        const highScore = parseInt(localStorage.getItem('highScore')) || 0;
        if (this.finalScore > highScore) {
            localStorage.setItem('highScore', this.finalScore);

            const newRecordText = this.add.text(width / 2, 535, '!!! NEW HIGH SCORE !!!', {
                fontFamily: 'monospace',
                fontSize: '18px',
                fill: '#ff00ff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.tweens.add({
                targets: newRecordText,
                scale: { from: 1, to: 1.2 },
                alpha: { from: 1, to: 0.6 },
                duration: 300,
                yoyo: true,
                repeat: -1
            });

            // Extra fireworks for new record!
            this.time.addEvent({
                delay: 200,
                callback: () => this.createFirework(),
                loop: true
            });
        }

        // Achievements
        localStorage.setItem('gameCompleted', 'true');
        localStorage.setItem('bestLevel', '3');

        // ===== ACHIEVEMENTS =====

        const achievements = [
            { text: 'All 3 Sectors Cleared', color: '#00ff00' },
            { text: 'All Bosses Eliminated', color: '#ff8800' },
            { text: 'Hero of Vega-9', color: '#ffdd00' }
        ];

        achievements.forEach((ach, i) => {
            this.time.delayedCall(500 + i * 400, () => {
                const achText = this.add.text(width / 2, 180 + i * 25, ach.text, {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fill: ach.color,
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5).setAlpha(0).setScale(0.5);

                this.tweens.add({
                    targets: achText,
                    alpha: 1,
                    scale: 1,
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            });
        });

        // ===== PLAY AGAIN =====

        const playAgainBtn = this.add.text(width / 2, 580, '[ RETURN TO BASE ]', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        playAgainBtn.on('pointerover', () => {
            playAgainBtn.setScale(1.1);
            playAgainBtn.setFill('#ffffff');
        });
        playAgainBtn.on('pointerout', () => {
            playAgainBtn.setScale(1);
            playAgainBtn.setFill('#00ffff');
        });
        playAgainBtn.on('pointerdown', () => {
                        this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('MenuScene');
            });
        });

        this.tweens.add({
            targets: playAgainBtn,
            alpha: { from: 1, to: 0.5 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        this.add.text(width / 2, 615, 'Press SPACE to continue', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#444444'
        }).setOrigin(0.5);

        // ===== INPUT =====

        this.input.keyboard.once('keydown-SPACE', () => {
                        this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('MenuScene');
            });
        });

        this.input.once('pointerdown', () => {
                        this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('MenuScene');
            });
        });

        // Initial celebration flash
        this.cameras.main.flash(1000, 255, 200, 0);
    }

    update() {
        // Fast scrolling stars for victory feel
        this.stars.tilePositionY -= 2;

        // Update ship trails
        this.shipTrails.forEach((trail, i) => {
            trail.x = this.ship.x;
            trail.y = this.ship.y + (i + 1) * 12;
            trail.angle = this.ship.angle;
        });
    }

    createFirework() {
        const x = Phaser.Math.Between(50, 430);
        const y = Phaser.Math.Between(50, 600);

        // Random color firework
        const colors = [0xffdd00, 0x00ffff, 0xff00ff, 0x00ff00, 0xff8800, 0xff4444];
        const color = Phaser.Math.RND.pick(colors);

        const explosion = this.add.sprite(x, y, 'explosion-large')
            .setScale(Phaser.Math.Between(8, 15) / 10)
            .setTint(color)
            .setAlpha(0.8);

        explosion.play('explode-large');
        explosion.on('animationcomplete', () => explosion.destroy());
    }
}
