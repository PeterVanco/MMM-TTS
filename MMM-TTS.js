/* global Module Log */

/* Magic Mirror
 * Module: MMM-TTS
 *
 * By fewieden https://github.com/fewieden/MMM-TTS
 *
 * MIT Licensed.
 */

Module.register('MMM-TTS', {

    defaults: {
        text: 'MMM-TTS',
        voice: null,
        speed: 1.2,
    },

    tts: [],
    playLock: false,

    start() {
        Log.info(`Starting module: ${this.name}`);
        this.sendSocketNotification('CONFIG', this.config);
    },

    notificationReceived(notification, payload) {
        if (notification === 'MMM-TTS') {
            this.sendSocketNotification('TTS', payload);
        }
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'GOOGLE_TTS_URL') {
            this.tts.push(payload);
            this.playQueued();
        }
    },

    logQueue: function() {
        console.log("Current TTS queue: " + this.tts);
    },

    playQueued: function() {

        const self = this;

        this.logQueue();

        if (this.playLock === true) {
            console.log("Playback locked");
            setTimeout(function() {
                let isPlaying = self.audioElement
                    && self.audioElement.currentTime > 0
                    && !self.audioElement.paused
                    && !self.audioElement.ended
                    && self.audioElement.readyState > 2;

                if (!isPlaying) {
                    self.playLock = false;
                    console.log("Force - unlocking");
                }
                self.playQueued();
            }, 1000);
            return;
        }

        if (this.tts.length > 0) {
            const current = this.tts.pop();
            this.audioElement.src = current;
            this.audioElement.playbackRate = this.config.speed;

            this.playLock = true;
            this.audioElement.play().then(function() {
                console.log("Playback ok: " + current);
            }).catch(function(error) {
                console.log("Playback failed: " + current + ", error=" + error);
                setTimeout(function() {
                    self.playLock = false;
                    self.playQueued();
                }, 1000);
            })
        } else {
            console.log("Nothing for playback");
        }
    },

    getDom() {
        if (this.audioElement) {
            return this.audioElement;
        } else {
            const self = this;
            this.audioElement = new Audio();
            this.audioElement.onended = function() {
                console.log("Playback ended");
                setTimeout(function() {
                    self.playLock = false;
                    self.playQueued();
                }, 1000);
            };
            return this.audioElement;
        }
    },

});
