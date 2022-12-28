
var GameLayer = cc.Layer.extend({
    sprite:null,
    layerUI : null,
    layerGameplay : null,
    coin_action : null,
    gameStarted : false,
    mainHero : null,
    mainHeroArmature: null,
    heroSpeed : 120,
    heroSpeedPx : -1,
    jumpForce : 700,
    space : null,
    debugNode: null,
    globalCoins: [],

    //deep z values
    indexZFront: 1.2,
    indexZGame: 1,
    indexZBack1: 0.8,
    indexZBack2: 0.9,
    frontConveyor: [],
    gameConveyor: [],
    middleConveyor: [],
    backConveyor: [],

    gameUiJson: null,
    scorePanel: null,
    bestPanel: null,
    score: 0,
    pauseJson: null,
    gamePaused: false,
    curAnimation: "",
    heroTrapped: false,

    pirateArmature: null,
    antiHeroSpeed: -1,
    pirateAnimation: "",
    pirateAttack: false,
    curPirateSpeed: 0,

    gameOver: null,
    gameFinished: false,

    taptoStart: null,
    groundReady:false,
    count: 0,
    platId: 0,
    jumperArray: [],
    ctor:function () {

        this._super();
        currentScene = this;

        //Arrays cleaning
        this.frontConveyor = [];
        this.gameConveyor = [];
        this.middleConveyor = [];
        this.backConveyor = [];
        this.globalCoins = [];

        this.gameStarted = false;
        this.jumperArray = [];

        //prepare phys World
        this.space = new cp.Space();
        this.space.iterations = 15;
        this.space.sleepTimeThreshold = 0.5;
        this.space.collisionSlop = 0.1;
        this.space.gravity = cp.v(0, -950);
        this.space.setDefaultCollisionHandler(
                this.collisionBegin.bind(this),
                this.collisionPre.bind(this),
                this.collisionPost.bind(this),
                this.collisionSeparate.bind(this)
        );

        this.layerGameplay = new cc.Layer();
        this.addChild(this.layerGameplay);

        this.layerUI = new cc.Layer();
        this.addChild(this.layerUI);

        //Add the Debug Layer:
        // this.debugNode = new cc.PhysicsDebugNode(this.space);
        // this.debugNode.visible = true;
        // this.layerUI.addChild(this.debugNode);

        this.coin_action = ccs.load(res.CoinJson).action;

        cc.eventManager.addListener({ // <- the whole function moved here
          event: cc.EventListener.TOUCH_ONE_BY_ONE,
          swallowTouches: true,
          onTouchBegan: function (touch, event) {
            if(currentScene.gameStarted == false) {
              if (currentScene.taptoStart != null) {
                currentScene.taptoStart.node.removeFromParent(true);
              }
              currentScene.gameStarted = true;
            }
            if(currentScene.mainHero.canJump == true && currentScene.gamePaused == false) {
              currentScene.mainHero.canJump = false;
              currentScene.curAnimation = "jump";
              audioEngine.playEffect(res.jump_mp3,false);
              currentScene.mainHero.body.setVel(cp.v(currentScene.mainHero.body.getVel().x, currentScene.jumpForce));
            }
            return true;
          }
        }, this);

        //Camera Point
        this.cameraPoint = new cc.LayerColor(cc.color(230,25,50,0), 100, 100);
        this.cameraPoint.x = cc.winSize.width/2;
        this.cameraPoint.y = cc.winSize.height/2;
        this.layerGameplay.addChild(this.cameraPoint,100);
        var followAction = cc.follow(this.cameraPoint);
        followAction1 = followAction.clone();
        this.layerGameplay.runAction(followAction);
        // this.debugNode.runAction(followAction1);

        //prepare hero
        this.mainHero = null;
        var heroWidth = 45;
        var heroHeight = 95;

        // ///////circle body
        // var body = new cp.Body(1, cp.momentForCircle(500, 0, 25, cp.v(0, 0)));
        // body.setPos(cp.v(cc.view.getVisibleSize().width/2, 240));
        // this.space.addBody(body);
        //
        // // create circle shape
        // var shape = new cp.CircleShape(body, 30, cp.v(0, 0));

        ///////square body
        var body = new cp.Body(1, cp.momentForBox(1, 50, 50));
        body.setPos(cp.v(cc.view.getVisibleSize().width/2, 240));
        this.space.addBody(body);

        // create square shape
        var shape = cp.BoxShape(body,50,50);

        shape.setElasticity(0);
        shape.setFriction(0);
        this.space.addShape(shape);

        this.mainHero = shape;
        this.mainHero.name = "hero";
        this.mainHero.canJump = true;
        this.mainHero.onGroundCounter = 0;
        this.mainHero.moveRight = true;
        this.mainHero.jumpsQuantity = 0;
        this.mainHero.alive = true;
        this.mainHero.canMove = true;
        this.mainHero.curAnimation = ""

				ccs.armatureDataManager.addArmatureFileInfo(res.Crab_png, res.Crab_plist, res.Crab_data);
				this.mainHeroArmature = ccs.Armature.create("CrabAnim");

        this.curAnimation = "run";
        this.layerGameplay.addChild(this.mainHeroArmature,4);
        //this.parallaxNode.addChild(this.mainHeroArmature, 3, cc.p(1, 0), cc.p(cc.winSize.width/2, 250));
        this.mainHeroArmature.scale = 0.5;


        //prepare levels
        for(var iter=1; iter<5; iter++)this.addSubScene(iter);
        for(var iter=1; iter<5; iter++)this.addSubScene(iter);
        //for(var iter=1; iter<5; iter++)this.addSubScene(iter);

        //prepare Pirate
        ccs.armatureDataManager.addArmatureFileInfo(res.Pirate_png, res.Pirate_plist, res.Pirate_data);
				this.pirateArmature = ccs.Armature.create("Pirate");
        this.pirateArmature.y = 85;
        this.pirateArmature.x = 0 + this.pirateArmature.width/2;
        this.pirateArmature.pirateAnimation = "";
        this.pirateAnimation = "run";

        this.pirateArmature.getAnimation().setFrameEventCallFunc(function(bone, evt, originFrameIndex, currentFrameIndex) {
    		    currentScene.onFrameEvent(bone, evt, originFrameIndex, currentFrameIndex);
    		});

        this.layerGameplay.addChild(this.pirateArmature,4);

        //prepare GameUI
        this.gameUiJson = ccs.load(res.Game_UI);
        this.gameUiJson.node.x = this.cameraPoint.x;
        this.gameUiJson.node.y = cc.winSize.height;
        this.layerUI.addChild(this.gameUiJson.node,999);

        var pauseButton = this.gameUiJson.node.getChildByName("UI_Panel").getChildByName("Pause_Button");
        pauseButton.addTouchEventListener(this.pauseButtonEvent,this);

        this.scorePanel = this.gameUiJson.node.getChildByName("UI_Panel").getChildByName("Score_Panel").getChildByName("Score_Text");
        this.scorePanel.setString(0);

        bestScore = cc.sys.localStorage.getItem("bestScore");
        if (isNaN(bestScore) == true || bestScore == null) {
            bestScore = 0;
            cc.sys.localStorage.setItem("bestScore", bestScore);
        }
        bestScore = cc.sys.localStorage.getItem("bestScore");

        this.bestPanel = this.gameUiJson.node.getChildByName("UI_Panel").getChildByName("Best_Panel").getChildByName("Best_Text");
        this.bestPanel.setString(bestScore);

        //prepare TapToStart Label
        this.taptoStart = ccs.load(res.tapTS);
        this.taptoStart.node.x = this.cameraPoint.x;
        this.taptoStart.node.y = this.cameraPoint.y;
        this.layerUI.addChild(this.taptoStart.node);
        this.taptoStart.node.runAction(this.taptoStart.action);
        this.taptoStart.action.play("Loop",true);

        this.scheduleUpdate();
        return true;
    },
    onFrameEvent: function(bone, evt, originFrameIndex, currentFrameIndex) {
      if(evt == "DeadOrNot") {
        var heroBB = currentScene.mainHeroArmature.getBoundingBoxToWorld();
        heroBB.width = heroBB.width*0.4;
        var antiHeroBB = currentScene.pirateArmature.getBoundingBoxToWorld();
        if (cc.rectIntersectsRect(heroBB, antiHeroBB) && this.gameOver == null) {
          audioEngine.playEffect(res.hurt_mp3,false);
          this.gameOver = ccs.load(res.GameOverJson);
          this.pirateAnimation = "idil";
          this.curAnimation = "death";
          this.gameFinished = true;
          this.layerUI.addChild(this.gameOver.node,1001);
          this.gameOver.node.runAction(this.gameOver.action);
          this.gameOver.action.play("Enter",false);
          this.mainHero.body.setVel(cp.v(0,this.mainHero.body.getVel().y));

          var restartButton = this.gameOver.node.getChildByName("Restart_Button");
          restartButton.addTouchEventListener(this.restartGame,this);

          var homeButton = this.gameOver.node.getChildByName("Home_Button");
          homeButton.addTouchEventListener(this.homeButtonEvent,this);

          //Sound Button
          var mute = this.gameOver.node.getChildByName("Sound_Button");
          mute.addEventListener(this.muteAction, this);

          var tmpSound = cc.sys.localStorage.getItem("crabSound");
          if (tmpSound==1) {
            if(!audioEngine.isMusicPlaying()) {
              audioEngine.playMusic(res.song_mp3,true);
            }
            audioEngine.setMusicVolume(0.3);
            soundDisabled=false;
            mute.setSelected(false);
          } else {
            audioEngine.stopMusic();
            audioEngine.setMusicVolume(0.0);
            audioEngine.setEffectsVolume(0.0);
            soundDisabled=true;
            mute.setSelected(true);
          }

          var scoreText = this.gameOver.node.getChildByName("GO_Panel").getChildByName("Score_Text");
          scoreText.setString(Math.floor(this.score));

          this.gameOver.action.setFrameEventCallFunc(this.gameOverFrameEvent);

          bestScore = cc.sys.localStorage.getItem("bestScore");
          if (this.score > bestScore) {
            bestScore = Math.floor(currentScene.score);
            cc.sys.localStorage.setItem("bestScore", bestScore);
          }

          var bestText = currentScene.gameOver.node.getChildByName("GO_Panel").getChildByName("Best_Text");
          bestText.setString(bestScore);

        } else {
          currentScene.antiHeroSpeed = 0.1;
          currentScene.pirateAttack = false;
          currentScene.curAnimation = "run";
          currentScene.pirateAnimation = "run";
          currentScene.mainHero.body.setVel(cp.v(this.heroSpeed,this.mainHero.body.getVel().y));
        }
  		}
    },
    gameOverFrameEvent: function(frame) {
      if (frame.getEvent() == "play_loop") {
        if (currentScene.gameOver != null) {
          currentScene.gameOver.action.play("Loop",true);
        }
      }
    },
    pauseButtonEvent: function (sender, type) {
  		switch (type) {
  			case ccui.Widget.TOUCH_ENDED:
          audioEngine.playEffect(res.click_mp3,false);
          this.pauseJson = ccs.load(res.PauseJson);
          this.mainHero.body.setVel(cp.v(0,0));
          this.curAnimation = "stop";
          this.pirateAnimation = "idil";
          this.layerUI.addChild(this.pauseJson.node,1000);
          this.pauseJson.node.runAction(this.pauseJson.action);
          this.pauseJson.action.play("Enter",false);
          this.pauseJson.action.setFrameEventCallFunc(this.pauseFrameEvent);

          var resumeButton = this.pauseJson.node.getChildByName("Resume_Button");
          resumeButton.addTouchEventListener(this.resumeButtonEvent, this);

          var homeButton = this.pauseJson.node.getChildByName("Home_Button");
          homeButton.addTouchEventListener(this.homeButtonEvent, this);

          var bestScorePause = this.pauseJson.node.getChildByName("Map").getChildByName("Best_Score_Text");
          bestScorePause.setString(bestScore);

          //Sound Button
          var mute = this.pauseJson.node.getChildByName("Sound_Button");
          mute.addEventListener(this.muteAction, this);

          var tmpSound = cc.sys.localStorage.getItem("crabSound");
          if (tmpSound==1) {
            if(!audioEngine.isMusicPlaying()) {
              audioEngine.playMusic(res.song_mp3,true);
            }
            audioEngine.setMusicVolume(0.3);
            soundDisabled=false;
            mute.setSelected(false);
          } else {
            audioEngine.stopMusic();
            audioEngine.setMusicVolume(0.0);
            audioEngine.setEffectsVolume(0.0);
            soundDisabled=true;
            mute.setSelected(true);
          }

          this.gamePaused = true;
          break;
        default:
          break;
      }
    },
    pauseFrameEvent: function(frame) {
      if (frame.getEvent() == "exit") {
        currentScene.pauseJson.node.removeFromParent();
        currentScene.gamePaused = false;
        currentScene.mainHero.body.setVel(cp.v(currentScene.heroSpeed,currentScene.mainHero.body.getVel().y));
        currentScene.curAnimation = "run";
        currentScene.pirateAnimation = "run";
      }
    },
    resumeButtonEvent: function (sender, type) {
  		switch (type) {
        case ccui.Widget.TOUCH_ENDED:
          audioEngine.playEffect(res.click_mp3,false);
          this.pauseJson.action.play("Exit",false);
          break;
        default:
          break;
      }
    },
    homeButtonEvent: function (sender, type) {
  		switch (type) {
        case ccui.Widget.TOUCH_ENDED:
          audioEngine.playEffect(res.click_mp3,false);
          cc.director.runScene(new cc.TransitionFade(1, new MenuScene()));
          break;
        default:
          break;
      }
    },
    muteAction: function(sender, type) {
      switch ( type ) {
        case ccui.CheckBox.EVENT_SELECTED:
          audioEngine.playEffect(res.click_mp3,false);
          audioEngine.stopMusic();
          audioEngine.setMusicVolume(0.0);
          audioEngine.setEffectsVolume(0.0);
          cc.sys.localStorage.setItem("crabSound", 0);
          break;
        case ccui.CheckBox.EVENT_UNSELECTED:
          if(!audioEngine.isMusicPlaying()){
            audioEngine.playEffect(res.click_mp3,false);
            audioEngine.playMusic(res.song_mp3,true);
          }
          audioEngine.setMusicVolume(0.3);
          audioEngine.setEffectsVolume(0.9);
          cc.sys.localStorage.setItem("crabSound", 1);
          break;
        default:
          break;
      }
    },
    restartGame: function (sender, type) {
  		switch (type) {
        case ccui.Widget.TOUCH_ENDED:
          audioEngine.playEffect(res.click_mp3,false);
          cc.director.runScene(new cc.TransitionFade(1, new GameScene()));
          break;
        default:
          break;
      }
    },
    physParser: function(levelNode,numberChild) {
      for (var i = 0; i < levelNode.getChildren().length; i++) {
        if(this.groundReady == false && levelNode.getChildren()[i].getName()=="Ground_Collision"){
          var tmpBody = new cp.Body(1000000000000000,1000000000000000);
          tmpBody.setPos(cp.v(levelNode.getChildren()[i].x, levelNode.getChildren()[i].y+levelNode.getChildren()[i].height/2));
          var angle = levelNode.getChildren()[i].getRotationX();

  				var platform = new cp.BoxShape(tmpBody, 10000000, levelNode.getChildren()[i].height-2);
  				platform.setElasticity(0);
          platform.setFriction(0);
          platform.name = levelNode.getChildren()[i].getName();

          this.space.addShape(platform);
          this.groundReady = true;
        }
        if(levelNode.getChildren()[i].getName()=="Object_Collision"
        || levelNode.getChildren()[i].getName()=="Platform_Collision"
        || levelNode.getChildren()[i].getName()=="Trap_Collision"
        || levelNode.getChildren()[i].getName()=="Jumper_Collision") {

          var tmpBody = new cp.Body(1000000000000000,1000000000000000);

          if (levelNode.getChildren()[i].anchorX > 0) {
            tmpBody.setPos(cp.v((levelNode.getChildren()[i].x-this.count) + (numberChild*1134), levelNode.getChildren()[i].y));
          } else {
            tmpBody.setPos(cp.v((levelNode.getChildren()[i].x-this.count) + (numberChild*1134)+levelNode.getChildren()[i].width/2, levelNode.getChildren()[i].y+levelNode.getChildren()[i].height/2));
          }
          var angle = levelNode.getChildren()[i].getRotationX();

  				var platform = new cp.BoxShape(tmpBody, levelNode.getChildren()[i].width, levelNode.getChildren()[i].height);
  				platform.setElasticity(0);
          platform.setFriction(0);
          platform.name = levelNode.getChildren()[i].getName();

          if (angle != 0) {
            platform.body.setAngle(-angle);
          }

          this.space.addShape(platform);
          //this.physicsBodyList.push(platform);

          if (levelNode.getChildren()[i].getName()=="Jumper_Collision") {
            platform.canJumpOn = true;
            platform.platId = this.platId;
            this.platId++;
          }
        }
      }
    },
    addSubScene: function(curZIndex) {
      if (this.gameStarted==false) {
        var rand = 0;
      } else {
        var rand = Math.floor(Math.random()*5)+1;
      }
      switch (rand) {
        case 0:
          var level = ccs.load(res.Level1);
          break;
        case 1:
          var level = ccs.load(res.Level2);
          break;
        case 2:
          var level = ccs.load(res.Level3);
          break;
        case 3:
          var level = ccs.load(res.Level4);
          break;
        case 4:
          var level = ccs.load(res.Level5);
          break;
        case 5:
          var level = ccs.load(res.Level6);
          break;
        default:
          var level = ccs.load(res.Level1);
          break;
      }

      var level_node = level.node;
      var level_action = level.action;

      switch (curZIndex) {
        case 1:
          var curArray = this.backConveyor;
          var nameChild = "Back_Layer";
          break;
        case 2:
          var curArray = this.middleConveyor;
          var nameChild = "Middle_Layer";
          break;
        case 3:
          var curArray = this.gameConveyor;
          var nameChild = "Game_Layer";
          break;
        case 4:
          var curArray = this.frontConveyor;
          var nameChild = "Front_Layer";
          break;
        default:
          var curArray = this.gameConveyor;
          var nameChild = "Game_Layer";
          break;
      }
      var curNode = level_node.getChildByName(nameChild);
      curNode.retain();
      curNode.removeFromParent();
      curNode.release();

      if (curArray.length==0) {
        curNode.x = 0;
        curNode.numberChild = 0;
      } else {
        curNode.x = (curArray[curArray.length-1].x+1134)-this.heroSpeedPx;
        curNode.numberChild = ++curArray[curArray.length-1].numberChild;
      }

      curArray.push(curNode);
      this.layerGameplay.addChild(curNode,curZIndex);

      if(curZIndex == 3) {
        for (var i = 0; i < curNode.getChildren().length; i++) {
          if (curNode.getChildren()[i].getName() == "Jumper1" || curNode.getChildren()[i].getName() == "Jumper2") {
            this.jumperArray.push(curNode.getChildren()[i]);
          }
        }
        this.physParser(curNode,curNode.numberChild);
      }
      for (var u=0;u<curNode.getChildren().length;u++) {
        var curName = curNode.getChildren()[u].getName();
        if (curName == "Coin") {
          var tmpAction = this.coin_action.clone();
          curNode.getChildren()[u].runAction(tmpAction);
          tmpAction.gotoFrameAndPlay(0,tmpAction.getDuration(),Math.floor(Math.random()*tmpAction.getDuration()),true);
          this.globalCoins.push(curNode.getChildren()[u]);
        }
      }
    },
    canISee:function(curNode) {
      // var worldPos = curNode.convertToWorldSpace();
      // if(worldPos.x+1335>0)return true;
      // else return false;
      //var canSeePixels = (this.cameraPoint.x-cc.winSize.width/2)+(1134+cc.winSize.width/2);
      //var canSeePixels = (this.cameraPoint.x-curNode.x)+(1134+cc.winSize.width/2);
      if((this.cameraPoint.x-cc.winSize.width/2)<(curNode.x+1134)) return true;
      else return false;
    },
    updateHero:function() {
      if (this.gamePaused == false && this.gameFinished == false && this.heroTrapped == false) {
        if(this.mainHero.body.getVel().x<this.heroSpeed){
          this.mainHero.body.setVel(cp.v(this.heroSpeed,this.mainHero.body.getVel().y*0.5));
        }
      }
      this.mainHeroArmature.x = this.mainHero.body.p.x;
      this.mainHeroArmature.y = this.mainHero.body.p.y-20;
      if (this.mainHero.body.p.y > cc.winSize.height+300 || this.mainHero.body.p.y < 0) {
        if (this.gameOver == null) {

          bestScore = cc.sys.localStorage.getItem("bestScore");
          if (this.score > bestScore) {
            bestScore = Math.floor(currentScene.score);
            cc.sys.localStorage.setItem("bestScore", bestScore);
          }

          this.gameOver = ccs.load(res.GameOverJson);
          this.pirateAnimation = "idil";
          this.curAnimation = "death";
          this.gameFinished = true;
          this.layerUI.addChild(this.gameOver.node,1001);
          this.gameOver.node.runAction(this.gameOver.action);
          this.gameOver.action.play("Enter",false);
          this.mainHero.body.setVel(cp.v(0,this.mainHero.body.getVel().y));

          var restartButton = this.gameOver.node.getChildByName("Restart_Button");
          restartButton.addTouchEventListener(this.restartGame,currentScene);

          var homeButton = this.gameOver.node.getChildByName("Home_Button");
          homeButton.addTouchEventListener(this.homeButtonEvent,currentScene);

          //Sound Button
          var mute = this.gameOver.node.getChildByName("Sound_Button");
          mute.addEventListener(this.muteAction, this);

          var tmpSound = cc.sys.localStorage.getItem("crabSound");
          if (tmpSound==1) {
            if(!audioEngine.isMusicPlaying()) {
              audioEngine.playMusic(res.song_mp3,true);
            }
            audioEngine.setMusicVolume(0.3);
            soundDisabled=false;
            mute.setSelected(false);
          } else {
            audioEngine.stopMusic();
            audioEngine.setMusicVolume(0.0);
            audioEngine.setEffectsVolume(0.0);
            soundDisabled=true;
            mute.setSelected(true);
          }

          var scoreText = this.gameOver.node.getChildByName("GO_Panel").getChildByName("Score_Text");
          scoreText.setString(Math.floor(this.score));

          this.gameOver.action.setFrameEventCallFunc(this.gameOverFrameEvent);

          var bestText = currentScene.gameOver.node.getChildByName("GO_Panel").getChildByName("Best_Text");
          bestText.setString(bestScore);
        }
      }
    },
    updateAntiHero: function() {
      if (this.pirateArmature.x < (this.cameraPoint.x-918)) this.pirateArmature.x = this.cameraPoint.x-918;

      if (this.pirateAttack == true) this.pirateArmature.x = this.pirateArmature.x;
      else if (this.gameStarted == true && this.gamePaused == false && this.pirateAttack == false && this.gameFinished == false) this.pirateArmature.x += 4 + this.curPirateSpeed;
      else if (this.gameStarted == false && this.pirateAttack == false) this.pirateArmature.x = this.cameraPoint.x - 568;

      if (this.cameraPoint.x-this.pirateArmature.x<250 && this.gameFinished == false && this.pirateAttack == false) {
        this.pirateAttack = true;
        this.pirateAnimation = "attack";
        this.antiHeroSpeed = 0;
        audioEngine.playEffect(res.slash_mp3,false);
      }
    },
    updateCamera:function() {
      //move camera
      //this.gameUiJson.node.x = this.cameraPoint.x;
      if (this.gameFinished == false) {
        this.prevCamX = this.cameraPoint.x;
        this.cameraPoint.x=this.mainHero.body.p.x;
      }

      this.heroSpeedPx = this.cameraPoint.x-this.prevCamX;
      if(this.antiHeroSpeed < 0 && this.heroSpeedPx!=0) {
          this.antiHeroSpeed = this.heroSpeedPx;
      }
      // else {
      //   this.cameraPoint.x = this.cameraPoint.x;
      // }
      //update parallax
      if (this.gameFinished == false && this.mainHero.canMove == true) {
        for (var i = 0; i < this.backConveyor.length; i++) {
          this.backConveyor[i].x += this.heroSpeedPx*this.indexZBack2;
          if (this.canISee(this.backConveyor[i])==false) {
            var curZ = this.backConveyor[i].zIndex;
            this.backConveyor[i].removeFromParent();
            this.backConveyor.shift();
            this.addSubScene(curZ);
          }
        }
        for (var i = 0; i < this.middleConveyor.length; i++) {
          this.middleConveyor[i].x += this.heroSpeedPx*this.indexZBack1;
          if (this.canISee(this.middleConveyor[i])==false) {
            var curZ = this.middleConveyor[i].zIndex;
            this.middleConveyor[i].removeFromParent();
            this.middleConveyor.shift();
            this.addSubScene(curZ);
          }
        }
        for (var i = 0; i < this.gameConveyor.length; i++) {
          if (this.canISee(this.gameConveyor[i])==false) {
            var curZ = this.gameConveyor[i].zIndex;
            this.gameConveyor[i].removeFromParent();
            this.gameConveyor.shift();
            this.count += this.heroSpeedPx;
            this.addSubScene(curZ);
          }
        }
        for (var i = 0; i < this.frontConveyor.length; i++) {
          this.frontConveyor[i].x -= this.heroSpeedPx*this.indexZFront;
          if (this.canISee(this.frontConveyor[i])==false) {
            var curZ = this.frontConveyor[i].zIndex;
            this.frontConveyor[i].removeFromParent();
            this.frontConveyor.shift();
            this.addSubScene(curZ);
          }
        }
      }
      this.updateHero();
      this.updateAntiHero();

    },
    update:function(dt) {

      if(this.gameFinished!=true && this.gamePaused == false) {
        this.space.step(dt);
        this.space.step(dt);
      }
      this.updateCamera();
      this.simpleCollisionTest();

      if (this.gameStarted == true && this.gameFinished == false && this.mainHero.canMove == true) {
        if (this.gamePaused == false) {
          var mult = this.mainHero.body.getVel().x/120;
          this.score += (dt*mult);
          this.scorePanel.setString(Math.round(this.score));
        }
      }

      if (this.gameStarted == true) {
        if (this.curPirateSpeed < 4) {
          this.curPirateSpeed += 0.0005;
        }
      }

      //control hero animation
			if (this.curAnimation != this.mainHero.curAnimation) {
        switch (this.curAnimation) {
          case "stop":
            this.mainHero.curAnimation = "stop";
            this.mainHeroArmature.getAnimation().playWithIndex(0);
            this.mainHeroArmature.getAnimation().setSpeedScale(1);
            break;
          case "jump":
            this.mainHero.curAnimation = "jump";
            this.mainHeroArmature.getAnimation().playWithIndex(2);
            this.mainHeroArmature.getAnimation().setSpeedScale(1);
            break;
	        case "run":
            this.mainHero.curAnimation = "run";
	          this.mainHeroArmature.getAnimation().playWithIndex(3);
            this.mainHeroArmature.getAnimation().setSpeedScale(2);
            break;
          case "death":
            this.mainHero.curAnimation = "death";
            this.mainHeroArmature.getAnimation().playWithIndex(6);
            this.mainHeroArmature.getAnimation().setSpeedScale(1.5);
            break;
			    default:
            this.mainHero.curAnimation = "run";
            this.mainHeroArmature.getAnimation().playWithIndex(3);
	          this.mainHeroArmature.getAnimation().setSpeedScale(2);
			      break;
				}
			}

      //control pirate animation
      if (this.pirateAnimation != this.pirateArmature.pirateAnimation) {
        switch (this.pirateAnimation) {
          case "idil":
            this.pirateArmature.pirateAnimation = "idil";
            this.pirateArmature.getAnimation().playWithIndex(0);
            this.pirateArmature.getAnimation().setSpeedScale(1);
            break;
          case "run":
            this.pirateArmature.pirateAnimation = "run";
            this.pirateArmature.getAnimation().playWithIndex(1);
            this.pirateArmature.getAnimation().setSpeedScale(1);
            break;
          case "attack":
            this.pirateArmature.pirateAnimation = "attack";
            this.pirateArmature.getAnimation().playWithIndex(2);
            this.pirateArmature.getAnimation().setSpeedScale(2);
            break;
          default:
            this.pirateArmature.pirateAnimation = "run";
            this.pirateArmature.getAnimation().playWithIndex(1);
            this.pirateArmature.getAnimation().setSpeedScale(1);
            break;
        }
      }
    },
    collisionBegin: function (arbiter, space) {
      return true;
    },
    collisionPre: function (arbiter, space) {
      return true;
    },
    collisionPost: function (arbiter, space) {
      var obj = arbiter.getShapes();
      var objA = obj[0];
      var objB = obj[1];
      var contactPoints = null;
      var objHero = null;
      var objPlatform = null;
      var heroContactPoint = null;
      var objCanJump = null;

      if (objA.name == "hero") {
  			objHero = objA;
  			objPlatform = objB;
  			//contactPoints = arbiter.getPoint(0); // <- arbiter.getContactPointSet()[0]
  		} else if (objB.name == "hero") {
  			objHero = objB;
  			objPlatform = objA;
  			//contactPoints = arbiter.getPoint(1); // <- arbiter.getContactPointSet()[1]
  		}

  		if (objHero != null && objPlatform != null) {
  			if (objPlatform.getBody().getPos().y < objHero.getBody().getPos().y) {
          if (this.gamePaused == false && this.gameFinished == false && this.heroTrapped == false) {
    				this.mainHero.canJump = true;
            this.curAnimation = "run";
          }
  			}
        if (objPlatform.name == "Object_Collision" || objPlatform.name == "Platform_Collision") {
          if (objHero.getBody().getPos().y <= objPlatform.getBody().getPos().y) {
            if (this.mainHero.canMove == true && objHero.getBody().getPos().x < objPlatform.getBody().getPos().x) {
              this.heroSpeed = 0;
              this.mainHero.canMove = false;
              this.heroTrapped = true;
              this.curAnimation = "stop";
            }
          }
        }
        else if (objPlatform.name == "Jumper_Collision") {
          if (objPlatform.getBody().getPos().y < objHero.getBody().getPos().y && objPlatform.canJumpOn == true) {
            objPlatform.canJumpOn = false;
            audioEngine.playEffect(res.jump_mp3,false);
            this.mainHero.body.setVel(cp.v(this.mainHero.body.getVel().x, this.jumpForce+this.jumpForce*0.5));

            var jumpFile = ccs.load("res/" + this.jumperArray[objPlatform.platId].getName() + ".json");
            this.jumperArray[objPlatform.platId].runAction(jumpFile.action);
            jumpFile.action.play("goAnimation",false);
          }
        }
        else if (objPlatform.name == "Trap_Collision") {
          if (this.gameOver == null) {

            bestScore = cc.sys.localStorage.getItem("bestScore");
            if (this.score > bestScore) {
              bestScore = Math.floor(currentScene.score);
              cc.sys.localStorage.setItem("bestScore", bestScore);
            }

            audioEngine.playEffect(res.hurt_mp3,false);
            this.gameOver = ccs.load(res.GameOverJson);
            this.pirateAnimation = "idil";
            this.curAnimation = "death";
            this.gameFinished = true;
            this.layerUI.addChild(this.gameOver.node,1001);
            this.gameOver.node.runAction(this.gameOver.action);
            this.gameOver.action.play("Enter",false);
            this.mainHero.body.setVel(cp.v(0,this.mainHero.body.getVel().y));

            var restartButton = this.gameOver.node.getChildByName("Restart_Button");
            restartButton.addTouchEventListener(this.restartGame,currentScene);

            var homeButton = this.gameOver.node.getChildByName("Home_Button");
            homeButton.addTouchEventListener(this.homeButtonEvent,currentScene);

            //Sound Button
            var mute = this.gameOver.node.getChildByName("Sound_Button");
            mute.addEventListener(this.muteAction, this);

            var tmpSound = cc.sys.localStorage.getItem("crabSound");
            if (tmpSound==1) {
              if(!audioEngine.isMusicPlaying()) {
                audioEngine.playMusic(res.song_mp3,true);
              }
              audioEngine.setMusicVolume(0.3);
              soundDisabled=false;
              mute.setSelected(false);
            } else {
              audioEngine.stopMusic();
              audioEngine.setMusicVolume(0.0);
              audioEngine.setEffectsVolume(0.0);
              soundDisabled=true;
              mute.setSelected(true);
            }

            var scoreText = this.gameOver.node.getChildByName("GO_Panel").getChildByName("Score_Text");
            scoreText.setString(Math.floor(this.score));

            this.gameOver.action.setFrameEventCallFunc(this.gameOverFrameEvent);

            var bestText = currentScene.gameOver.node.getChildByName("GO_Panel").getChildByName("Best_Text");
            bestText.setString(bestScore);
          }
        }
      }
      return true;
    },
    collisionSeparate: function (arbiter, space) {
      if (this.mainHero.canMove == false) {
        this.mainHero.canMove = true;
        this.heroSpeed = 120;
        this.curAnimation = "run";
        this.heroTrapped = false;
      }
      return true;
    },

    simpleCollisionTest: function() {
      heroBoundBox = this.mainHeroArmature.getBoundingBoxToWorld();
      heroBoundBox.width = heroBoundBox.width*0.5;
      heroBoundBox.height = heroBoundBox.height*0.5;

      for (var iter = 0; iter < this.globalCoins.length; iter++) {
        var coinBBox =  this.globalCoins[iter].getBoundingBoxToWorld();
  			var tmpPos = this.globalCoins[iter].convertToWorldSpace();

  			var randomBezier = Math.random();
  			if (randomBezier > 0.5) {
  				var bezier = [cc.p(tmpPos.x, tmpPos.y), cc.p(cc.winSize.width/2, cc.winSize.height/2), cc.p(150,cc.winSize.height)];
  			} else {
  				var bezier = [cc.p(tmpPos.x, tmpPos.y), cc.p(cc.winSize.width/2, cc.winSize.height/2), cc.p(150,cc.winSize.height)];
  			}

  			var bezierTo = new cc.BezierTo(0.5, bezier);
  			//tmpPos.y = this.coinsArray[iter].globalY;
  			if (cc.rectIntersectsRect(heroBoundBox, coinBBox)) {
          // cc.log("heroBoundBox.x - " + heroBoundBox.x + " heroBoundBox.y - " + heroBoundBox.y);
          // cc.log("this.globalCoins[iter].x - " + this.globalCoins[iter].x + " this.globalCoins[iter].y - " + this.globalCoins[iter].y);
  				var curCoin = this.globalCoins[iter];
          //this.globalCoins[iter].animationSpeed(0.5)
          this.moveToAnotherLayer(this.globalCoins[iter],this.layerUI,tmpPos);
          var tmpPath = cc.sequence(cc.spawn(cc.callFunc(function () {
              audioEngine.playEffect(res.coin_mp3,false);
          }),cc.scaleTo(0.5,0.8,0.8),bezierTo),cc.hide(),cc.callFunc(function () {
  						currentScene.score += 10;
            }));
  				this.globalCoins[iter].runAction(tmpPath);
  				this.globalCoins.splice(iter, 1);
  				break;
  			}
  //			if(tmpPos.y+(this.cameraPoint.y-cc.winSize.height/2)<30){
  //				this.coinsArray[iter].setVisible(false);
  //				this.coinsArray.splice(iter, 1);
  //			}
  		}
    },
    moveToAnotherLayer: function(tmpObj, toLayer, newPos) {
  		if (tmpObj) {
  			tmpObj.retain();
  			tmpObj.removeFromParent();
  			toLayer.addChild(tmpObj);
  			tmpObj.release();
  			tmpObj.anchorX = 0.5;
  			tmpObj.anchorY = 0.5;
  			tmpObj.x = newPos.x;
  			tmpObj.y = newPos.y;
  		}
  	}
});

var GameScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new GameLayer ();
        this.addChild(layer);
    }
});
