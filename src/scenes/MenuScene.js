export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
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

        // Decorative ship
        this.ship = this.add.sprite(240, 450, 'ship')
            .setScale(4);
        this.ship.play('ship-idle');

        // Floating animation for ship
        this.tweens.add({
            targets: this.ship,
            y: { from: 450, to: 470 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Title
        const title = this.add.text(width / 2, 120, 'SPACE\nSHOOTER', {
            fontFamily: 'monospace',
            fontSize: '56px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        // Title glow effect
        this.tweens.add({
            targets: title,
            alpha: { from: 1, to: 0.7 },
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // Subtitle
        this.add.text(width / 2, 220, 'RETRO EDITION', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#ff0',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Menu options
        const menuY = 320;
        const menuSpacing = 60;

        // Play button
        const playBtn = this.createButton(width / 2, menuY, 'PLAY', () => {
            this.scene.start('GameScene', { level: 1 });
        });

        // High scores button
        const scoresBtn = this.createButton(width / 2, menuY + menuSpacing, 'HIGH SCORES', () => {
            this.showHighScores();
        });

        // Controls info
        this.add.text(width / 2, 560, 'ARROW KEYS / WASD - Move', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888'
        }).setOrigin(0.5);

        this.add.text(width / 2, 580, 'SPACE - Shoot', {
            fontFamily: 'monospace',
            fontSize: '14px',
            fill: '#888'
        }).setOrigin(0.5);

        // Mobile touch hint
        this.add.text(width / 2, 610, 'Touch screen to play on mobile', {
            fontFamily: 'monospace',
            fontSize: '12px',
            fill: '#666'
        }).setOrigin(0.5);

        // High scores panel (hidden initially)
        this.createHighScoresPanel();

        // Keyboard shortcut
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene', { level: 1 });
        });

        this.input.keyboard.once('keydown-ENTER', () => {
            this.scene.start('GameScene', { level: 1 });
        });
    }

    update() {
        // Scroll stars only (background is static)
        this.stars.tilePositionY -= 0.5;
    }

    createButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontFamily: 'monospace',
            fontSize: '28px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => {
            btn.setFill('#ff0');
            btn.setScale(1.1);
        });

        btn.on('pointerout', () => {
            btn.setFill('#fff');
            btn.setScale(1);
        });

        btn.on('pointerdown', callback);

        return btn;
    }

    createHighScoresPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Panel background
        this.scoresPanel = this.add.container(width / 2, height / 2);
        this.scoresPanel.setVisible(false);
        this.scoresPanel.setDepth(100);

        const bg = this.add.rectangle(0, 0, 350, 400, 0x000000, 0.9)
            .setStrokeStyle(3, 0xffffff);
        this.scoresPanel.add(bg);

        const title = this.add.text(0, -160, 'HIGH SCORES', {
            fontFamily: 'monospace',
            fontSize: '28px',
            fill: '#ff0',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        this.scoresPanel.add(title);

        // Score display placeholder
        this.scoresList = this.add.text(0, -40, '', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#fff',
            align: 'center',
            lineSpacing: 15
        }).setOrigin(0.5);
        this.scoresPanel.add(this.scoresList);

        // Close button
        const closeBtn = this.add.text(0, 150, 'CLOSE', {
            fontFamily: 'monospace',
            fontSize: '24px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => closeBtn.setFill('#ff0'));
        closeBtn.on('pointerout', () => closeBtn.setFill('#fff'));
        closeBtn.on('pointerdown', () => this.scoresPanel.setVisible(false));

        this.scoresPanel.add(closeBtn);
    }

    showHighScores() {
        const highScore = localStorage.getItem('highScore') || 0;
        const bestWave = localStorage.getItem('bestWave') || 1;
        const bestLevel = localStorage.getItem('bestLevel') || 1;

        this.scoresList.setText(
            `Best Score: ${highScore}\n\n` +
            `Best Wave: ${bestWave}\n\n` +
            `Best Level: ${bestLevel}\n\n` +
            `\n` +
            `Beat all 3 levels\nto become a champion!`
        );

        this.scoresPanel.setVisible(true);
    }
}
