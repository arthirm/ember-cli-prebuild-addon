'use strict';

const clearAll = require('../utils/clear-prebuilt-addon').clearAllPrebuiltDirectories;
const Command = require('ember-cli/lib/models/command');
const Helper = require('../utils/helper');

module.exports = Command.extend({
  name: 'prebuild:clearAll',
  description: 'Prebuilds addon trees that are specified in package.json of the addon or passed from command line',
  aliases: ['prebuild-addon', '-p'],

  availableOptions: [
    { name: 'prebuild-targets', type: String, default: 'config/prebuild', description: 'path to target files for prebuilding'},
    { name: 'prebuild-path', type: String, default: 'pre-built', description: 'base path to store the prebuilt directory'},
    { name: 'addon', type: String, default: 'pre-built', description: 'base path to store the prebuilt directory'},
    { name: 'all',  type: Boolean, default: false, description: 'prebuilds all ember addons in the current app'}
  ],

   // clear all for all addons and all targets (default)
   // clear all targets for an addon
   // clear a target for an an addon
   // clear a target for all addons

  run(options) {  
    const targets = Helper.getPrebuildTargets(options);
    return clearAll(this, targets, Helper.getAddons.call(this, options), options.prebuildPath).catch(error => {
    console.error(error);
    process.exit(1);
    });
  },
});
