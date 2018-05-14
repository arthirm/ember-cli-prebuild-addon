'use strict';

const prebuildAllAddonsFor = require('../utils/prebuild-addon').prebuildAllAddonsFor;
const Helper = require('../utils/helper');
const Command = require('ember-cli/lib/models/command');

module.exports = Command.extend({
  name: 'prebuild:All',
  description: 'Prebuilds addon trees that are specified in package.json of the addon or passed from command line',
  aliases: ['prebuild-addon', '-p'],

  // TODO: Use this option for developing and remove it since package.json should be the only source of truth to get the treetypes.
  availableOptions: [
    { name: 'prebuild-targets', type: String, default: 'config/prebuild', description: 'path to target files for prebuilding'},
    { name: 'prebuild-path', type: String, default: 'pre-built', description: 'base path to store the prebuilt directory'},
    { name: 'all',  type: Boolean, default: false, description: 'prebuilds all ember addons in the current app'},
    { name: 'override-is-developing',  type: Boolean, default: false, description: 'prebuilds all ember addons even if isDevelopingAddon flag is set to true'},
  ],

  //  Default trees to build addon, templates, addon-test-support`
    run(options) {
      return prebuildAllAddonsFor(this, Helper.getPrebuildTargets(options), Helper.getAddons.call(this, options), options.prebuildPath, options).catch(error => {
        console.error(error);
        process.exit(1);
      });
  },
});