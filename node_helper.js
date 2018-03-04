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
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

module.exports = NodeHelper.create({

    start() {
        console.log(`Starting node helper for: ${this.name}`);
    },

    socketNotificationReceived(notification, payload) {
        var self = this;
        if (notification === 'CONFIG') {
            this.config = payload;
        } else if (notification === 'TTS') {

            // TODO: download and send local URI
            // curl 'https://translate.google.com/translate_tts?ie=UTF-8&q=Hello%20Everyone&tl=en&client=tw-ob' -H 'Referer: http://translate.google.com/' -H 'User-Agent: stagefright/1.2 (Linux;Android 5.0)' > google_tts.mp3

            const dirString = path.dirname(fs.realpathSync(__filename));
            console.log('directory to start walking...', dirString);
            let url = dirString + "/google_tts.mp3";
            let command = "curl 'https://translate.google.com/translate_tts?ie=UTF-8&q=" + encodeURIComponent(payload) + "&tl=sk&client=tw-ob' -H 'Referer: http://translate.google.com/' -H 'User-Agent: stagefright/1.2 (Linux;Android 5.0)' > " + url;
            exec(command, (err, stdout, stderr) => {
                console.log(stdout);
                console.log(stderr);
                self.sendSocketNotification('GOOGLE_TTS_URL', url);
            });

            return;

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
