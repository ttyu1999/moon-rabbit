let globalFontFamily = 'DotGothic16';

let player;
let ground;
let lawns;
let lawn;
let clouds;
let cloud;
let meteorite;
let meteorites;
let moon;
let moon_s;
let rabbit_s;
let star;
let stars;
let planets;
let cursors;
let pointer;
let jumpHeight = 0;
let jumpHeightText;
let isGameOver = false;
let originalY;
let playerLocked = false;
let lockedTo = undefined;
let groundCollision = {
    none: false,
    up: true,
    down: false,
    left: false,
    right: false
  };

let sound;
let isMuted = false;
let jumpMusic;
let selectMusic;
let runningMusic;
let touchingGroundMusic;
let backgroundMusic;
let cheerMusic;
let isStanding = true;
let isRunning = false;
let isJumping = false;
let isFalling = false;
let jumpCompleted = false;
let hasLanded = false;

let distance;
let descentSpeed;

const universeHeight = -4860;
const maxY = -8500;

let goLeft = false;
let goRight = false;
let jumpUp = false;
let goDirection = 'right';
let takeOff = true;

let pointerGoLeft = false;
let pointerGoRight = false;
let pointerJumpUp = false;
let pointUp = false;

let progressBarFill;

let timer = 0;

function rgbaToHex (r,g,b,a) {
  let outParts = [
    r.toString(16),
    g.toString(16),
    b.toString(16),
    Math.round(a * 255).toString(16).substring(-1, 0)
  ];

  // Pad single-digit output values
  outParts.forEach(function (part, i) {
    if (part.length === 1) {
      outParts[i] = '0' + part;
    }
  })

  return (outParts.join(''));
}

///////////////////////////////////////////////////////// 遊戲進行畫面

const main = {
  key: "main",
  preload: function () {
    // 預載相關靜態檔案，例如影像、音訊、視訊等

  },

  create: function () {
    // 在 preload 之後執行，進行遊戲的相關設定，並產生各個物件

    // 計時器
    timer = 0;
    this.time.addEvent({
        delay: 1000,
        callback: function () {
            timer++;
        },
        callbackScope: this,
        repeat: -1
    });


    // 音樂
    jumpMusic = this.sound.add('jumpMusic');
    jumpMusic.setVolume(0.2);
    fallingMusic = this.sound.add('fallingMusic');
    fallingMusic.setVolume(0.2);
    runningMusic = this.sound.add('runningMusic');
    runningMusic.setVolume(0.4);
    touchingGroundMusic = this.sound.add('touchingGroundMusic');
    touchingGroundMusic.setVolume(0.7);
    backgroundMusic.play({loop: true});

    ////////////////////////////////////////////////////////////////// 生成背景
    const rectWidth = config.width; // 長方形寬度
    const rectHeight = -80; // 長方形高度
    const numRectangles = Math.ceil(12000 / -rectHeight); // 長方形數量
    const brightnessStep = 0.01; // 每個長方形的亮度變化步長

    // 創建一個圖形物件用於繪製背景
    const backgroundGraphics = this.add.graphics();

    // 起始亮度，您可以根據需要調整
    let currentBrightness = 0.9;

    for (let i = 0; i < numRectangles; i++) {
        // 計算每個長方形的顏色
        const rectangleColor = Phaser.Display.Color.HSLToColor(0.5, 0.5, currentBrightness);

        // 繪製一個長方形
        backgroundGraphics.fillStyle(`0x${rgbaToHex(rectangleColor.r, rectangleColor.g, rectangleColor.b, rectangleColor.a)}`);
        backgroundGraphics.fillRect(0, config.height + i * rectHeight, rectWidth, rectHeight);
        // 更新亮度，使其變暗 
        if (currentBrightness > 0) {
          currentBrightness -= brightnessStep; 
        }
    }

    // 設置相機背景為透明
    this.cameras.main.transparent = true;

    ////////////////////////////////////////////////////////////////// 生成地板
    ground = this.physics.add.staticGroup({
      key: 'ground',
      repeat: 2,
      setXY: {x: 0, y: config.height, stepX: config.width / 2}
    }); // 生成一個靜態物理群組

    ////////////////////////////////////////////////////////////////// 生成星星
    stars = this.physics.add.staticGroup({
      key: 'starSprite',
      immovable: true,
      allowGravity: false,
      repeat: 200
    });

    const colorYellow = new Phaser.Display.Color(232, 240, 117);
    const colorBlue = new Phaser.Display.Color(68, 174, 217);

    this.anims.create({
      key: 'star',
      frames: this.anims.generateFrameNumbers('starSprite', {
        start: 0,
        end: 5
      }),
      frameRate: 10,
      repeat: -1,
      yoyo: true
    });

    this.anims.create({
      key: 'starReverse',
      frames: this.anims.generateFrameNumbers('starSprite', {
        start: 0,
        end: 5,
      }).reverse(),
      frameRate: 7,
      repeat: -1,
      yoyo: true
    });

    stars.children.iterate((child) => {
      child.x = Phaser.Math.Between(0, 375);
      child.y = Phaser.Math.Between(-4600, -8400);

      if (Math.random() > 0.8) {
        child.setTint(colorYellow.color);
        child.setScale(Phaser.Math.Between(0.6, 0.8));
      } else if (Math.random() < 0.2) {
        child.setTint(colorBlue.color);
      } else {
        child.setScale(Phaser.Math.Between(0.1, 0.4));

      }
      if (Math.random() < 0.5) {
        child.play('starReverse', true);
      } else {
        child.play('star', true);
      }
    });

    planets = this.physics.add.staticGroup({
      immovable: true,
      allowGravity: false,
    });

    planets.create(100, -5800, 'planet1').setScale(0.7);
    planets.create(300, -6400, 'planet2').setScale(0.8);
    planets.create(175, -6850, 'planet1');
    planets.create(200, -7400, 'planet1').setScale(-0.6, 0.6);
    planets.create(275, -7850, 'planet2');


    ////////////////////////////////////////////////////////////////// 生成台階

    lawns = this.physics.add.group({
      immovable: true,
      allowGravity: false
    });

    let lawnY = config.height;
    while (lawnY > -2400) {
      lawnY -= 120;
      if (Math.random() < 0.5) {
        lawn = lawns.create(Phaser.Math.Between(200, 400), lawnY, 'lawn');
      } else {
        lawn = lawns.create(Phaser.Math.Between(200, 400), lawnY, 'lawn_m');
      }
    }

    lawns.children.iterate((child) => {
      let between = Phaser.Math.Between(-250, 250);
      child.setFrictionX(1);
      for (let i = 0; i < lawns.children.entries.length; i++) {
        if (between < 80 && between > -80) {
          between = Phaser.Math.Between(-250, 250);
          i = -1;
        }
      }
      child.setVelocityX(between);
      child.x = Phaser.Math.Between(
        child.width / 4,
        config.width - child.width / 4
      );
      child.body.checkCollision = groundCollision;
      child.setSize(child.width * 0.8, child.height);
    });

    clouds = this.physics.add.group({
      immovable: true,
      allowGravity: false
    });

    let cloudY = -2450;
    while (cloudY > -5000) {
      cloudY -= 150;
      if (Math.random() < 0.4) {
        cloud = clouds.create(Phaser.Math.Between(200, 400), cloudY, 'cloud_l');
      } else if (Math.random() > 0.4 && Math.random() < 0.7) {
        cloud = clouds.create(Phaser.Math.Between(200, 400), cloudY, 'cloud_s');
      } else {
        cloud = clouds.create(Phaser.Math.Between(200, 400), cloudY, 'cloud_m');
      }
    }

    clouds.children.iterate((child) => {
      let between = Phaser.Math.Between(-250, 250);
      child.setFrictionX(1);
      for (let i = 0; i < clouds.children.entries.length; i++) {
        if (between < 80 && between > -80) {
          between = Phaser.Math.Between(-250, 250);
          i = -1;
        }
      }
      child.setVelocityX(between);
      child.x = Phaser.Math.Between(
        child.width / 4,
        config.width - child.width / 4
      );
      child.body.checkCollision = groundCollision;
      child.setData('originalY', child.y);
      child.setData('isSinking', false);

      child.setSize(child.width * 0.8, child.height * 0.3);
      child.setOffset(child.width * 0.1, child.height - child.height * 0.4);
    });

    meteorites = this.physics.add.group({
      immovable: true,
      allowGravity: false
    });

    let meteoriteY = -5000;
    while (meteoriteY > -7900) {
      meteoriteY -= 180;
      if (Math.random() < 0.4) {
        meteorite = meteorites.create(Phaser.Math.Between(200, 400), meteoriteY, 'meteorite_l');
      } else if (Math.random() > 0.4 && Math.random() < 0.7) {
        meteorite = meteorites.create(Phaser.Math.Between(200, 400), meteoriteY, 'meteorite_s');
      } else {
        meteorite = meteorites.create(Phaser.Math.Between(200, 400), meteoriteY, 'meteorite_m');
      }
    }

    meteorites.children.iterate((child) => {
      let between = Phaser.Math.Between(-250, 250);
      child.setFrictionX(1);
      for (let i = 0; i < meteorites.children.entries.length; i++) {
        if (between < 80 && between > -80) {
          between = Phaser.Math.Between(-250, 250);
          i = -1;
        }
      }
      child.setVelocityX(between);
      child.x = Phaser.Math.Between(
        child.width / 4,
        config.width - child.width / 4
      );
      child.body.checkCollision = groundCollision;
      child.setData('originalY', child.y);
      child.setData('isSinking', false);

      child.setSize(child.width * 0.65, child.height * 0.7);
      child.setOffset(child.width * 0.2, child.height - child.height * 0.7);
    });

    ////////////////////////////////////////////////////////////////// 生成月球
    moon = this.physics.add.image(config.width, -8600, 'moon');
    moon.setImmovable(true);
    moon.body.allowGravity = false;

    moon.setCircle(moon.width / 2, 0, moon.height - moon.width);

    ////////////////////////////////////////////////////////////////// 生成玩家
    player = this.physics.add.sprite(config.width / 2, 500, "sprite"); // 生成物理精靈
    player.body.setGravityY(500); // 調整角色重力值，值越大越重，墜落越快
    this.cameras.main.startFollow(player, true, 0, 1);
    this.cameras.main.setFollowOffset(
      config.width,
      150,
      config.width,
      config.height
    );

    player.setSize(player.width * 0.65, player.height);
    player.setOffset(player.width - player.width * 0.8, player.height - player.height * 1.1);

    ////////////////////////////////////////////////////////////////// 碰撞檢測
    this.physics.add.collider(player, ground); // 檢測玩家與地板之間的碰撞

    this.physics.add.collider(player, lawns); // 檢測玩家與平台之間的碰撞

    this.physics.add.collider(player, clouds, platformSinking); // 檢測玩家與雲朵之間的碰撞

    this.physics.add.collider(player, meteorites, platformSinking); // 檢測玩家與平台之間的碰撞

    this.physics.add.collider(player, moon, () => this.scene.start('end')); // 檢測玩家與月球的碰撞

    ////////////////////////////////////////////////////////////////// 生成文字
    // 進度條外框
    const progressBarFrame = this.add.graphics();
    progressBarFrame.fillStyle(0xffffff, 0.5);
    progressBarFrame.fillRect(config.width * 0.05, 12.5, config.width * 0.83, 15);

    // 創建進度條內部填充，初始寬度為0
    progressBarFill = this.add.graphics();

    progressBarFrame.setScrollFactor(0);
    progressBarFill.setScrollFactor(0);

    cursors = this.input.keyboard.createCursorKeys();
    pointer = this.input.activePointer;

    moon_s = this.add.image(config.width * 0.9, 20, 'moon_s').setOrigin(0, 0.5).setScale(0.5);

    moon_s.setScrollFactor(0);

    rabbit_s = this.add.image(config.width * 0.05, 17.5, 'rabbit_s');

    rabbit_s.setScrollFactor(0);

    // 開關音效
    sound = this.add.sprite(config.width - 24, config.height - 27, 'sound');
    sound.setScrollFactor(0);

    this.anims.create({
      key: "switchOn",
      frames: [{ key: "sound", frame: 0 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "switchOff",
      frames: [{ key: "sound", frame: 1 }],
      frameRate: 20,
    });

    // 設置音效按鈕的互動，使其能夠被點擊
    sound.setInteractive();

    sound.on('pointerdown', () => {
      if (isMuted) {
        // 將所有音效的音量恢復到正常水平
        jumpMusic.setVolume(0.2);
        fallingMusic.setVolume(0.2);
        runningMusic.setVolume(0.4);
        touchingGroundMusic.setVolume(0.7);
        backgroundMusic.setVolume(0.8);
        isMuted = false; // 表示音效已經打開
        sound.play('switchOn', true);
      } else {
        // 將所有音效的音量設置為0（靜音）
        jumpMusic.setVolume(0);
        fallingMusic.setVolume(0);
        runningMusic.setVolume(0);
        touchingGroundMusic.setVolume(0);
        backgroundMusic.setVolume(0);
        isMuted = true; // 表示音效已經靜音
        sound.play('switchOff', true);
      }
    });

    // 監控手機滑動
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) { // 手指滑動中
        if (pointer.x < pointer.downX) {
          pointerGoLeft = true;
          pointerGoRight = false;
        } else if (pointer.x > pointer.downX) {
          pointerGoLeft = false;
          pointerGoRight = true;
        }
        
        if (!pointUp && pointer.y < pointer.downY - 40) { // 手指往上滑動，執行跳躍
          pointUp = true;
          pointerJumpUp = true;
        } else {
          pointerJumpUp = false;
        }
      }
    });

    this.input.on('pointerup', () => {
      pointerGoLeft = false;
      pointerGoRight = false;
      pointerJumpUp = false;
      pointUp = false;
    });
  },

  update: function () {
    // 在 create 之後執行，每幀渲染新的畫面
    this.cameras.main.setBounds(0, maxY, game.config.width, game.config.height - maxY); // 鏡頭範圍只到月球高度


    // 監控鍵盤按鍵
    if (cursors.left.isDown) { // 向左走
      goLeft = true;
      goRight = false;
      goDirection = 'left';
    } else if (cursors.right.isDown) { // 向右走
      goLeft = false;
      goRight = true;
      goDirection = 'right';
    } else {
      goLeft = false;
      goRight = false;
    }

    if (cursors.space.isDown) { // 跳躍中，且落地前無法再次起跳
      jumpUp = true;
    } else {
      jumpUp = false;
    }

    // 更新移動
    if (!isGameOver) {
      if (goLeft || pointerGoLeft) { // 向左走
        player.setVelocityX(-160);
        goDirection = 'left';
        if (!isJumping && player.body.touching.down) {
          player.play("left", true);
        }
        if (jumpCompleted && isRunning) { // 判斷是否已經跳躍過並且正在行走中
          jumpCompleted = false;
          runningMusic.play({loop: true});
        }
        if (!isRunning && !isJumping && player.body.touching.down) { // 還沒行走且在地面上
          isRunning = true;
          runningMusic.play({loop: true});
        }
      } else if (goRight || pointerGoRight) { // 向右走
        player.setVelocityX(160);
        goDirection = 'right';
        if (!isJumping && player.body.touching.down) {
          player.play("right", true);
        }
        if (jumpCompleted && isRunning) { // 判斷是否已經跳躍並且正在行走中
          jumpCompleted = false;
          runningMusic.play({loop: true});
        }
        if (!isRunning && !isJumping && player.body.touching.down) { // 還沒行走且在地面上
          isRunning = true;
          runningMusic.play({loop: true});
        } 
      } else {
        player.setVelocityX(0);
        isRunning = false;
        isStanding = true;
        runningMusic.stop();
        if (player.body.touching.down) {
          if (goDirection === 'left') {
            player.play("standLeft", true);
          } else {
            player.play("standRight", true);
          }
        }
      }

      if (isJumping && player.body.velocity.y < player.height) {
        if (goDirection === 'left') {
          player.play("jumpLeft", true);
        } else {
          player.play("jumpRight", true);
        }
      }
      if (player.body.velocity.y > player.height) {
        if (goDirection === 'left') {
          player.play("jumpLeftDown", true);
        } else {
          player.play("jumpRightDown", true);
        }
      }

      if ((jumpUp || pointerJumpUp) && player.body.touching.down) { // 跳躍中，且落地前無法再次起跳
        if (player.y > -2350) {
          player.setVelocityY(-470);
        } else if (player.y > - 4900) {
          player.setVelocityY(-550);
        } else {
          player.setVelocityY(-600);
        }

        player.locked = false; // 跳躍中不綁定人物在平台上
        isJumping = true; // 跳躍中
        isRunning = false; // 停止奔跑
        jumpCompleted = false; // 跳躍還沒結束
        runningMusic.stop();
        fallingMusic.stop();
        jumpMusic.play();

      } else if (isJumping && player.body.touching.down) { // 當角色已經跳躍並落在地面時
        isJumping = false;
        jumpCompleted = true; // 跳躍已經結束
        hasLanded = true; // 站在地上
      }

      if (player.body.velocity.y > 0) { // 若沒跳躍，只是從平台上落下
        isJumping = true;
        runningMusic.stop();
        descentSpeed = player.body.velocity.y * 0.5; // 計算墜落速度 (讓雲下沉用)
        if (player.body.velocity.y > 700 && player.body.velocity.y < 730) { // 當重力 + 速度大於 700 (約2階平台)
          isFalling = true;
        } else {
          isFalling = false;
        }
      }



      if (!isJumping && hasLanded) {
        hasLanded = false;
        isFalling = false;
        fallingMusic.stop();

        if (typeof lockedTo !== 'object') { // 當人物落地時的平台不是雲朵或隕石
          touchingGroundMusic.play();
        }
      }
      
      if (isFalling) {
        fallingMusic.play();
      }
    }


    // 角色邊界檢測
    if (player.x + player.width / 2 - 10 >= config.width) {
        player.x = config.width - player.width / 2 + 10;
    } else if (player.x - player.width / 2 + 14 <= 0) {
        player.x = player.width / 2 - 14;
    }

    // 階梯邊界反彈
    boundaryCollision(lawns);
    boundaryCollision(clouds);
    boundaryCollision(meteorites);


    if (player.locked) {
        checkLock();
        if (lockedTo) {
            this.tweens.add({
                targets: lockedTo,
                y: originalY + descentSpeed, // 下陷的高度
                duration: 500,
                yoyo: false, // 不需要回彈
                repeat: 0,
                ease: 'Linear',
            });
        }
    } else {
      clouds.children.iterate((child) => {
        if (child.getData('isSinking')) {
          child.setData('isSinking', false);
          this.tweens.add({
              targets: child,
              y: originalY, // 回彈到原始高度
              duration: 600,
              yoyo: false, // 不需要回彈
              repeat: 0,
              ease: 'Linear',
          });
        }
      });
      meteorites.children.iterate((child) => {
        if (child.getData('isSinking')) {
          child.setData('isSinking', false);
          this.tweens.add({
              targets: child,
              y: originalY, // 回彈到原始高度
              duration: 600,
              yoyo: false, // 不需要回彈
              repeat: 0,
              ease: 'Linear',
          });
        }
      });
    }

    jumpHeight = (config.height - 40) - player.y;
    distance = Math.floor(jumpHeight / (-maxY + 200) * 100);
    progressBarFill.clear();
    progressBarFill.fillStyle(0x21397a, 1);
    progressBarFill.fillRect(config.width * 0.05 + 2.5, 15, config.width * 0.83 * (distance / 100), 10);
    const startX = config.width * 0.05 + config.width * 0.83 * (distance / 100);
    rabbit_s.setX(startX);
  },
};

function boundaryCollision(platforms) {
  platforms.children.iterate((child) => {
    if (
      (child.body.velocity.x > 0 &&
        child.x + child.width / 2 > config.width) ||
      (child.body.velocity.x < 0 && child.x - child.width / 2 < 0)
    ) {
      child.body.velocity.x = -child.body.velocity.x;
    }
  });
}

function platformSinking(player, platform) {
    originalY = platform.getData('originalY');
    if (!player.locked && player.body.velocity.y === 0) {
        player.locked = true;
        lockedTo = platform;
        platform.playerLocked = true;
        lockedTo.setData('isSinking', true);
    }
}

function checkLock() {
    if (lockedTo) {
        if (player.body.right < lockedTo.body.x || player.body.x > lockedTo.body.right)
    {
        lockedTo = undefined;
        player.locked = false;
    }
    }
}

///////////////////////////////////////////////////////// 結束畫面

let spaceRabbit;
let sinOffsetX = 0;
let sinOffsetY = 0;

const end = {
  key: "end",
  preload: function () {
  },
  create: function () {
    cheerMusic = this.sound.add('cheerMusic');
    cheerMusic.setVolume(0.4);

    cheerMusic.play();

    this.add.tileSprite(0, 0, config.width, config.height, 'endingSpace').setOrigin(0);

    spaceRabbit = this.add.sprite(0, 300, 'sleep');

    const gameOverText = this.add
      .text(config.width / 2, 100, "玉兔成功回家啦！", {
        color: "#eba9c2",
        fontFamily: globalFontFamily,
        fontSize: 28,
        resolution: 2,
      })
      .setOrigin(0.5);

    this.add
    .text(config.width / 2, 200, `抵達時間 ${Math.floor(timer / 60) < 10 ? '0' : ''}${Math.floor(timer / 60)} : ${Math.floor(timer % 60) < 10 ? '0' : ''}${timer % 60}`, {
      color: "#fff",
      fontFamily: globalFontFamily,
      fontSize: 24,
      resolution: 2,
    })
    .setOrigin(0.5);

    this.restart = this.add
      .text(config.width / 2, 500, "重新挑戰", {
        color: "#fff",
        fontFamily: globalFontFamily,
        fontSize: 20,
        resolution: 2,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => {
        jumpHeight = 0;
        this.scene.start("main");
        isGameOver = false;
        backgroundMusic.stop();
      })
      .on("pointerover", () => {
        this.restart.alpha = 0.5;
      })
      .on("pointerout", () => {
        this.restart.alpha = 1;
      });

    this.tweens.add({
      targets: gameOverText,
      y: { from: 0, to: 100 },
      ease: "Bounce.easeOut",
      duration: 1000,
      repeat: 0,
      yoyo: false,
    });

    this.tweens.add({
      targets: spaceRabbit,
      angle: 360, // 旋轉的角度
      duration: 4000, // 持續時間（毫秒）
      repeat: -1, // 無限循環
      ease: 'Linear' // 線性動畫
    });

  },
  update: function () {
  // 更新sin波浪的偏移，以使其在X軸上來回擺動
  sinOffsetX += 0.01; // 控制水平波浪的頻率

  // 更新Y軸的sin波浪偏移，可以使用不同的速度和振幅
  sinOffsetY += 0.02; // 控制垂直波浪的頻率

  // 計算sin值
  const sinValueX = Math.sin(sinOffsetX);
  const sinValueY = Math.sin(sinOffsetY);

  // 設定人物的位置，使其在X軸上來回擺動，並在Y軸上創建波浪形狀
  const amplitudeX = 150; // 控制水平波浪的振幅
  const amplitudeY = 100;  // 控制垂直波浪的振幅
  const x = config.width / 2 + amplitudeX * sinValueX; // X軸位置
  const y = config.height / 2 + 70 + amplitudeY * sinValueY; // Y軸位置

  // 更新人物位置
  spaceRabbit.setX(x);
  spaceRabbit.setY(y);
  },
};

let logo;
let background;
let percentText;
let loadingText;
let loadingJokes = [
    "正在加載落魄的玉兔...",
    "等待嫦娥傳輸數據中...",
    "你知道嗎？每吃一顆月餅，你就吃了一顆月餅",
    "你認為五仁月餅可以算月餅嗎？",
    "加載完成",
];

let progressBar;
let progressBox;
let jokeIndex = 0;
let loadingSpeed = 0.005;

let loadingMusic;

///////////////////////////////////////////////////////// 讀取畫面
const loading = {
  key: "loading",
  preload: function () {
    this.load.script(
      'webfont',
      'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js'
    );
    this.load.image("logo", "assets/logo.png");
    this.load.image("point", "assets/point.png");
    this.load.image("bg", "assets/bg.png");
    this.load.spritesheet("sprite", "assets/sprite1.png", {
      frameWidth: 68,
      frameHeight: 68,
    });

    this.load.audio('selectMusic', 'assets/select.mp3');
    this.load.audio('backgroundMusic', 'assets/backgroundMusic.mp3');


    // 遊戲使用
    this.load.image("rabbit_s", "assets/rabbit_s.png");
    this.load.image("ground", "assets/ground.png");
    this.load.image("lawn", "assets/lawn.png");
    this.load.image("lawn_m", "assets/lawn_m.png");
    this.load.image("cloud_l", "assets/cloud_l.png");
    this.load.image("cloud_m", "assets/cloud_m.png");
    this.load.image("cloud_s", "assets/cloud_s.png");
    this.load.image("meteorite_l", "assets/meteorite_l.png");
    this.load.image("meteorite_m", "assets/meteorite_m.png");
    this.load.image("meteorite_s", "assets/meteorite_s.png");
    this.load.image("moon", "assets/moon.png");
    this.load.image("moon_s", "assets/moon_s.png");
    this.load.image("planet1", "assets/planet1.png");
    this.load.image("planet2", "assets/planet2.png");

    this.load.spritesheet("sound", "assets/sound.png", {
      frameWidth: 29,
      frameHeight: 27,
    });
    
    this.load.spritesheet("starSprite", "assets/starSprite.png", {
      frameWidth: 18,
      frameHeight: 18,
    });

    this.load.audio('jumpMusic', 'assets/jump.mp3');
    this.load.audio('fallingMusic', 'assets/falling.mp3');
    this.load.audio('touchingGroundMusic', 'assets/touchingGround.mp3');
    this.load.audio('runningMusic', 'assets/running.mp3');

    // 結束畫面
    this.load.image("endingSpace", "assets/endingSpace.jpg");
    this.load.image("sleep", "assets/sleep.png");
    this.load.audio('cheerMusic', 'assets/cheer.mp3');

  },
  create: function () {
    WebFont.load({
      google: {
        families: [globalFontFamily]
      },
      active: () => {
        // 當字體載入完成後，執行遊戲初始化代碼

        progressBar = this.add.graphics();
        progressBox = this.add.graphics();
    
        progressBox.fillStyle(0xffffff, 0.8);
        progressBox.fillRect(config.width / 2 - 100, 290, 200, 30);
    
        percentText = this.add
          .text(config.width / 2, config.height / 2 - 40, "0%", {
            fontFamily: globalFontFamily,
            fontSize: 20,
            color: "#fff",
            align: "center",
          })
          .setOrigin(0.5);
    
        loadingText = this.add.text(config.width / 2, 350, "", {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5);

        background = this.add.rectangle(config.width / 2, config.height / 2, config.width, config.height, 0xffffff);
        background.setAlpha(0);
      
        logo = this.add.image(config.width / 2, config.height / 2, 'logo');
        logo.setScale(0.5);
        logo.setAlpha(0);

        let progress = 0;
        this.time.addEvent({
            delay: 15, // 每隔15毫秒增加一點進度
            callback: function () {
                progress += loadingSpeed;
                progress = Phaser.Math.Clamp(progress, 0, 1); // 限制在0到1之間
                updateProgressBar(progress);

                if (progress >= 1) {
                  // 当进度条加载完成后执行以下代码
                  this.time.delayedCall(500, fadeInLogo, [], this);
                }
            },
            callbackScope: this,
            repeat: -1 // 重复执行直到停止
        });
      }
    });
  },
  update: function () {
  },
};

function updateProgressBar(value) {
  progressBar.clear();
  progressBar.fillStyle(0xffffff, 1);
  progressBar.fillRect(config.width / 2 - 95, 295, 190 * value, 20)
  percentText.setText(parseInt(value * 100) + "%");
  jokeIndex = Math.min(Math.floor(value * (loadingJokes.length)), loadingJokes.length - 1);

  loadingText.setText(loadingJokes[jokeIndex]);

  if (value >= 1) {
      progressBar.destroy();
      progressBox.destroy();
      percentText.destroy();
      loadingText.destroy();
  }
}

function fadeInLogo() {
  this.tweens.add({
      targets: [background, logo],
      alpha: 1,
      duration: 500,
      onComplete: function () {
          this.time.delayedCall(1000, fadeOutLogo, [], this);
      },
      onCompleteScope: this
  });
}

function fadeOutLogo() {
  this.tweens.add({
      targets: [background, logo],
      alpha: 0,
      duration: 2000,
      onComplete: function () {
        this.scene.start("teach");
      },
      onCompleteScope: this
  });
}


let bgToLeft;
let bgToRight;
let bgToUp;
let skipText;

///////////////////////////////////////////////////////// 操作教學
const teach = {
  key: "teach",
  preload: function () {
  },
  create: function () {
    selectMusic = this.sound.add('selectMusic');
    selectMusic.setVolume(0.2);
    backgroundMusic = this.sound.add('backgroundMusic');
    backgroundMusic.setVolume(0.8);

    const bgX = config.width / 4 * 3 - 43;
    const x = config.width / 2;
    const y = config.height / 6;
    
    bgToUp = this.add.tileSprite(bgX, y * 2 - 3, 80, 80, 'bg');
    bgToLeft = this.add.tileSprite(bgX, y * 3 - 3, 80, 80, 'bg');
    bgToRight = this.add.tileSprite(bgX, y * 4 - 3, 80, 80, 'bg');
    
    const points = [];

    const pointInitialPositions = [
      { x: x - 60, y: y * 2 + 10},
      { x: x - 40, y: y * 3},
      { x: x - 80, y: y * 4},
    ];

    for (let i = 0; i < 3; i++) {
      const point = this.physics.add.image(pointInitialPositions[i].x, pointInitialPositions[i].y, 'point');
      point.setImmovable(true);
      point.body.allowGravity = false;
      points.push(point);
    }

    // 創建 tweens，應用到每個圖像物件
    points.forEach((point, index) => {
      let targetConfig = {}; // 儲存 tweens 的目標屬性配置

      if (index === 0) {
        targetConfig = { y: y * 2 - 10 };
      } else if (index === 1) {
        targetConfig = { x: x - 40 - 40 };
      } else if (index === 2) {
        targetConfig = { x: x - 40 };
      }

      this.tweens.add({
        targets: point,
        duration: 2000,
        repeat: -1,
        ease: 'Back',
        ...targetConfig, // 將目標配置應用到 tweens 中
        onCompleteScope: this
      });
    });

    const sprites = [];

    const spriteInitialPositions = [
      { x: x + 50, y: y * 2 - 5},
      { x: x + 50, y: y * 3 - 5},
      { x: x + 50, y: y * 4 - 5},
    ];

    for (let i = 0; i < 3; i++) {
      const sprite = this.physics.add.sprite(spriteInitialPositions[i].x, spriteInitialPositions[i].y, "sprite");
      sprite.setImmovable(true);
      sprite.body.allowGravity = false;
      sprites.push(sprite);
    }

    this.anims.create({
      key: "standLeft",
      frames: [
        { key: "sprite", frame: 5 },
        { key: "sprite", frame: 7 }
      ],
      frameRate: 3,
      repeat: -1,
    });

    this.anims.create({
      key: "standRight",
      frames: [
        { key: "sprite", frame: 1 },
        { key: "sprite", frame: 3 }
      ],
      frameRate: 3,
      repeat: -1,
    });

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("sprite", {
        start: 4,
        end: 6,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("sprite", {
        start: 0,
        end: 2,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "jumpLeft",
      frames: this.anims.generateFrameNumbers("sprite", {
        start: 12,
        end: 13,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "jumpLeftDown",
      frames: this.anims.generateFrameNumbers("sprite", {
        start: 14,
        end: 15,
      }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "jumpRight",
      frames: this.anims.generateFrameNumbers("sprite", {
        start: 8,
        end: 9,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: "jumpRightDown",
      frames: this.anims.generateFrameNumbers("sprite", {
        start: 10,
        end: 11,
      }),
      frameRate: 10,
      repeat: -1,
    });


    sprites[0].play('jumpRight', true);
    sprites[1].play('left', true);
    sprites[2].play('right', true);

    this.tweens.add({
      targets: sprites[0],
      duration: 2000,
      repeat: -1,
      ease: 'Back',
      y: config.height / 6 * 2 - 20,
      onCompleteScope: this
    });

    this.add.text(config.width / 2, 50, "操作方式", {
        fontFamily: globalFontFamily,
        fontSize: 24,
        color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(config.width / 2, 90, "手機：滑動以控制人物移動", {
        fontFamily: globalFontFamily,
        fontSize: 16,
        color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(config.width / 2, 120, "電腦：◀ ▶ 移動、Space 跳躍", {
        fontFamily: globalFontFamily,
        fontSize: 16,
        color: '#ffffff'
    }).setOrigin(0.5);


    this.add.text(config.width / 2, config.height - 50, "點擊畫面或按下 Space 繼續", {
        fontFamily: globalFontFamily,
        fontSize: 16,
        color: '#ffffff'
    }).setOrigin(0.5);



    cursors = this.input.keyboard.createCursorKeys();
    pointer = this.input.activePointer;
    
    // 使用 pointermove 事件來檢測手機上的滑動
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        // 手指滑動中，根據滑動方向設定人物移動
        if (pointer.x < pointer.downX) {
          goLeft = true;
          goRight = false;
        } else if (pointer.x > pointer.downX) {
          goLeft = false;
          goRight = true;
        }

        if (pointer.y < pointer.downY - 50) {
          // 手指往上滑動，執行跳躍
          if (player.body.touching.down) {
            // 只有在人物站在地面上時才能跳躍 
            if (player.y > -1150) {
              player.setVelocityY(-450);
            } else {
              player.setVelocityY(-550);
            }
            player.locked = false;
          }
        }
      }
    });
    
    this.input.on('pointerdown', () => {
      selectMusic.play();
      this.scene.start('main');
    });

  },
  update: function () {
    bgToLeft.tilePositionX -= 1;
    bgToRight.tilePositionX += 1;

    if (cursors.space.isDown) {
      selectMusic.play();
      this.scene.start('main');
    }
  },
};

const config = {
  type: Phaser.AUTO,
  // 透過 800 X 600 的所見窗口在遊戲世界裡探險
  width: 375,
  height: 600,
  physics: {
    default: "arcade",
    // 在物理系統中有「動態」、「靜態」兩類物體
    // 動態物體：可通過外力，例如：速度 velocity、加速度 acceleration，可與其他對象發生反彈 bounce、碰撞 collide
    // 靜態物體：只有位置和尺寸，完全不會動
    // 群組概念 Group，將近似對象組合在一起，方便控制
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [loading, teach, main, end],
};

const game = new Phaser.Game(config);
