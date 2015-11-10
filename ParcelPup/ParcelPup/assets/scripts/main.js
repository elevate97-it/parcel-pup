var stage, w, h;

var KEYCODE_MOVE_LEFT = 97, //a
    KEYCODE_MOVE_RIGHT = 100, //d
    KEYCODE_ACTION_1 = 32, //space
    KEYCODE_START = 102;        //f

var gameViewsEnum = Object.freeze({ TITLE: 0, GAMEPLAY: 1, GAMEDONE: 2 });
var numToText = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
var currentGameView;

// preloader
var loader;
var manifest;
var gameLoaded = false;
var allAssetsLoaded = false;

// music
//var titleMusic;
//var gameplayMusic;
var soundLoadedCounter = 0;
var sounds = [];

// title screen
var pressStart;
var titleScreen;
var parcelPupTitle;
var introControls;
var introColors;

// game variables
var countdownTimer = new Timer(30);
var generalTimer = new Timer(7);
var score = 0;

var lanes = [];
var goals = [
    { goalMainId: "goalGreenMain", goalBGId: "goalGreenBG" },
    { goalMainId: "goalYellowMain", goalBGId: "goalYellowBG" },
    { goalMainId: "goalBlueMain", goalBGId: "goalBlueBG" }
];

var goalBGContainer = new createjs.Container();
var goalMainContainer = new createjs.Container();
var lightsContainer = new createjs.Container();
lightsContainer.name = "lightsContainer";
var finalScoreContainer = new createjs.Container();
var packageDropContainer = new createjs.Container();

var packageMgr = new PackageManager();
var player;

// sprite sheets
var numberSpriteSheet;
var largeNumberSpriteSheet;
var lightsSpriteSheet;
var packageDropSpriteSheet;

function main() {
    stage = new createjs.Stage("gameCanvas");
    w = stage.canvas.width;
    h = stage.canvas.height;

    // load sounds
    // NOTE: removed game music from distributed code due to license
    var soundPath = "../assets/sounds/";
    sounds = [
        //{ src: "sudstep_star-power_gameplay2.ogg", id: "gameplayMusic" },
        //{ src: "titleScreen.ogg", id: "titleScreenMusic" },
        { src: "ship.ogg", id: "ship" },
        { src: "bark_3.ogg", id: "bark3" }
    ];
    createjs.Sound.on("fileload", handleSoundLoad);
    createjs.Sound.registerSounds(sounds, soundPath);

    // load images
    loader = new createjs.LoadQueue();
    loader.on("complete", handleComplete, this);
    manifest = [
        { src: "belt.png", id: "belt" },
        { src: "package_green.png", id: "greenBox" },
        { src: "package_yellow.png", id: "yellowBox" },
        { src: "package_blue.png", id: "blueBox" },
        { src: "pressStart.png", id: "pressStart" },
        { src: "titleScreen.png", id: "titleScreen" },
        { src: "floor.png", id: "floor" },
        { src: "goal_green_BG.png", id: "goalGreenBG" },
        { src: "goal_green_FG.png", id: "goalGreenMain" },
        { src: "goal_yellow_BG.png", id: "goalYellowBG" },
        { src: "goal_yellow_FG.png", id: "goalYellowMain" },
        { src: "goal_blue_BG.png", id: "goalBlueBG" },
        { src: "goal_blue_FG.png", id: "goalBlueMain" },
        { src: "podLights_Sheet.png", id: "lights" },
        { src: "numbers_white.png", id: "numbersSheet" },
        { src: "spr_score.png", id: "scoreLabel" },
        { src: "plus1.png", id: "plus1" },
        { src: "minus1.png", id: "minus1" },
        { src: "numbers_large_multicolor.png", id: "largeNumbersSheet" },
        { src: "robodog_face.png", id: "robodogFace" },
        { src: "robodog_body.png", id: "robodogBody" },
        { src: "packageDropSpriteSheet.png", id: "packageDropSheet" },
        { src: "controls.png", id: "controls" },
        { src: "colors.png", id: "colors" },
        { src: "titleSpriteSheet.png", id: "parcelPupTitle" }
    ];
    loader.loadManifest(manifest, true, "../assets/images/");

    document.onkeypress = handleKeyPress;
}

function handleSoundLoad() {
    soundLoadedCounter++;
    if (soundLoadedCounter == sounds.length) {
        // NOTE: removed game music from distributed code due to license

        // current issue in chrome with pan property: work around by setting it to "near 0" value
        //gameplayMusic = createjs.Sound.play("gameplayMusic", { loop: 0, pan: 0.0001, volume: 0.3 });
        //gameplayMusic.stop();

        //titleMusic = createjs.Sound.play("titleScreenMusic", { loop: -1, pan: 0.0001, volume: 0.3 });
        //titleMusic.play();
    }
}

function handleComplete() {
    setupTitleScreen();

    createjs.Ticker.framerate = 30;
    createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
    createjs.Ticker.addEventListener("tick", tick);
}

function setupTitleScreen() {
    if (!gameLoaded) {
        titleScreen = new createjs.Shape();
        titleScreen.graphics.beginBitmapFill(loader.getResult("titleScreen")).drawRect(0, 0, w, h);

        var parcelPupSpriteData = {
            images: [loader.getResult("parcelPupTitle")],
            frames: { width: 621, height: 110, count: 4 },
            animations: {
                noShine: {
                    frames: 0,
                    next: "shine",
                    speed: 0.01,
                },
                shine: {
                    frames: [1, 2, 2, 3],
                    next: "noShine",
                    speed: 0.6,
                }
            }
        };

        var parcelPupSpriteSheet = new createjs.SpriteSheet(parcelPupSpriteData);
        parcelPupTitle = new createjs.Sprite(parcelPupSpriteSheet, "noShine");
        parcelPupTitle.x = 20;
        parcelPupTitle.y = 20;

        var pressStartSpriteData = {
            images: [loader.getResult("pressStart")],
            frames: { width: 300, height: 32, count: 2 },
            animations: {
                blink: {
                    frames: [0, 1],
                    speed: 0.05,
                }
            }
        };

        var pressStartSpriteSheet = new createjs.SpriteSheet(pressStartSpriteData);
        pressStart = new createjs.Sprite(pressStartSpriteSheet, "blink");
        pressStart.x = 525;
        pressStart.y = 660;

        var controlsImg = loader.getResult("controls");
        introControls = new createjs.Shape();
        introControls.graphics.beginBitmapFill(controlsImg).drawRect(0, 0, controlsImg.width, controlsImg.height);
        introControls.x = 191;
        introControls.y = 174;

        var colorsImg = loader.getResult("colors");
        introColors = new createjs.Shape();
        introColors.graphics.beginBitmapFill(colorsImg).drawRect(0, 0, colorsImg.width, colorsImg.height);
        introColors.x = 815;
        introColors.y = 80;
    }
    stage.addChild(titleScreen, introControls, introColors, pressStart, parcelPupTitle);

    currentGameView = gameViewsEnum.TITLE;
}

// CONTROLS
function handleKeyPress(event) {
    switch (currentGameView) {
        case gameViewsEnum.TITLE:
            switch (event.keyCode) {
                case KEYCODE_START:
                    //titleMusic.stop();
                    //gameplayMusic.play();
                    startGame();
                    break;
            }
            break;
        case gameViewsEnum.GAMEPLAY:
            switch (event.keyCode) {
                case KEYCODE_MOVE_LEFT:
                    switch (player.laneIndex) {
                        case 0:
                            break;
                        case 1:
                            if (player.hasPackage) {
                                player.shapeBody.x = lanes[0].playerXY.x;
                                player.shapeBody.y = lanes[0].playerXY.y;
                                player.shapeHead.x = lanes[0].playerXY.x + 42;
                                player.shapeHead.y = lanes[0].playerXY.y + 10;
                                player.laneIndex = 0;
                                packageMgr.activePackage().shape.x = lanes[0].playerXY.x + 9;
                                packageMgr.activePackage().shape.y = lanes[0].playerXY.y - 17;
                            }
                            break;
                        case 2:
                            if (player.hasPackage) {
                                player.shapeBody.x = lanes[1].playerXY.x;
                                player.shapeBody.y = lanes[1].playerXY.y;
                                player.shapeHead.x = lanes[1].playerXY.x + 42;
                                player.shapeHead.y = lanes[1].playerXY.y + 10;
                                player.laneIndex = 1;
                                packageMgr.activePackage().shape.x = lanes[1].playerXY.x + 9;
                                packageMgr.activePackage().shape.y = lanes[1].playerXY.y - 17;
                            }
                            break;
                    }
                    break;
                case KEYCODE_MOVE_RIGHT:
                    switch (player.laneIndex) {
                        case 0:
                            if (player.hasPackage) {
                                player.shapeBody.x = lanes[1].playerXY.x;
                                player.shapeBody.y = lanes[1].playerXY.y;
                                player.shapeHead.x = lanes[1].playerXY.x + 42;
                                player.shapeHead.y = lanes[1].playerXY.y + 10;
                                player.laneIndex = 1;
                                packageMgr.activePackage().shape.x = lanes[1].playerXY.x + 9;
                                packageMgr.activePackage().shape.y = lanes[1].playerXY.y - 17;
                            }
                            break;
                        case 1:
                            if (player.hasPackage) {
                                player.shapeBody.x = lanes[2].playerXY.x;
                                player.shapeBody.y = lanes[2].playerXY.y;
                                player.shapeHead.x = lanes[2].playerXY.x + 42;
                                player.shapeHead.y = lanes[2].playerXY.y + 10;
                                player.laneIndex = 2;
                                packageMgr.activePackage().shape.x = lanes[2].playerXY.x + 9;
                                packageMgr.activePackage().shape.y = lanes[2].playerXY.y - 17;
                            }
                            break;
                        case 2:
                            break;
                    }
                    break;
                case KEYCODE_ACTION_1:
                    if (player.hasPackage) {
                        shipPackage(packageMgr.activePackage());
                        playSound("ship");
                    }
                    break;
            }
            break;
        case gameViewsEnum.GAMEDONE:
            break;
    }
}

function startGame() {
    if (!gameLoaded) {
        setupGameView();
    } else {
        resetGame();
    }
    stage.removeChild(titleScreen, introColors, introControls, pressStart, parcelPupTitle);
    countdownTimer.start();
    currentGameView = gameViewsEnum.GAMEPLAY;
}

function resetGame() {
    console.log("reset called");
    score = 0;
    packageMgr.spawnNewPackage();
}

function tick() {
    if (currentGameView >= gameViewsEnum.GAMEPLAY) {

        if (currentGameView == gameViewsEnum.GAMEPLAY) {
            if (countdownTimer.isTimeUp()) {
                currentGameView = gameViewsEnum.GAMEDONE;
            }
        } else {
            if (currentGameView == gameViewsEnum.GAMEDONE) {
                packageMgr.removeActivePackage();

                if (!packageMgr.HasPackagesActiveInGame() && generalTimer.IsStarted() == false) {
                    playSound("bark3");
                    generalTimer.start();
                    showFinalScore();

                }

                if (generalTimer.isTimeUp()) {
                    //gameplayMusic.stop();
                    generalTimer.reset();
                    setupTitleScreen();
                    finalScoreContainer.removeAllChildren();
                    //titleMusic.play();
                }
            }
        }

        textUpdates();
    }

    stage.update();
}

function textUpdates() {
    stage.getChildByName("scoreDisplay").text = score.toString();
    stage.getChildByName("CountdownTimer").text = countdownTimer.getSecondsLeft().toString();
}

function centerX(img) {
    return Math.round((w / 2) - (img.width / 2));
}

function centerY(img) {
    return Math.round((h / 2) - (img.height / 2));
}

function setupGameView() {
    // setup the main game screen
    setupNumberSpriteSheet();
    setupLightsSpriteSheet();
    setupPackageDropSpriteSheet();

    setupFloor();
    setupLanes();
    packageMgr.setupPackages(24, 3);
    setupPlayer();
    setupScoreDisplay();
    setupTimer();

    stage.addChild(goalBGContainer);
    stage.addChild(packageMgr.getPackageContainer());
    stage.addChild(goalMainContainer);
    stage.addChild(lightsContainer);
    stage.addChild(packageDropContainer);
    stage.addChild(player.shapeHead);

    packageMgr.spawnNewPackage();

    gameLoaded = true;
}

function shipPackage(pkg) {
    if (player.hasPackage) {
        packageMgr.clearActivePackageIndex();
        var currentLane = lanes[player.laneIndex];
        pkg.shape.x = currentLane.packagePathStartXY.x;
        pkg.shape.y = currentLane.packagePathStartXY.y;
        pkg.laneIndex = lanes.indexOf(currentLane);

        createjs.Tween.get(pkg.shape, { loop: false })
        .to({ x: currentLane.packagePathEndXY.x, y: currentLane.packagePathEndXY.y }, 2700, createjs.Ease.none)
        .call(handlePackageComplete, [pkg]);

        player.hasPackage = false;
        packageMgr.spawnNewPackage();
    }
}

function handlePackageComplete(pkg) {
    pkg.isActiveInGame = false;
    packageMgr.getPackageContainer().removeChild(this);

    if (pkg.packageType == lanes[pkg.laneIndex].laneType) {
        stage.getChildByName("lightsContainer").getChildByName("light" + pkg.laneIndex.toString()).gotoAndPlay("okBlink");
        score += 1;
        spawnPlusMinus(true, lanes[pkg.laneIndex].packagePathEndXY.x, lanes[pkg.laneIndex].packagePathEndXY.y);
    } else {
        stage.getChildByName("lightsContainer").getChildByName("light" + pkg.laneIndex.toString()).gotoAndPlay("badBlink");
        score -= 1;
        spawnPlusMinus(false, lanes[pkg.laneIndex].packagePathEndXY.x, lanes[pkg.laneIndex].packagePathEndXY.y);
    }
}

function spawnPlusMinus(plus, startX, startY) {
    var img;
    var sprite = new createjs.Shape();

    if (plus) {
        img = loader.getResult("plus1");
    } else {
        img = loader.getResult("minus1");
    }

    sprite.graphics.beginBitmapFill(img).drawRect(0, 0, img.width, img.height);
    sprite.x = startX;
    sprite.y = startY;

    stage.addChild(sprite);

    if (plus) {
        createjs.Tween.get(sprite, { loop: false })
            .to({ y: startY - 100 }, 1000, createjs.Ease.none)
            .to({ alpha: 0, y: startY - 150 }, 500)
            .call(function () {
                stage.removeChild(this);
            });
    } else {
        createjs.Tween.get(sprite, { loop: false })
            .to({ y: startY + 50 }, 500, createjs.Ease.none)
            .to({ alpha: 0, y: startY + 100 }, 500)
            .call(function () {
                stage.removeChild(this);
            });
    }
}

function setupNumberSpriteSheet() {
    var numberSpriteData = {
        images: [loader.getResult("numbersSheet")],
        frames: { width: 24, height: 36, count: 12 },
        animations: {
            "0": 0,
            "1": 1,
            "2": 2,
            "3": 3,
            "4": 4,
            "5": 5,
            "6": 6,
            "7": 7,
            "8": 8,
            "9": 9,
            "+": 10,
            "-": 11
        }
    };
    numberSpriteSheet = new createjs.SpriteSheet(numberSpriteData);

    var largeNumberSpriteData = {
        images: [loader.getResult("largeNumbersSheet")],
        frames: { width: 96, height: 144, count: 48 },
        animations: {
            zero: {
                frames: [0, 12, 24, 36],
                speed: 0.4
            },
            one: {
                frames: [1, 13, 25, 37],
                speed: 0.4
            },
            two: {
                frames: [2, 14, 26, 38],
                speed: 0.4
            },
            three: {
                frames: [3, 15, 27, 39],
                speed: 0.4
            },
            four: {
                frames: [4, 16, 28, 40],
                speed: 0.4
            },
            five: {
                frames: [5, 17, 29, 41],
                speed: 0.4
            },
            six: {
                frames: [6, 18, 30, 42],
                speed: 0.4
            },
            seven: {
                frames: [7, 19, 31, 43],
                speed: 0.4
            },
            eight: {
                frames: [8, 20, 32, 44],
                speed: 0.4
            },
            nine: {
                frames: [9, 21, 33, 45],
                speed: 0.4
            },
            plus: {
                frames: [10, 22, 34, 46],
                speed: 0.4
            },
            neg: {
                frames: [11, 23, 35, 47],
                speed: 0.4
            },
        }
    };
    largeNumberSpriteSheet = new createjs.SpriteSheet(largeNumberSpriteData);
}

function setupLightsSpriteSheet() {
    // load sprite data for the blinky lights!
    var spriteData = {
        images: [loader.getResult("lights")],
        frames: { width: 77, height: 139, count: 5 },
        animations: {
            badBlink: {
                frames: [0, 1, 0, 1, 0, 1],
                next: "off",
                speed: 0.5
            },
            okBlink: {
                frames: [2, 3, 2, 3, 2, 3],
                next: "off",
                speed: 0.5
            },
            off: 4
        }
    };
    lightsSpriteSheet = new createjs.SpriteSheet(spriteData);
}

function setupPackageDropSpriteSheet() {
    var spriteData = {
        images: [loader.getResult("packageDropSheet")],
        frames: { width: 64, height: 281, count: 3 },
        animations: {
            drop: {
                frames: 0,
            },
            squish: {
                frames: 1,
                next: "end",
                speed: 0.3
            },
            end: 2
        }
    };
    packageDropSpriteSheet = new createjs.SpriteSheet(spriteData);
}

function setupScoreDisplay() {
    var scoreDisplay = new createjs.BitmapText(score.toString(), numberSpriteSheet);
    scoreDisplay.name = "scoreDisplay";
    scoreDisplay.x = w / 2 + 74;
    scoreDisplay.y = h - 50;

    // "score:" label
    var scoreImg = loader.getResult("scoreLabel");
    var scoreLabel = new createjs.Shape();
    scoreLabel.graphics.beginBitmapFill(scoreImg).drawRect(0, 0, scoreImg.width, scoreImg.height);
    scoreLabel.x = w / 2 - 98;
    scoreLabel.y = scoreDisplay.y;

    stage.addChild(scoreDisplay, scoreLabel);
}

function showFinalScore() {
    //var finalScore = new createjs.BitmapText("0", largeNumberSpriteSheet);
    var scoreArray = parseScore();
    var finalScoreXY = new createjs.Point((w / 2) - ((score.toString().length * 96) / 2), (h / 2 - 72));
    for (var i = 0; i < scoreArray.length; i++) {
        var num = new createjs.Sprite(largeNumberSpriteSheet, scoreArray[i]);
        num.x = finalScoreXY.x;
        num.y = finalScoreXY.y;
        finalScoreContainer.addChild(num);

        finalScoreXY.x += 96;
    }
    stage.addChild(finalScoreContainer);
}

function setupFloor() {
    // floor 
    var floorImg = loader.getResult("floor");
    var floor = new createjs.Shape();
    floor.graphics.beginBitmapFill(floorImg).drawRect(0, 0, w, h);
    stage.addChild(floor);
}

function setupLanes() {
    // initialize lanes and goals (3 total)
    var beltImg = loader.getResult("belt");
    var laneSpacing = new createjs.Point(285, 210);

    for (i = 0; i < 3; i++) {
        var lane = new Lane();
        lane.laneType = i;
        lane.playerXY = new createjs.Point(laneSpacing.x - 40, laneSpacing.y + 260);
        lane.packagePathStartXY = new createjs.Point(laneSpacing.x + 30, laneSpacing.y + 203);
        lane.packagePathEndXY = new createjs.Point(laneSpacing.x + 500, laneSpacing.y - 33);
        lane.shape = new createjs.Shape();
        lane.shape.graphics.beginBitmapFill(beltImg).drawRect(0, 0, beltImg.width, beltImg.height);

        lane.shape.x = laneSpacing.x;
        lane.shape.y = laneSpacing.y;

        lanes.push(lane);
        stage.addChild(lane.shape);

        // place goal at end of lane
        var tempGoalBgImg = loader.getResult(goals[i].goalBGId);
        var tempGoalMainImg = loader.getResult(goals[i].goalMainId);
        var goalBg = new createjs.Shape();
        var goalMain = new createjs.Shape();

        goalBg.graphics.beginBitmapFill(tempGoalBgImg).drawRect(0, 0, tempGoalBgImg.width, tempGoalBgImg.height);
        goalBg.x = laneSpacing.x + 481;
        goalBg.y = laneSpacing.y - 50;

        goalBGContainer.addChild(goalBg);

        goalMain.graphics.beginBitmapFill(tempGoalMainImg).drawRect(0, 0, tempGoalMainImg.width, tempGoalMainImg.height);
        goalMain.x = laneSpacing.x + 481;
        goalMain.y = laneSpacing.y - 109;

        goalMainContainer.addChild(goalMain);

        // set lights
        var light = new createjs.Sprite(lightsSpriteSheet, "off");
        light.x = laneSpacing.x + 517;
        light.y = laneSpacing.y - 109;
        light.name = "light" + i.toString();

        lightsContainer.addChild(light);

        laneSpacing.x = laneSpacing.x + 125;
        laneSpacing.y = laneSpacing.y + 63;
    }
}

function setupPlayer() {
    // player
    player = new Player(new createjs.Shape(), 1, new createjs.Shape());
    var roboBodyImg = loader.getResult("robodogBody");
    var roboFaceImg = loader.getResult("robodogFace");

    player.shapeBody.graphics.beginBitmapFill(roboBodyImg).drawRect(0, 0, roboBodyImg.width, roboBodyImg.height);
    player.shapeBody.x = lanes[1].playerXY.x;
    player.shapeBody.y = lanes[1].playerXY.y;

    player.shapeHead.graphics.beginBitmapFill(roboFaceImg).drawRect(0, 0, roboFaceImg.width, roboFaceImg.height);
    player.shapeHead.x = player.shapeBody.x + 42;
    player.shapeHead.y = player.shapeBody.y + 10;

    stage.addChild(player.shapeBody);
}

function setupTimer() {
    var timer = new createjs.BitmapText(countdownTimer.getSecondsLeft().toString(), numberSpriteSheet);
    timer.x = w / 2 - 12;
    timer.y = 10;
    timer.name = "CountdownTimer";

    stage.addChild(timer);
}

function parseScore() {
    var array = [];
    var tempscore = score.toString();

    for (var i = 0; i < tempscore.length; i++) {
        if (tempscore[i].localeCompare("-") == 0) {
            array.push("neg");
        } else {
            array.push(numToText[parseInt(tempscore[i])]);
        }
    }

    return array;
}

function playSound(id) {
    createjs.Sound.play(id, { pan: .0001, volume: 1 });
}