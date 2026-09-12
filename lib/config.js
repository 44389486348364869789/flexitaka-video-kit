/**
 * config.js — thin wrapper so every module loads the config the same way, and
 * so a caller can point at a different config file with the VIDEO_CONFIG
 * environment variable (handy for keeping several video presets side by side).
 */
'use strict';
const path = require('path');
const { loadConfig } = require('./timeline');

function cfg() {
  return loadConfig(process.env.VIDEO_CONFIG || path.resolve(__dirname, '..', 'video.config.js'));
}

module.exports = { cfg };
