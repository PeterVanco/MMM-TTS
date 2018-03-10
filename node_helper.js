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

    tts: [],
    playLock: false,

    start() {
        console.log(`Starting node helper for: ${this.name}`);
    },

    osPlayCommand: function() {
        if (process.platform === "win32") {
            let currentDir = path.dirname(fs.realpathSync(__filename));
            return 'start /min /wait ' + currentDir + '\\win32play.vbs ';
        } else {
            return 'mplayer -speed 1.2 -af ladspa=/usr/lib/ladspa/tap_pitch.so:tap_pitch:0:-15:-90:0 -ao alsa:device=hw=0.0 ';
        }
    },

    win32BashWrapper: function(command) {
        return "\"C:\\Program Files\\Git\\bin\\bash.exe\" -c \"" + command + "\"";
    },

    logAndExec: function(command, callback) {
        console.log("Executing: " + command);
        exec(command, callback);
    },

    osDownloadFile: function(currentDir, base64filename, payload) {
        if (process.platform === "win32") {
            currentDir = "/" + currentDir.replace(/\\/gi, "/").replace(/:/gi, "");
        }

        let localPath = currentDir + "/cache/" + base64filename;
        let command = "curl 'https://translate.google.com/translate_tts?ie=UTF-8&q=" + encodeURIComponent(payload) + "&tl=sk&client=tw-ob' -H 'Referer: http://translate.google.com/' -H 'User-Agent: stagefright/1.2 (Linux;Android 5.0)' > " + localPath;

        if (process.platform === "win32") {
            command = this.win32BashWrapper(command);
            console.log("Running win32 command: " + command);
        }
        return command;
    },

    playHandler: function(osDependentCurrentDir, base64filename) {
        const httpFilePath = "/modules/" + this.name + "/cache/" + base64filename;
        if (this.config.handler === 'frontend') {
            this.sendSocketNotification('GOOGLE_TTS_URL', httpFilePath);
        } else {
            this.tts.push(path.join(osDependentCurrentDir, "cache", base64filename));
            this.playQueued();
        }
    },

    playQueued: function() {
        if (this.tts.length > 0) {

            if (this.playLock === true) {
                console.log("Playback locked");
                return;
            }
            this.playLock = true;

            const self = this;
            const current = this.tts.shift();
            const command = this.osPlayCommand() + current;
            this.logAndExec(command, (err, stdout, stderr) => {
                if (err != null) {
                    console.log(err);
                    console.log(stderr);
                }
                setTimeout(function() {
                    self.playLock = false;
                    self.playQueued();
                }, 1000);
            });
        }
    },

    socketNotificationReceived(notification, payload) {
        const self = this;
        if (notification === 'CONFIG') {
            this.config = payload;
        } else if (notification === 'TTS') {

            let osDependentCurrentDir = path.dirname(fs.realpathSync(__filename));
            let currentDir = osDependentCurrentDir;
            const base64filename = new Buffer(payload).toString('base64') + ".mp3";

            // cache hit
            if (fs.existsSync(path.join(osDependentCurrentDir, "cache", base64filename))) {
                this.playHandler(osDependentCurrentDir, base64filename);
            }
            // cache miss, download
            else {
                let command = this.osDownloadFile(currentDir, base64filename, payload);
                this.logAndExec(command, (err, stdout, stderr) => {
                    if (err == null) {
                        self.playHandler(osDependentCurrentDir, base64filename);
                    } else {
                        console.log(err);
                        console.log(stderr);
                    }
                });
            }
        }
    }
});
