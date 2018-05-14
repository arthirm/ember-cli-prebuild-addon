'use strict';
const fs = require('fs-extra');
const path = require('path');

function clearAllPrebuiltDirectories(object, targets, pckInfo, prebuiltPath) {
    let clearAddons = pckInfo.map(addon => {
        console.log(`Deleting ${path.join(addon.realPath, 'pre-built')}`)
        return fs.removeSync(path.join(addon.realPath, 'pre-built'));
    });
    return Promise.all(clearAddons);
 }

module.exports = { clearAllPrebuiltDirectories };