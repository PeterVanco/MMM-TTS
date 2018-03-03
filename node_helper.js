/* Magic Mirror
 * Module: MMM-TTS
 *
 * By fewieden https://github.com/fewieden/MMM-TTS
 *
 * MIT Licensed.
 */

/* eslint-env node */

const NodeHelper = require('node_helper');
const tts = require('say');
const googleTTS = require('google-tts-api');
const token = require('google-translate-token');

module.exports = NodeHelper.create({

    start() {
        console.log(`Starting node helper for: ${this.name}`);
    },

    socketNotificationReceived(notification, payload) {
        var self = this;
        if (notification === 'CONFIG') {
            this.config = payload;
        } else if (notification === 'TTS') {

            googleTTS(payload, this.config.voice, this.config.speed)   // speed normal = 1 (default), slow = 0.24
                .then(function(url) {

                    // url = url.replace("&ttsspeed=" + self.config.speed, "");
                    //url = url.replace("&prev=input", "");

                    console.log(url); // https://translate.google.com/translate_tts?...
                    token.get(payload).then(console.log);
                    self.sendSocketNotification('GOOGLE_TTS_URL', url);
                })
                .catch(function(err) {
                    console.error(err.stack);
                });

            // tts.speak(payload, this.config.voice, this.config.speed, (err) => {
            //     if (err) {
            //         console.log(err);
            //     }
            //     this.sendSocketNotification('HIDE', {});
            // });
        }
    }
});
