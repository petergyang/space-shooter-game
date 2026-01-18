export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Start title music
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
        this.add.rectangle(240, 320, 480, 640, 0x000000, 0.3);

        // ===== EPIC TITLE =====

        // Title glow/shadow layers
        for (let i = 3; i > 0; i--) {
            const glowTitle = this.add.text(width / 2, 100, 'VOID', {
                fontFamily: 'monospace',
                fontSize: '72px',
                fill: '#0088ff'
            }).setOrigin(0.5).setAlpha(0.3 / i).setScale(1 + i * 0.05);
        }

        // Main title - VOID
        const titleVoid = this.add.text(width / 2, 100, 'VOID', {
            fontFamily: 'monospace',
            fontSize: '72px',
            fill: '#ffffff',
            stroke: '#0066cc',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Title glow effect for BLITZ
        for (let i = 3; i > 0; i--) {
            const glowBlitz = this.add.text(width / 2, 170, 'BLITZ', {
                fontFamily: 'monospace',
                fontSize: '72px',
                fill: '#ff4400'
            }).setOrigin(0.5).setAlpha(0.3 / i).setScale(1 + i * 0.05);
        }

        // Main title - BLITZ
        const titleBlitz = this.add.text(width / 2, 170, 'BLITZ', {
            fontFamily: 'monospace',
            fontSize: '72px',
            fill: '#ffcc00',
            stroke: '#ff4400',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Title animation - subtle shake/pulse
        this.tweens.add({
            targets: [titleVoid],
            scaleX: { from: 1, to: 1.02 },
            scaleY: { from: 1, to: 0.98 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: [titleBlitz],
            scaleX: { from: 1, to: 0.98 },
            scaleY: { from: 1, to: 1.02 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle with typing effect
        const subtitleText = '>>> ENTER THE VOID <<<';
        const subtitle = this.add.text(width / 2, 230, '', {
            fontFamily: 'monospace',
            fontSize: '16px',
            fill: '#00ffff'
        }).setOrigin(0.5);

        // Type out subtitle
        let charIndex = 0;
        this.time.addEvent({
            delay: 80,
            callback: () => {
                if (charIndex < subtitleText.length) {
                    subtitle.setText(subtitleText.substring(0, charIndex + 1));
                    charIndex++;
                }
            },
            repeat: subtitleText.length - 1
        });

        // Decorative ship with engine trail
        this.ship = this.add.sprite(240, 420, 'ship').setScale(5);
        this.ship.play('ship-thrust');

        // Ship floating animation
        this.tweens.add({
            targets: this.ship,
            y: { from: 420, to: 450 },
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

        // ===== MENU BUTTONS =====

        const menuY = 310;
        const menuSpacing = 55;

        // Play button - most prominent
        const playBtn = this.createButton(width / 2, menuY, '[ START MISSION ]', '#00ff00', () => {
            this.music.stop();
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('GameScene', { level: 1 });
            });
        });

        // High scores button
        const scoresBtn = this.createButton(width / 2, menuY + menuSpacing, '[ HIGH SCORES ]', '#ffff00', () => {
            this.showHighScores();
        });

        // ===== BOTTOM INFO =====

        // Controls box
        const controlsBg = this.add.rectangle(width / 2, 560, 300, 70, 0x000000, 0.5)
            .setStrokeStyle(1, 0x444444);

        this.add.text(width / 2, 540, 'WASD/ARROWS - Move | SPACE - Fire', {
            fontFamily: 'monospace',
            fontSize: '11px',
            fill: '#888888'
        }).setOrigin(0.5);

        this.add.text(width / 2, 560, 'Touch & drag on mobile', {
            fontFamily: 'monospace',
            fontSize: '11px',
            fill: '#666666'
        }).setOrigin(0.5);

        this.add.text(width / 2, 580, 'Z - Skip to boss | X - Skip level', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#444444'
        }).setOrigin(0.5);

        // Version/credit
        this.add.text(width / 2, 620, 'v1.0', {
            fontFamily: 'monospace',
            fontSize: '10px',
            fill: '#333333'
        }).setOrigin(0.5);

        // High scores panel (hidden initially)
        this.createHighScoresPanel();

        // Keyboard shortcuts
        this.input.keyboard.once('keydown-SPACE', () => {
            this.music.stop();
            this.cameras.main.flash(500, 255, 255, 255);
            this.time.delayedCall(300, () => {
                this.scene.start('GameScene', { level: 1 });
            });
        });

        this.input.keyboard.once('keydown-ENTER', () => {
            this.music.stop();
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
            { key: 'l3-enemy-small', anim: 'l3-enemy-small-fly', scale: 2 }
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
            fontSize: '22px',
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

    createHighScoresPanel() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.scoresPanel = this.add.container(width / 2, height / 2);
        this.scoresPanel.setVisible(false);
        this.scoresPanel.setDepth(100);

        // Darker background
        const bg = this.add.rectangle(0, 0, 380, 420, 0x000000, 0.95)
            .setStrokeStyle(3, 0x00ffff);
        this.scoresPanel.add(bg);

        // Decorative corners
        const cornerSize = 20;
        const corners = [
            [-180, -200], [180, -200], [-180, 200], [180, 200]
        ];
        corners.forEach(([cx, cy]) => {
            const corner = this.add.rectangle(cx, cy, cornerSize, cornerSize, 0x00ffff);
            this.scoresPanel.add(corner);
        });

        const title = this.add.text(0, -170, '=== PILOT RECORDS ===', {
            fontFamily: 'monospace',
            fontSize: '22px',
            fill: '#00ffff'
        }).setOrigin(0.5);
        this.scoresPanel.add(title);

        this.scoresList = this.add.text(0, -20, '', {
            fontFamily: 'monospace',
            fontSize: '18px',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 20
        }).setOrigin(0.5);
        this.scoresPanel.add(this.scoresList);

        const closeBtn = this.add.text(0, 170, '[ CLOSE ]', {
            fontFamily: 'monospace',
            fontSize: '20px',
            fill: '#ff4444',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeBtn.on('pointerover', () => closeBtn.setFill('#ffffff'));
        closeBtn.on('pointerout', () => closeBtn.setFill('#ff4444'));
        closeBtn.on('pointerdown', () => this.scoresPanel.setVisible(false));

        this.scoresPanel.add(closeBtn);
    }

    showHighScores() {
        const highScore = localStorage.getItem('highScore') || 0;
        const bestWave = localStorage.getItem('bestWave') || 1;
        const bestLevel = localStorage.getItem('bestLevel') || 1;
        const completed = localStorage.getItem('gameCompleted') === 'true';

        let statusText = completed ? '>>> GALAXY CHAMPION <<<' : 'Status: In Progress';
        let statusColor = completed ? '#00ff00' : '#ffff00';

        this.scoresList.setText(
            `HIGH SCORE\n` +
            `${highScore}\n\n` +
            `FURTHEST LEVEL: ${bestLevel}\n` +
            `FURTHEST WAVE: ${bestWave}\n\n` +
            `${statusText}`
        );

        this.scoresPanel.setVisible(true);
        this.scoresPanel.setScale(0.5);
        this.tweens.add({
            targets: this.scoresPanel,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });
    }
}
