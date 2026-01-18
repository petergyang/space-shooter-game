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

        // Static background image (no seams)
        this.bg = this.add.image(240, 320, 'background')
            .setDisplaySize(480, 640);

        // Scrolling stars layer
        this.stars = this.add.tileSprite(0, 0, 480, 640, 'stars')
            .setOrigin(0, 0)
            .setTileScale(2);

        // Victory title
        const victoryText = this.add.text(width / 2, 100, 'VICTORY!', {
            fontFamily: 'monospace',
            fontSize: '56px',
            fill: '#ffdd00',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Pulsing effect
        this.tweens.add({
            targets: victoryText,
            scale: { from: 1, to: 1.1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Subtitle
        this.add.text(width / 2, 170, 'You saved the galaxy!', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Final score
        this.add.text(width / 2, 260, 'FINAL SCORE', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#888'
        }).setOrigin(0.5);

        this.add.text(width / 2, 300, this.finalScore.toString(), {
            fontFamily: 'monospace',
            fontSize: '48px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // High score check & save
        const highScore = parseInt(localStorage.getItem('highScore')) || 0;
        if (this.finalScore > highScore) {
            localStorage.setItem('highScore', this.finalScore);

            const newRecord = this.add.text(width / 2, 360, 'NEW RECORD!', {
                fontFamily: 'monospace',
                fontSize: '28px',
                fill: '#ff0'
            }).setOrigin(0.5);

            this.tweens.add({
                targets: newRecord,
                alpha: { from: 1, to: 0.3 },
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        }

        // Save completion
        localStorage.setItem('gameCompleted', 'true');
        localStorage.setItem('bestLevel', '3');

        // Stats
        this.add.text(width / 2, 420, 'All 3 levels completed!', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#0f0'
        }).setOrigin(0.5);

        this.add.text(width / 2, 450, 'All bosses defeated!', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#0f0'
        }).setOrigin(0.5);

        // Decorative ship
        this.ship = this.add.sprite(width / 2, 520, 'ship').setScale(4);
        this.ship.play('ship-thrust');

        // Ship celebration animation
        this.tweens.add({
            targets: this.ship,
            y: { from: 520, to: 500 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Play again prompt
        const playAgain = this.add.text(width / 2, 590, 'PRESS SPACE TO PLAY AGAIN', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#fff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: playAgain,
            alpha: { from: 1, to: 0.3 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Input handlers
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('MenuScene');
        });

        this.input.once('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Create celebration particles (explosions around the screen)
        this.celebrationTimer = this.time.addEvent({
            delay: 800,
            callback: () => this.createCelebrationExplosion(),
            loop: true
        });
    }

    update() {
        // Scroll stars only (background is static)
        this.stars.tilePositionY -= 0.5;
    }

    createCelebrationExplosion() {
        const x = Phaser.Math.Between(50, 430);
        const y = Phaser.Math.Between(100, 400);

        const explosion = this.add.sprite(x, y, 'explosion-large').setScale(1.5);
        explosion.setTint(Phaser.Math.RND.pick([0xffdd00, 0x00ffff, 0xff00ff, 0x00ff00]));
        explosion.play('explode-large');
        explosion.on('animationcomplete', () => explosion.destroy());
    }
}
