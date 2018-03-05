/* global Module Log */

/* Magic Mirror
 * Module: MMM-TTS
 *
 * By fewieden https://github.com/fewieden/MMM-TTS
 *
 * MIT Licensed.
 */

Module.register('MMM-TTS', {
    tts: '',

    defaults: {
        text: 'MMM-TTS',
        voice: null,
        speed: 1.0,
        debug: false
    },

    start() {
        Log.info(`Starting module: ${this.name}`);
        this.tts = this.config.text;
        this.audioTts = new Audio();
        this.sendSocketNotification('CONFIG', this.config);
    },

    notificationReceived(notification, payload) {
        if (notification === 'MMM-TTS') {
            this.sendSocketNotification('TTS', payload);
            this.tts = payload;
            this.updateDom();
        }
    },

    socketNotificationReceived(notification, payload) {
        if (notification === 'HIDE') {
            this.tts = this.config.text;
            this.updateDom();
        } else if (notification === 'GOOGLE_TTS_URL') {
            this.googleTtsUrl = payload;
            this.updateDom();
        }
    },

    getDom() {
        const wrapper = document.createElement('div');
        var self = this;
        if (this.config.debug === true) {
            wrapper.classList.add('thin', 'small', 'bright');
            wrapper.innerHTML = this.tts;
        }

        if (this.googleTtsUrl) {

            const url = this.googleTtsUrl;
            self.audioTts.src = url;
            self.audioTts.playbackRate = 1.2;
            self.audioTts.play().then(function() {
                console.log("Playback ok: " + url);
                this.googleTtsUrl = null;
            }).catch(function(error) {
                console.log("Playback failed: " + url + ", error=" + error);
            })

        }

        return wrapper;
    }
});
