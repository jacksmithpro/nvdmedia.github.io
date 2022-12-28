var currentScene=null;
var bestScore = null;
var audioEngine = null;

var MenuLayer = cc.Layer.extend({
  menuJson: null,
  ctor:function () {
    this._super();

    audioEngine = cc.audioEngine;

    currentScene = this;

    this.menuJson = ccs.load(res.MenuJson);

    this.addChild(this.menuJson.node,1);

    this.menuJson.node.runAction(this.menuJson.action);
    this.menuJson.action.play("Enter",false);
    this.menuJson.action.setFrameEventCallFunc(this.menuFrameEvent);

    var playButton = this.menuJson.node.getChildByName("Play_Button");
    playButton.addTouchEventListener(this.playButtonEvent,this);

    //Sound Button
    var mute = this.menuJson.node.getChildByName("Sound_Button");
    mute.addEventListener(this.muteAction, this);

    var tmpSound = cc.sys.localStorage.getItem("crabSound");
    tmpSound = parseInt(tmpSound);
    if (tmpSound === parseInt(tmpSound, 10)) {
    } else {
			cc.sys.localStorage.setItem("crabSound",1);
			tmpSound = cc.sys.localStorage.getItem("crabSound");
		}
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

    return true;
  },
  playButtonEvent: function (sender, type) {
		switch (type) {
			case ccui.Widget.TOUCH_ENDED:
        audioEngine.playEffect(res.click_mp3,false);
        this.menuJson.action.play("Exit",false);
        cc.director.runScene(new cc.TransitionFade(1, new GameScene()));
        break;
      default:
        break;
    }
  },
  menuFrameEvent: function(frame) {
    if (frame.getEvent() == "play_loop") {
      currentScene.menuJson.action.play("Loop",true);
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
        //audioEngine.playMusic(res.song_mp3,true);
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
});

var MenuScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new MenuLayer();
        this.addChild(layer);
    }
});
