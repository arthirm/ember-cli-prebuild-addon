'use strict';

module.exports = {
  name: 'ember-cli-prebuild-addon',
  includedCommands() {
    return require('./lib/commands');
  },
};
