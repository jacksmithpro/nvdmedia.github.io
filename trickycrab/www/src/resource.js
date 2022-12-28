var res = {
    Level1 : "res/Layer_1.json",
    Level2 : "res/Layer_2.json",
    Level3 : "res/Layer_3.json",
    Level4 : "res/Layer_4.json",
    Level5 : "res/Layer_5.json",
    Level6 : "res/Layer_6.json",
    CoinJson : "res/Coin.json",

    Crab_plist: "res/characters/CrabAnim0.plist",
    Crab_png: "res/characters/CrabAnim0.png",
    Crab_data: "res/characters/CrabAnim.ExportJson",

    Pirate_plist: "res/characters/Pirate0.plist",
    Pirate_png: "res/characters/Pirate0.png",
    Pirate_data: "res/characters/Pirate.ExportJson",

    MenuJson: "res/Main_Menu.json",
    PauseJson: "res/Pause_Menu.json",
    Game_UI: "res/Game_UI.json",
    GameOverJson: "res/Game_Over.json",
    tapTS: "res/Taptostart.json",

    jumper1: "res/Jumper1.json",
    jumper2: "res/Jumper2.json",

    click_mp3: "res/sound/click.mp3",
    hurt_mp3: "res/sound/hurt.mp3",
    jump_mp3: "res/sound/jump.mp3",
    slash_mp3: "res/sound/slash.mp3",
    coin_mp3: "res/sound/coin.mp3",
    song_mp3: "res/sound/song.mp3",
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
