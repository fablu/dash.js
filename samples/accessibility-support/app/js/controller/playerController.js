function playerController() {
    var url = "http://dash.edgesuite.net/dash264/TestCases/1a/netflix/exMPD_BIP_TC1.mpd";
    var player = dashjs.MediaPlayer().create();
    player.initialize(document.querySelector("#videoPlayer"), url, true);

    /*player.setAutoPlay(true);
    controlbar = new playerControlBarController(player);
    controlbar.initialize();
    controlbar.disable()*/
}

module.exports = playerController;