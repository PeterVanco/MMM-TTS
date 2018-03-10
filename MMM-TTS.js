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
	return;
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

        if (this.tts.length > 0) {

		if (this.playLock === true) {
		    console.log("Playback locked");
		    return;
		}
            this.playLock = true;
		console.log("Locked: " + this.playLock);


            const current = this.tts.shift();
		// this.recreateAudioElement();
            this.audioElement.src = current;
            this.audioElement.load();
            this.audioElement.playbackRate = this.config.speed;

            this.audioElement.play().then(function() {
                console.log("Playback ok: " + current);
		setTimeout(function() {
                	console.log("Checking missed onEnded event: ", self.playLock, self.audioElement.src, current);
			if (self.playLock === true && self.audioElement.src.endsWith(current)) {
                    		self.playLock = false;
				console.log("Forced unlocked (replaying): " + self.playLock);
			            self.tts.push(current);
                    		self.playQueued();
			}
		}, 10000);
            }).catch(function(error) {
                console.log("Playback failed: " + current + ", error=" + error);
                setTimeout(function() {
                    self.playLock = false;
		console.log("Unlocked: " + self.playLock);
                    self.playQueued();
                }, 2000);
            })
        } else {
            console.log("Nothing for playback");
        }
    },

    getDom() {
        if (this.audioElement) {
            return this.audioElement;
        } else {
                console.log("Constructing new Audio element");
		this.recreateAudioElement();
            };
            return this.audioElement;
        },

	recreateAudioElement: function() {
            const self = this;

            this.audioElement = new Audio();
            this.audioElement.onended = function() {
                console.log("Playback ended");
                setTimeout(function() {
                    self.playLock = false;
		console.log("Unlocked: " + self.playLock);
                    self.playQueued();
                }, 2000);
	}	
    },

});
