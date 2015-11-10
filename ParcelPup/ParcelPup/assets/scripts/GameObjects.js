// PACKAGE OBJECT
function Package(packageType, shape) {
    this.packageType = packageType;
    this.shape = shape;
    this.isActiveInGame = false;
    this.laneIndex = -1;
}

// LANE OBJECT
function Lane(laneType, playerXY, packagePathStartXY, packagePathEndXY, shape) {
    this.laneType = laneType;
    this.playerXY = playerXY;
    this.packagePathStartXY = packagePathStartXY;
    this.packagePathEndXY = packagePathEndXY;
    this.shape = shape;
    this.isActiveLane = false;
}

// PLAYER OBJECT
function Player(shapeBody, laneIndex, shapeHead) {
    this.shapeBody = shapeBody;
    this.shapeHead = shapeHead;
    this.laneIndex = laneIndex;
    this.hasPackage = false;
}

// TIMER OBJECT
function Timer(duration) {
    this.duration = duration;
    var startTime = -1;
    var endTime = -1;
    var started = false;

    this.start = function () {
        startTime = createjs.Ticker.getTime(false);
        endTime = startTime + (this.duration * 1000);
        started = true;
    }

    this.getSecondsLeft = function () {
        if (!started) {
            // timer has not started yet so just return the duration
            return this.duration;
        }

        if (!this.isTimeUp()) {
            return Math.ceil((endTime - createjs.Ticker.getTime(false)) / 1000);
        }

        return 0;
    }

    this.isTimeUp = function () {
        if (started && createjs.Ticker.getTime(false) >= endTime) {
            return true;
        }
        return false;
    }

    this.reset = function () {
        started = false;
    }

    this.IsStarted = function () {
        return started;
    }
}

// PACKAGE MANAGER OBJECT
function PackageManager() {
    var packages = [];
    var activePackageIndex = -1;
    var previousPackageType = -1;
    var consecutiveMax = 3;
    var consecutiveCounter = 0;
    var packageContainer = new createjs.Container();

    this.getPackageContainer = function () {
        return packageContainer;
    }

    this.activePackage = function () {
        return packages[activePackageIndex];
    }

    this.clearActivePackageIndex = function () {
        activePackageIndex = -1;
    }

    this.HasPackagesActiveInGame = function () {
        for (var i = 0; i < packages.length; i++) {
            if (packages[i].isActiveInGame === true) {
                return true;
            }
        }
        return false;
    }

    this.removeActivePackage = function () {
        if (activePackageIndex > -1) {
            packages[activePackageIndex].isActiveInGame = false;
            packageContainer.removeChild(packages[activePackageIndex].shape);
            player.hasPackage = false;
        }
    }

    var spawnNewPackageInternal = function () {
        player.hasPackage = true;

        var random = Math.floor(Math.random() * 3);

        if (random == previousPackageType) {
            consecutiveCounter++;
        } else {
            consecutiveCounter = 0;
        }

        while (random == previousPackageType && consecutiveCounter >= consecutiveMax) {
            random = Math.floor(Math.random() * 3);
        }

        var pkg;

        // find a package of that type available to spawn
        for (i = 0; i < packages.length; i++) {
            if (packages[i].packageType === random && packages[i].isActiveInGame === false) {
                pkg = packages[i];
                break;
            }
        }

        // add additional package objects to keep up if all are active
        if (typeof pkg === 'undefined') {
            pkg = packages[initializePackage(random)];
        }

        previousPackageType = pkg.packageType;

        pkg.isActiveInGame = true;
        pkg.shape.x = player.shapeBody.x + 9;
        pkg.shape.y = player.shapeBody.y - 17;

        packageContainer.addChild(pkg.shape);
        activePackageIndex = packages.indexOf(pkg);
    }

    this.setupPackages = function (numberOfPackages, numberOfPackageTypes) {
        for (var x = 0; x < numberOfPackageTypes; x++) {
            for (var i = 0; i < numberOfPackages / numberOfPackageTypes; i++) {
                initializePackage(x);
            }
        }
    }

    var initializePackage = function (packageType) {
        var packageImg;

        switch (packageType) {
            case 0:
                packageImg = loader.getResult("greenBox");
                break;
            case 1:
                packageImg = loader.getResult("yellowBox");
                break;
            case 2:
                packageImg = loader.getResult("blueBox");
                break;
        }

        var pkg = new Package(packageType, new createjs.Shape());

        pkg.shape.graphics.beginBitmapFill(packageImg).drawRect(0, 0, packageImg.width, packageImg.height);
        packages.push(pkg);

        return packages.indexOf(pkg);
    }

    this.spawnNewPackage = function () {

        if (!player.hasPackage) {
            packageDropContainer.removeAllChildren();
            var sprite = new createjs.Sprite(packageDropSpriteSheet, "drop");
            sprite.x = player.shapeBody.x + 4;
            sprite.y = -281;

            packageDropContainer.addChild(sprite);

            createjs.Tween.get(sprite, { loop: false })
                .to({ y: player.shapeBody.y - 245 }, 200, createjs.Ease.none)
                .call(function () {
                    sprite.gotoAndPlay("squish");
                })
                .wait(100)
                .call(handleDropAnimComplete);
        }
    }

    var handleDropAnimComplete = function () {
        packageDropContainer.removeAllChildren();
        spawnNewPackageInternal();
    }
}