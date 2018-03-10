/* Magic Mirror
 * Module: MMM-TTS
 *
 * By fewieden https://github.com/fewieden/MMM-TTS
 *
 * MIT Licensed.
 */

/* eslint-env node */

const NodeHelper = require('node_helper');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

module.exports = NodeHelper.create({

    start() {
        console.log(`Starting node helper for: ${this.name}`);
    },

    socketNotificationReceived(notification, payload) {
        const self = this;
        if (notification === 'CONFIG') {
            this.config = payload;
        } else if (notification === 'TTS') {

            let osDependentCurrentDir = path.dirname(fs.realpathSync(__filename));
            let currentDir = osDependentCurrentDir;
            const base64filename = new Buffer(payload).toString('base64') + ".mp3";
            const httpFilePath =  "/modules/" + this.name + "/cache/" + base64filename;

            // cache hit
            if (fs.existsSync(path.join(osDependentCurrentDir, "cache", base64filename))) {
                // console.log("TTS Cache hit for: " + payload);
                self.sendSocketNotification('GOOGLE_TTS_URL', httpFilePath);
		console.log("Playing " + payload);
		exec(' mplayer -speed 1.2 -af ladspa=/usr/lib/ladspa/tap_pitch.so:tap_pitch:0:-15:-90:0 -ao alsa:device=hw=0.0 ' + path.join(osDependentCurrentDir, "cache", base64filename));
            }
            // cache miss, download
            else {
                // console.log("TTS Cache miss for: " + payload);
                if (process.platform === "win32") {
                    currentDir = "/" + currentDir.replace(/\\/gi, "/").replace(/:/gi, "");
                }

                let localPath = currentDir + "/cache/" + base64filename;
                let command = "curl 'https://translate.google.com/translate_tts?ie=UTF-8&q=" + encodeURIComponent(payload) + "&tl=sk&client=tw-ob' -H 'Referer: http://translate.google.com/' -H 'User-Agent: stagefright/1.2 (Linux;Android 5.0)' > " + localPath;

                if (process.platform === "win32") {
                    command = "\"C:\\Program Files\\Git\\bin\\bash.exe\" -c \"" + command + "\"";
                    console.log("Running win32 command: " + command);
                }

                exec(command, (err, stdout, stderr) => {
                    console.log(stderr);
                    self.sendSocketNotification('GOOGLE_TTS_URL', httpFilePath);
                });
            }
        }
    }
});
