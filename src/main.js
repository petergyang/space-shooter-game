import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import VictoryScene from './scenes/VictoryScene.js';

const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 640,
    parent: 'game-container',
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene, VictoryScene]
};

const game = new Phaser.Game(config);

// Resume audio when returning to the tab (mobile browsers suspend audio)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (game.sound && game.sound.context && game.sound.context.state === 'suspended') {
            game.sound.context.resume();
        }
    }
});

// Also resume on any user interaction (fallback for some browsers)
document.addEventListener('touchstart', () => {
    if (game.sound && game.sound.context && game.sound.context.state === 'suspended') {
        game.sound.context.resume();
    }
}, { once: false });
