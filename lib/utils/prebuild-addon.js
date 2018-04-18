'use strict';
const fs = require('fs-extra');
const path = require('path');
const builder = require('broccoli-builder');
const Addon = require('ember-cli/lib/models/addon');
const AddonsFactory = require('ember-cli/lib/models/addons-factory');
const Project = require('ember-cli/lib/models/project');
const UI = require('console-ui');
const Merge = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const SilentError = require('silent-error');


/**
 * Get the tree from addon for the given type
 * @param {*} currAddon 
 * @param {*} treeType addon or templates or addon-test-support
 */
function getTreeFor(currAddon, treeType) {
    return new Funnel (currAddon.treeFor(treeType), {
        destDir:  treeType
    });
}

/**
 * Merge all the trees from a given addon and return the merged tree.
 * @param {*} currAddon 
 * @param {*} treeTypes 
 */
function getMergedTreesFor(currAddon, treeTypes) {   
    let trees = treeTypes.map(treeType => {
        return getTreeFor(currAddon, treeType);
    });
    return Merge(trees);
}

/**
 * Get the trees that can be prebuilt for an addon from the package.json of the addon
 * @param {*} addon 
 */
function getTreeTypesToPreBuild(addon) {
    return addon.project.pkg.prebuildTrees;
}

/**
 * Build the addon and store it in prebuiltPath
 * @param {*} tree
 * @param {*} prebuiltPath
 */
function build(tree, prebuiltPath) {
    return new builder.Builder(tree).build().then(result => {
        fs.copySync(result.directory, prebuiltPath, { dereference: true });
    });
}

/**
 * Sets up the addon
 * @param {*} addonPath
 * @param {*} addonToBuild
 */
function setUpAddon(addonPath, addonToBuild) {
    const ui = new UI({
        inputStream: process.stdin,
        outputStream: process.stdout,
        errorStream: process.stderr,
        writeLevel: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR',
        ci: true | false
    });
    const project = Project.closestSync(addonPath, ui);
    project.initializeAddons();
    const currentAddon = project.addons.find( a => {
        if(a.parent && a.parent.pkg.name === project.pkg.name) {
            return true;
        }
    });
    return currentAddon;
}

/**
 * Pre-build the addon and store it in prebuilt path by invoking the addon hooks
 * @param {*} addonPath 
 * @param {*} treeTypes Array of trees that can be prebuilt like addon or templates or addon-test-support
 */
function preBuild(addonPath, treeTypes) {
    // Require the addon
    let addonToBuild = require(addonPath);
    // If addon has pre-built path set in it, use that else use the default path
    if(!addonToBuild.PREBUILT_PATH) {
        addonToBuild.PREBUILT_PATH = `${addonPath}/pre-built`;
    }
    fs.removeSync(addonToBuild.PREBUILT_PATH);
    let currAddon = setUpAddon(addonPath, addonToBuild);

    // If the trees to be build for an addon is not passed in command line then read it from package.json of the addon
    if(!treeTypes) {
        treeTypes = getTreeTypesToPreBuild(currAddon);
        if(!treeTypes) {
            throw new SilentError(`Please provide the tree types to be prebuilt using the command line option ('ember prebuild -trees addon,templates,addon-test-support') or in package.json ("prebuildTrees" : ["addon", "templates" ,"addon-test-support"]).`);
        }
    }
    // Merge the trees
    let mergedTree = getMergedTreesFor(currAddon, treeTypes);

    //Build the resulting tree and store it in prebuild path
    return build(mergedTree, addonToBuild.PREBUILT_PATH);
 }

module.exports = {preBuild, build };
