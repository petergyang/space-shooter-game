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
            .setTint(0x222244);

        // Fast scrolling stars (victory zoom effect)
        this.stars = this.add.tileSprite(0, 0, 480, 640, 'stars')
            .setOrigin(0, 0)
            .setTileScale(2)
            .setTint(0xaaddff);

        // Celebration fireworks - more frequent!
        this.time.addEvent({
            delay: 300,
            callback: () => this.createFirework(),
            loop: true
        });

        // ===== STORY EPILOGUE =====

        const epilogue = [
            'The demon is vanquished.',
            'Vega-9 falls silent once more.',
            '',
            'The colony survivors emerge',
            'from the ruins, looking skyward',
            'as your ship breaks atmosphere.',
            '',
            'You came alone.',
            'You saved them all.',
            '',
            'Hero of Vega-9.'
        ];

        // Create epilogue text - fades in line by line
        epilogue.forEach((line, i) => {
            this.time.delayedCall(i * 400, () => {
                const text = this.add.text(width / 2, 80 + i * 22, line, {
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fill: line === 'Hero of Vega-9.' ? '#ffdd00' : '#aaaaaa',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5).setAlpha(0);

                this.tweens.add({
                    targets: text,
                    alpha: 1,
                    duration: 500
                });
            });
        });

        // ===== HERO SHIP (appears after epilogue) =====

        this.time.delayedCall(epilogue.length * 400 + 500, () => {
            this.ship = this.add.sprite(240, 380, 'ship').setScale(4).setAlpha(0);
            this.ship.play('ship-thrust');

            this.tweens.add({
                targets: this.ship,
                alpha: 1,
                y: 360,
                duration: 1000,
                ease: 'Power2'
            });

            this.tweens.add({
                targets: this.ship,
                y: { from: 360, to: 345 },
                duration: 1500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: 1000
            });

            // Show score after ship appears
            this.time.delayedCall(800, () => this.showScore());
        });

        // Save completion
        localStorage.setItem('gameCompleted', 'true');
        localStorage.setItem('bestLevel', '3');

        // Initial celebration flash
        this.cameras.main.flash(1000, 255, 200, 100);

        // ===== INPUT (delayed to let story play) =====

        this.time.delayedCall(3000, () => {
            this.input.keyboard.once('keydown-SPACE', () => this.returnToMenu());
            this.input.once('pointerdown', () => this.returnToMenu());
        });
    }

    showScore() {
        const width = this.cameras.main.width;

        const scoreLabel = this.add.text(width / 2, 430, 'FINAL SCORE', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5).setAlpha(0);

        const scoreText = this.add.text(width / 2, 460, '0', {
            fontFamily: 'monospace',
            fontSize: '42px',
            fill: '#ffdd00',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [scoreLabel, scoreText],
            alpha: 1,
            duration: 500
        });

        this.tweens.addCounter({
            from: 0,
            to: this.finalScore,
            duration: 1500,
            ease: 'Power2',
            onUpdate: (tween) => {
                scoreText.setText(Math.floor(tween.getValue()).toString());
            }
        });

        // High score check
        const highScore = parseInt(localStorage.getItem('highScore')) || 0;
        if (this.finalScore > highScore) {
            localStorage.setItem('highScore', this.finalScore);

            this.time.delayedCall(1600, () => {
                const newRecordText = this.add.text(width / 2, 505, 'NEW HIGH SCORE!', {
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    fill: '#ff00ff',
                    stroke: '#000000',
                    strokeThickness: 3
                }).setOrigin(0.5);

                this.tweens.add({
                    targets: newRecordText,
                    scale: { from: 1, to: 1.1 },
                    alpha: { from: 1, to: 0.7 },
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });

                // Extra fireworks for new record
                for (let i = 0; i < 5; i++) {
                    this.time.delayedCall(i * 100, () => this.createFirework());
                }
            });
        }

        // Return button
        this.time.delayedCall(2000, () => {
            const playAgainBtn = this.add.text(width / 2, 570, '[ RETURN TO BASE ]', {
                fontFamily: 'monospace',
                fontSize: '18px',
                fill: '#00ffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setAlpha(0);

            this.tweens.add({
                targets: playAgainBtn,
                alpha: 1,
                duration: 500
            });

            playAgainBtn.on('pointerover', () => {
                playAgainBtn.setScale(1.1);
                playAgainBtn.setFill('#ffffff');
            });
            playAgainBtn.on('pointerout', () => {
                playAgainBtn.setScale(1);
                playAgainBtn.setFill('#00ffff');
            });
            playAgainBtn.on('pointerdown', () => this.returnToMenu());

            this.tweens.add({
                targets: playAgainBtn,
                alpha: { from: 1, to: 0.6 },
                duration: 600,
                yoyo: true,
                repeat: -1,
                delay: 500
            });
        });
    }

    returnToMenu() {
        this.cameras.main.flash(500, 255, 255, 255);
        this.time.delayedCall(300, () => {
            this.scene.start('MenuScene');
        });
    }

    update() {
        this.stars.tilePositionY -= 2;
    }

    createFirework() {
        const x = Phaser.Math.Between(50, 430);
        const y = Phaser.Math.Between(50, 600);

        const colors = [0xffdd00, 0x00ffff, 0xff00ff, 0x00ff00, 0xff8800, 0xffffff];
        const color = Phaser.Math.RND.pick(colors);

        const explosion = this.add.sprite(x, y, 'explosion-large')
            .setScale(Phaser.Math.Between(6, 14) / 10)
            .setTint(color)
            .setAlpha(0.8);

        explosion.play('explode-large');
        explosion.on('animationcomplete', () => explosion.destroy());
    }
}
