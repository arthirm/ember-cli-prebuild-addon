'use strict';
  
const fs = require('fs-extra');
const path = require('path');
const preBuild = require('../utils/prebuild-addon').preBuild;
const Command = require('ember-cli/lib/models/command');
const SilentError = require('silent-error');
const TREES_TO_NOT_PREBUILD = ['app', 'styles', 'public', 'test-support'];

module.exports = Command.extend({
  name: 'prebuild',
  description: 'Prebuilds addon trees that are specified in package.json of the addon or passed from command line',
  aliases: ['prebuild-addon', '-p'],

  // TODO: Use this option for developing and remove it since package.json should be the only source of truth to get the treetypes.
  availableOptions: [
    { name: 'trees', type: String, default: '', description: 'Comma seperated tree names that can be prebuilt for an addon' },
    { name: 'prebuild-targets', type: String, default: 'config/prebuild', description: 'path to target files for prebuilding'},
    { name: 'prebuild-path', type: String, default: 'pre-built', description: 'base path to store the prebuilt directory'}
  ],

  // Example command `ember prebuild -trees addon,templates,addon-test-support`
  async run(options) {
    let treeTypes = null;
    if(options.trees) {
      treeTypes = options.trees.split(',');
    }

    // Check if the given trees can be prebuilt
    if (TREES_TO_NOT_PREBUILD.some(tree => treeTypes.includes(tree))) {
      throw new SilentError(`The following trees ${TREES_TO_NOT_PREBUILD} are not advisable to be prebuilt. Please provide valid set of trees.`);
    }

    const targets = this.getPrebuildTargets(options);

    const buildTarget = (targetGroup) => {
      return preBuild(this.getAddonBasePath(), treeTypes, targetGroup, this.getPrebuiltPath(options)).catch(error => {
        console.error(error);
        process.exit(1);
      });
    }

    // Build the addon for all target groups sequentially
    const allTargetBuilds = [];
    if(targets && targets.length > 0) {
      for(const tg of targets) {
         let result = await buildTarget(tg);
         allTargetBuilds.push(result);
      }
    } else {
      //If no target group is specified then prebuild the addon using the default target group specified in ember-cli.
      let result = await buildTarget();
      allTargetBuilds.push(result);
    }

    return Promise.all(allTargetBuilds).then( () => console.log("Completed building all targets") );
  },

  /**
   * Fetches the target groups for the addon from the path specified in `prebuildTargets` options
   * @param {*} options
   */
  getPrebuildTargets(options) {
    const prebuildTargets = options.prebuildTargets;
    let targets = [];
    if(fs.existsSync(prebuildTargets)) {
      fs.readdirSync(prebuildTargets).forEach(targetGroup => {
        targets.push(path.resolve(path.join(prebuildTargets, targetGroup)));
      });
    }
   return targets;
  },

  /**
   * Returns the base path of the addon
   */
  getAddonBasePath() {
    return this.project.root;
  },

  /**
   * Get the base path for storing the prebuilt addon
   * @param {*} options
   */
  getPrebuiltPath(options) {
    return options.prebuiltPath;
  }
});