export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    init(data) {
        this.finalScore = data.score || 0;
        this.level = data.level || 1;
        this.wave = data.wave || 1;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Stop any previous music and play title music (somber mood)
        this.sound.stopAll();
        this.music = this.sound.add('music-title', { loop: true, volume: 0.3 });
        this.music.play();

        // Dark red tinted background
        this.bg = this.add.image(240, 320, 'background')
            .setDisplaySize(480, 640)
            .setTint(0x440000);

        // Static/glitch effect overlay
        this.staticOverlay = this.add.rectangle(240, 320, 480, 640, 0x000000, 0)
            .setDepth(50);

        // Glitch effect timer
        this.time.addEvent({
            delay: 100,
            callback: () => {
                this.staticOverlay.setAlpha(Math.random() * 0.1);
                if (Math.random() > 0.9) {
                    this.cameras.main.shake(50, 0.005);
                }
            },
            loop: true
        });

        // Scrolling stars (slower, red tinted)
        this.stars = this.add.tileSprite(0, 0, 480, 640, 'stars')
            .setOrigin(0, 0)
            .setTileScale(2)
            .setTint(0xff4444)
            .setAlpha(0.5);

        // Explosion debris in background
        for (let i = 0; i < 5; i++) {
            this.time.delayedCall(i * 300, () => {
                const x = Phaser.Math.Between(100, 380);
                const y = Phaser.Math.Between(150, 400);
                const explosion = this.add.sprite(x, y, 'explosion-large')
                    .setScale(1.5)
                    .setAlpha(0.6)
                    .setTint(0xff4400);
                explosion.play('explode-large');
                explosion.on('animationcomplete', () => explosion.destroy());
            });
        }

        // ===== GAME OVER TITLE =====

        // Glitchy red glow layers
        for (let i = 3; i > 0; i--) {
            this.add.text(width / 2 + Phaser.Math.Between(-3, 3), 100, 'MISSION', {
                fontFamily: 'monospace',
                fontSize: '48px',
                fill: '#ff0000'
            }).setOrigin(0.5).setAlpha(0.2 / i);
        }

        const missionText = this.add.text(width / 2, 100, 'MISSION', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fill: '#ff4444',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        for (let i = 3; i > 0; i--) {
            this.add.text(width / 2 + Phaser.Math.Between(-3, 3), 155, 'FAILED', {
                fontFamily: 'monospace',
                fontSize: '56px',
                fill: '#ff0000'
            }).setOrigin(0.5).setAlpha(0.2 / i);
        }

        const failedText = this.add.text(width / 2, 155, 'FAILED', {
            fontFamily: 'monospace',
            fontSize: '56px',
            fill: '#ff0000',
            stroke: '#440000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Glitch animation on title
        this.tweens.add({
            targets: [missionText, failedText],
            x: { from: width / 2 - 2, to: width / 2 + 2 },
            duration: 50,
            yoyo: true,
            repeat: -1
        });

        // Scale in animation
        this.tweens.add({
            targets: [missionText, failedText],
            scale: { from: 1.5, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });

        // ===== STATS BOX =====

        const statsBox = this.add.rectangle(width / 2, 320, 320, 180, 0x000000, 0.8)
            .setStrokeStyle(2, 0xff4444);

        // Score
        this.add.text(width / 2, 255, '>>> FINAL SCORE <<<', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        const scoreText = this.add.text(width / 2, 290, '0', {
            fontFamily: 'monospace',
            fontSize: '42px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Animated score counter
        this.tweens.addCounter({
            from: 0,
            to: this.finalScore,
            duration: 1500,
            ease: 'Power2',
            onUpdate: (tween) => {
                scoreText.setText(Math.floor(tween.getValue()).toString());
            }
        });

        // Progress reached
        this.add.text(width / 2, 345, `TERMINATED AT: LEVEL ${this.level}-${this.wave}`, {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#ff6666'
        }).setOrigin(0.5);

        // High score check
        const highScore = parseInt(localStorage.getItem('highScore')) || 0;
        if (this.finalScore > highScore) {
            localStorage.setItem('highScore', this.finalScore);

            const newHighText = this.add.text(width / 2, 385, '!!! NEW HIGH SCORE !!!', {
                fontFamily: 'monospace',
                fontSize: '18px',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);

            this.tweens.add({
                targets: newHighText,
                scale: { from: 1, to: 1.15 },
                alpha: { from: 1, to: 0.7 },
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        } else {
            this.add.text(width / 2, 385, `RECORD: ${highScore}`, {
                fontFamily: 'monospace',
                fontSize: '14px',
                fill: '#666666'
            }).setOrigin(0.5);
        }

        // ===== TACTICAL ADVICE =====

        const tips = [
            'TACTICAL: Fireballs pierce through enemies',
            'TACTICAL: Shield absorbs all damage for 5 sec',
            'TACTICAL: Big enemies track your position',
            'TACTICAL: Bosses enrage at low health',
            'TACTICAL: Speed boost helps dodge bullet hell'
        ];
        const tip = Phaser.Math.RND.pick(tips);

        this.add.text(width / 2, 450, tip, {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#666666'
        }).setOrigin(0.5);

        // ===== ACTION BUTTONS =====

        // Retry button
        const retryBtn = this.add.text(width / 2, 510, '[ RETRY MISSION ]', {
            fontFamily: 'monospace',
            fontSize: '22px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerover', () => {
            retryBtn.setScale(1.1);
            retryBtn.setFill('#ffffff');
        });
        retryBtn.on('pointerout', () => {
            retryBtn.setScale(1);
            retryBtn.setFill('#00ff00');
        });
        retryBtn.on('pointerdown', () => {
                        this.cameras.main.flash(300, 255, 255, 255);
            this.time.delayedCall(200, () => {
                this.scene.start('GameScene', { level: 1 });
            });
        });

        // Blink animation
        this.tweens.add({
            targets: retryBtn,
            alpha: { from: 1, to: 0.5 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Menu button
        const menuBtn = this.add.text(width / 2, 560, '[ ABORT TO BASE ]', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#888888',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        menuBtn.on('pointerover', () => menuBtn.setFill('#ffffff'));
        menuBtn.on('pointerout', () => menuBtn.setFill('#888888'));
        menuBtn.on('pointerdown', () => {
                        this.scene.start('MenuScene');
        });

        // Bottom text
        this.add.text(width / 2, 610, 'SPACE to retry | M for menu', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#444444'
        }).setOrigin(0.5);

        // ===== INPUT =====

        this.input.keyboard.once('keydown-SPACE', () => {
                        this.cameras.main.flash(300, 255, 255, 255);
            this.time.delayedCall(200, () => {
                this.scene.start('GameScene', { level: 1 });
            });
        });

        this.input.keyboard.once('keydown-M', () => {
                        this.scene.start('MenuScene');
        });

        // Initial effects
        this.cameras.main.shake(300, 0.02);
        this.cameras.main.flash(500, 255, 0, 0);
    }

    update() {
        this.stars.tilePositionY -= 0.3;
    }
}
