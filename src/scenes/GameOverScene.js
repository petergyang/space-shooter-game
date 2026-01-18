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

        // Static background image (no seams)
        this.bg = this.add.image(240, 320, 'background')
            .setDisplaySize(480, 640);

        // Scrolling stars layer
        this.stars = this.add.tileSprite(0, 0, 480, 640, 'stars')
            .setOrigin(0, 0)
            .setTileScale(2);

        // Game Over text
        const gameOverText = this.add.text(width / 2, 120, 'GAME OVER', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fill: '#ff0000',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Animate
        this.tweens.add({
            targets: gameOverText,
            scale: { from: 0.5, to: 1 },
            duration: 500,
            ease: 'Back.easeOut'
        });

        // Stats
        const statsY = 220;

        // Score
        this.add.text(width / 2, statsY, 'SCORE', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#888'
        }).setOrigin(0.5);

        this.add.text(width / 2, statsY + 35, this.finalScore.toString(), {
            fontFamily: 'monospace',
            fontSize: '40px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Level & Wave reached
        this.add.text(width / 2, statsY + 100, `REACHED: LEVEL ${this.level} - WAVE ${this.wave}`, {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ff0',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // High score
        const highScore = parseInt(localStorage.getItem('highScore')) || 0;
        if (this.finalScore > highScore) {
            localStorage.setItem('highScore', this.finalScore);

            const newHigh = this.add.text(width / 2, statsY + 160, 'NEW HIGH SCORE!', {
                fontFamily: 'monospace',
                fontSize: '26px',
                fill: '#ffff00',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.tweens.add({
                targets: newHigh,
                scale: { from: 1, to: 1.1 },
                duration: 300,
                yoyo: true,
                repeat: -1
            });
        } else {
            this.add.text(width / 2, statsY + 160, `HIGH SCORE: ${highScore}`, {
                fontFamily: 'monospace',
                fontSize: '20px',
                fill: '#666'
            }).setOrigin(0.5);
        }

        // Tips
        const tips = [
            'TIP: Collect power-ups for stronger weapons!',
            'TIP: Shield protects you for 5 seconds!',
            'TIP: Watch out for enemy bullets!',
            'TIP: Big enemies track your position!',
            'TIP: Bosses have multiple attack patterns!'
        ];
        const tip = Phaser.Math.RND.pick(tips);

        this.add.text(width / 2, 480, tip, {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888'
        }).setOrigin(0.5);

        // Restart prompt
        const restartText = this.add.text(width / 2, 540, 'PRESS SPACE TO RETRY', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        this.tweens.add({
            targets: restartText,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Menu prompt
        this.add.text(width / 2, 580, 'Press M for Menu', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#666'
        }).setOrigin(0.5);

        // Input
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene', { level: 1 });
        });

        this.input.keyboard.once('keydown-M', () => {
            this.scene.start('MenuScene');
        });

        this.input.once('pointerdown', () => {
            this.scene.start('GameScene', { level: 1 });
        });
    }

    update() {
        // Scroll stars only (background is static)
        this.stars.tilePositionY -= 0.5;
    }
}
