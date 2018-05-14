'use strict';

const addon = require('ember-cli/lib/models/addon');
const Helper = require('./lib/utils/helper');
const heimdallLogger = require('heimdalljs-logger');
const logger = heimdallLogger('ember-cli-prebuild-addon');
const TREES_TO_NOT_PREBUILD = ['app', 'styles', 'public', 'test-support'];
const path = require('path');
const fs = require('fs');

module.exports = {
  name: 'ember-cli-prebuild-addon',
  includedCommands() {
    return require('./lib/commands');
  },

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    const origTreeFor = addon.prototype.treeFor;

    addon.prototype.treeFor = function(treeType) {
     if (!TREES_TO_NOT_PREBUILD.includes(treeType) &&  ((this.app &&  this.app.options.overrideIsDevelopingAddon === true) || !this.isDevelopingAddon()) ) {
        const addonVersion = this.pkg.version ? this.pkg.version : '';
        let targetGroup = this.project.targets.browsers;
        let prebuildPath = this.app && this.app.prebuildPath;
        prebuildPath = Helper.getPrebuiltPath(prebuildPath, this._packageInfo.realPath);
        const prebuiltTree = Helper.getPreBuiltDirForTargetGroup(targetGroup, addonVersion, prebuildPath)

        if(fs.existsSync(path.join(prebuiltTree, treeType))) {
          logger.info(`Returning ${treeType} tree for ${this.name}`);
          console.log(`**** Returning ${treeType} tree for ${this.name}`);
          return prebuiltTree;
        }
      }
        return origTreeFor.call(this, treeType);
    }

  },
};