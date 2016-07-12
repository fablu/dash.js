'use strict';

function playerControlBarController(dashPlayer) {
    return {
        initialize:function(){
            if (!player) {
                throw new Error("Please pass an instance of MediaPlayer.js when instantiating the ControlBar Object");
            }
            video  = player.getVideoElement();
            if (!video) {
                throw new Error("Please call initialize after you have called attachView on MediaPlayer.js");
            }

            video.controls = false;

            player.on(dashjs.MediaPlayer.events.PLAYBACK_STARTED, onPlayStart);
            player.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, onPlaybackPaused);

            playPauseBtn.addEventListener("click", onPlayPauseClick);
        },
        show : function(){
            videoController.classList.remove("hide");
        },
        hide : function(){
            videoController.classList.add("hide");
        },
        disable : function(){
            videoController.classList.add("disable");
        },
        enable : function(){
            videoController.classList.remove("disable");
        },
        destroy : function(){
            /*reset();*/
            playPauseBtn.removeEventListener("click", onPlayPauseClick);
            player.off(dashjs.MediaPlayer.events.PLAYBACK_STARTED, onPlayStart);
            player.off(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, onPlaybackPaused);
        }
    }
}

module.exports = playerControlBarController;



