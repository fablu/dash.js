'use strict';

var app = angular
    .module('Player', [])
    .directive('toggleButton', function togglePlayPause() {
        return {
            restrict: 'E',
            scope: {
                toggle: '&',
                stateValueOne: '@',
                stateValueTwo: '@'
            },
            template: '<div id="toggleBtn" class="toggle-btn" title="Toggle"' +
            'ng-click="toggle = !toggle">' +
            '<div ng-show="toggle">' +
            '<span class="icon-toggle {{stateValueOne}}" aria-hidden="true"></span>' +
            '</div>' +
            '<div ng-show="!toggle">' +
            '<span class="toggle-icon {{stateValueTwo}}" aria-hidden="true"></span>' +
            '</div>' +
            '</div>'
        }
    })
    .controller('DashController', function ($scope, $timeout) {
        var lastVolumeLevel;
        var seekBarProcessing = false;
        var volumeBar = document.querySelector("#volumebar");
        var activatedCaption = null;
        var activatedAudioBitrate = null;
        var activatedVideoBitrate = null;
        var activatedAudioTrack = null;
        var videoControllerVisibleTimeout = 0;
        var videoBitrates;
        var audioTracks = [];

        var url = "file:///home/fabian/Videos/sintel%20dash/manifest.mpd";//http://www.bok.net/tmp/dash/multi_audio_mp4box/manifest.mpd";//https://bitdash-a.akamaihd.net/content/sintel/sintel.mpd";//http://www.bok.net/tmp/dash/multi_audio/stream.mpd";//http://vm2.dashif.org/dash/vod/testpic_2s/multi_subs.mpd";//http://dash.edgesuite.net/akamai/test/caption_test/ElephantsDream/elephants_dream_480p_heaac5_1.mpd";//";//http://dash.edgesuite.net/akamai/test/caption_test/ElephantsDream/elephants_dream_480p_heaac5_1.mpd";//http://dash.edgesuite.net/dash264/TestCases/1a/netflix/exMPD_BIP_TC1.mpd";//http://rdmedia.bbc.co.uk/dash/ondemand/testcard/1/client_manifest-events.mpd";";
        var player = dashjs.MediaPlayer().create();
        player.initialize(document.querySelector("#videoPlayer"), url, false);
        //while(!isReady());
        player.attachVideoContainer(document.getElementById("videoContainer"));
        var videoContainer = player.getVideoContainer;
        var video = player.getVideoElement();
        var videoController = document.getElementById("videoController");
        video.removeAttribute('controls');
        player.setAutoSwitchQuality(false);

        player.on(dashjs.MediaPlayer.events.TEXT_TRACKS_ADDED, onTracksAdded);
        player.on(dashjs.MediaPlayer.events.CAN_PLAY, onCanPlay);

        //---Volume-------------------------
        $scope.setVolume = function () {
            var volume = volumeBar.value;
            if (isNaN(volume)) {
                return 1;
            }
            else {
                if (lastVolumeLevel != volume) {
                    player.setVolume(volume);
                    player.setMute(player.getVolume() === 0);
                    toggleMute();
                    lastVolumeLevel = volume;
                }
            }
        }
        //----------------------------------

        //---Mute---------------------------
        $scope.toggleMute = function () {
            setMute();
        }
        //----------------------------------

        //---Play/Pause---------------------
        $scope.togglePlayPause = function () {
            player.isPaused() ? player.play() : player.pause();
            togglePlayPause();
            setTime();
        }
        //----------------------------------

        //---Timer for seekbar & duration---

        $scope.tickInterval = 100; //ms
        $scope.checkAudio = player.getInitialBitrateFor('video');
        var tick = function () {
            setTime();
            if (!seekBarProcessing) {
                setSeekBar();
            }
            $timeout(tick, $scope.tickInterval); // reset the timer
        }
        $timeout(tick, $scope.tickInterval); // start the timer

        $scope.setSeekBar = function () {
            if (seekBarProcessing) {
                var seekBar = document.getElementById("seekBar");
                player.seek(parseFloat(seekBar.value));
            }
        }

        $scope.startSeekBarProcessing = function () {
            seekBarProcessing = true;
        }

        $scope.stopSeekBarProcessing = function () {
            var seekBar = document.getElementById("seekBar");
            player.seek(parseFloat(seekBar.value));
            seekBarProcessing = false;
        }

        //----------------------------------

        //---fullscreen---------------------
        $scope.setFullscreen = function () {
            var fullscreenEnabled = document.fullscreenEnabled || //checks if elements can use fullscreen API
                document.msFullscreenEnabled ||
                document.mozFullScreenEnabled ||
                document.webkitFullscreenEnabled;

            var element = document.getElementById("videoContainer");

            if ((document.fullScreenElement && document.fullScreenElement !== null) || //requests a fullscreen of the video container
                (!document.mozFullScreen && !document.webkitIsFullScreen)) {
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.mozRequestFullScreen) {
                    element.mozRequestFullScreen();
                } else if (element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
                videoController.classList.add("video-controller-fullscreen");
            }
            else {
                if (document.cancelFullScreen) { //cancel fullscreen
                    document.cancelFullScreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }
                videoController.classList.remove('video-controller-fullscreen');
            }
        }

        $scope.onFullscreenMouseMove = function () {
            $scope.showController = true;
            if (document.getElementById("videoController").classList.contains("video-controller-fullscreen")) {
                clearTimeout(videoControllerVisibleTimeout);
                videoControllerVisibleTimeout = setTimeout(function () {
                    if (document.getElementById("videoController").classList.contains("video-controller-fullscreen")) {
                        $scope.showController = false;
                    }
                }, 3000);
            }
        }

        //----------------------------------

        //---settings-----------------------

        $scope.closeSettings = function () {
            closeSettings();
        }

        function onCanPlay() {
            setDuration();// set initial duration
            audioTracks = player.getTracksFor('audio');

            var videoBitrateNames = [],
                videoBitrates = player.getBitrateInfoListFor("video"),
                videoBitratesLength = videoBitrates.length + 1;//+1 for auto quality
            for (var i = 0; i < videoBitratesLength; i++) {
                videoBitrateNames[i] = i === 0 ? "Bitrate : auto" : "Bitrate" + " : " + videoBitrates[i - 1].bitrate;
            }
            $scope.videoBitrates = videoBitrateNames;

            var audioBitrateNames = [],
                audioBitrates = player.getBitrateInfoListFor("audio"),
                audioBitratesLength = audioBitrates.length + 1;//+1 for auto quality
            for (var i = 0; i < audioBitratesLength; i++) {
                audioBitrateNames[i] = i === 0 ? "Bitrate : auto" : "Bitrate" + " : " + audioBitrates[i - 1].bitrate;
            }
            $scope.audioBitrates = audioBitrateNames;

            var audioTrackNames = [],
                audioTrackNamesLength = audioTracks.length;
            for (var i = 0; i < audioTrackNamesLength; i++) {
                audioTrackNames[i] = "Audio Track" + " : " + audioTracks[i].lang;
            }
            $scope.audioTracks = audioTrackNames;

            player.setAutoSwitchQualityFor("video", true);
            $scope.activatedVideoBitrateName = "Bitrate : auto";
            player.setAutoSwitchQualityFor("audio", true);
            $scope.activatedAudioBitrateName = "Bitrate : auto";
            player.setTextTrack(-1);
            $scope.activatedCaptionName = "captions off";
            player.setCurrentTrack(audioTracks[0]);
            $scope.activatedAudioTrackName =  "Audio Track" + " : " + audioTracks[0].lang;
        }

        //>>>general
        $scope.toggleSettings = function () {
            toggleSettings();
        }

        //>>>video quality


        $scope.openQualitySettings = function () {
            $scope.showGeneralSettings = false;
            $scope.showQualitySettings = true;
        }

        $scope.activateVideoBitrate = function ($event, $index) {
            var element = $event.currentTarget;
            if (!(activatedVideoBitrate === null)) {
                activatedVideoBitrate.classList.remove("selected");
            }
            $scope.activatedVideoBitrateName = element.textContent;
            activatedVideoBitrate = element;
            activatedVideoBitrate.classList.add("selected");
            if($index!=0) {
                player.setAutoSwitchQualityFor("video", false);
                player.setQualityFor("video", $index - 1);
            }else{
                player.setAutoSwitchQualityFor("video", true);
            }
            toggleSettings();
        }

        //>>>audio

        $scope.openAudioSettings = function () {
            $scope.showGeneralSettings = false;
            $scope.showAudioSettings = true;
        }

        $scope.activateAudioBitrate = function ($event, $index) {
            var element = $event.currentTarget;
            if (!(activatedAudioBitrate === null)) {
                activatedAudioBitrate.classList.remove("selected");
            }
            $scope.activatedAudioBitrateName = element.textContent;
            activatedAudioBitrate = element;
            activatedAudioBitrate.classList.add("selected");
            if($index!=0) {
                player.setAutoSwitchQualityFor("audio", false);
                player.setQualityFor("audio", $index - 1);
            }else{
                player.setAutoSwitchQualityFor("audio", true);
            }
            toggleSettings();
        }

        //>>>caption

        //player.setTextTrack(0);

        function onTracksAdded(e) {
            var tracks = e.tracks,
                trackLength = tracks.length + 1;//+1 off button
            var captionNames = [];
            for (var i = 0; i < trackLength; i++) {
                captionNames[i] = i === 0 ? tracks[i].kind + " off" : tracks[i - 1].lang + " : " + tracks[i - 1].kind;
            }
            $scope.captions = captionNames;
        }

        $scope.openCaptionSettings = function () {
            $scope.showGeneralSettings = false;
            $scope.showCaptionSettings = true;
        }

        $scope.activateCaption = function ($event, $index) {
            var element = $event.currentTarget;
            if (!(activatedCaption === null)) {
                activatedCaption.classList.remove("selected");
            }
            $scope.activatedCaptionName = element.textContent;
            activatedCaption = element;
            activatedCaption.classList.add("selected");
            player.setTextTrack($index - 1);
            toggleSettings();
        }

        //>>>placeholder

        $scope.openPlaceholderSettings = function () {
            $scope.showGeneralSettings = false;
            $scope.showPlaceholderSettings = true;
        }

        $scope.activateAudioTrack = function ($event, $index) {
            var element = $event.currentTarget;
            if (!(activatedAudioTrack === null)) {
                activatedAudioTrack.classList.remove("selected");
            }
            $scope.activatedAudioTrackName = element.textContent;
            activatedAudioTrack = element;
            activatedAudioTrack.classList.add("selected");
            player.setCurrentTrack(audioTracks[$index]);
            toggleSettings();
        }

        //----------------------------------

        //---Help functions-----------------
        function setTime() {
            $scope.time = player.convertToTimeCode(player.time());
        }

        function setSeekBar() {
            var seekBar = document.getElementById("seekBar");
            seekBar.value = player.time();
        }

        function setMute() {
            player.setMute(!player.isMuted());
            toggleMute();
        }

        function setDuration() {
            var durationSec;
            durationSec = player.duration();
            $scope.duration = player.convertToTimeCode(durationSec);
            var seekBar = document.getElementById("seekBar");
            seekBar.max = durationSec;
        }

        function toggleMute() {
            var span = document.getElementById("muteIcon");
            if (player.isMuted()) {
                span.classList.remove('glyphicon-volume-up');
                span.classList.add('glyphicon-volume-off');
            } else {
                span.classList.remove('glyphicon-volume-off');
                span.classList.add('glyphicon-volume-up');
            }
        }

        function togglePlayPause() {
            var span = document.getElementById("playPauseIcon");
            if (player.isPaused()) {
                span.classList.remove('glyphicon-pause');
                span.classList.add('glyphicon-play');
            } else {
                span.classList.remove('glyphicon-play');
                span.classList.add('glyphicon-pause');
            }
        }

        function toggleSettings() {
            var settingsButton = document.getElementById("settingsIcon");
            if (settingsButton.classList.contains("rotated")) {
                closeSettings();
            }
            else {
                settingsButton.classList.add("rotated");
                $scope.showSettings = true;
                $scope.showGeneralSettings = true;
            }
        }

        function closeSettings() {
            var settingsButton = document.getElementById("settingsIcon");
            settingsButton.classList.remove("rotated");
            $scope.showSettings = false;
            $scope.showGeneralSettings = false;
            $scope.showQualitySettings = false;
            $scope.showAudioSettings = false;
            $scope.showCaptionSettings = false;
            $scope.showPlaceholderSettings = false;
        }

        //----------------------------------
    });