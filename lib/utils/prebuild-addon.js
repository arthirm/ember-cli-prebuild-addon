'use strict';
const fs = require('fs-extra');
const path = require('path');
const builder = require('broccoli-builder');
const Addon = require('ember-cli/lib/models/addon');
const Project = require('ember-cli/lib/models/project');
const UI = require('console-ui');
const Merge = require('broccoli-merge-trees');
const Funnel = require('broccoli-funnel');
const SilentError = require('silent-error');
const md5Hex = require('md5-hex');
const DEFAULT_TREES_TO_PREBUILD = ['addon', 'templates', 'addon-test-support'];
const mergeTrees = require('ember-cli/lib/broccoli/merge-trees');
const Helper = require('../utils/helper');
const DEFAULT_TARGETS = require('ember-cli/lib/utilities/default-targets');


const ui = new UI({
    inputStream: process.stdin,
    outputStream: process.stdout,
    errorStream: process.stderr,
    writeLevel: 'INFO'
});

/**
 * Get the tree from addon for the given type
 * @param {*} currAddon 
 * @param {*} treeType addon or templates or addon-test-support
 */
function getTreeFor(currAddon, treeType) {
    if (currAddon.treeFor) {
        let tree;
        try{
            tree = currAddon.treeFor(treeType);
        } catch (error) {
            console.log(`Error in treefor ${treeType} for ${currAddon.name}`);
        }
        //if(tree && !mergeTrees.isEmptyTree(tree)) {
         if(tree && !(tree.options && tree.options.annotation === 'EMPTY_MERGE_TREE')) {
            return new Funnel (currAddon.treeFor(treeType), {
                destDir:  treeType
            });
        }
    }
}

/**
 * Merge all the trees from a given addon and return the merged tree.
 * @param {*} currAddon 
 * @param {*} treeTypes 
 */
function getMergedTreesFor(currAddon, treeTypes) {
    let trees = treeTypes.map(treeType => {
        return getTreeFor(currAddon, treeType);
    }).filter(tree => !!tree );

    if(trees.length === 0) {
        console.log(`No trees to pre-build in ${currAddon.name}`);
        return;
    }
    return Merge(trees);
}


/**
 * Build the addon and store it in prebuiltPath
 * @param {*} tree
 * @param {*} prebuiltPath
 */
function build(tree, prebuiltPath, targetGroup) {
    return new builder.Builder(tree).build().then(result => {
        console.log(`Built the addon and copied it to ${prebuiltPath}`);
        fs.copySync(result.directory, prebuiltPath, { dereference: true });
        const targets  = require(targetGroup);
        Helper.storeMetaData(prebuiltPath, targets);
    });
}

/**
 * Sets up the addon
 * @param {*} addonPath
 * @param {*} addonToBuild
 */
function setUpAddon(object, pkgInfo, addonToBuild, targetGroup) {
    
    let currentAddon =  object.project.findAddonByName(pkgInfo.name);
    if(!currentAddon) {
        let AddonConstructor = pkgInfo.getAddonConstructor();
        currentAddon = new AddonConstructor(object.project, object.project);
    }
    // if targetGroup is provided then use that to prebuild the addon
    if(targetGroup) {
        currentAddon.options = fs.readFileSync(targetGroup);
    }
    return currentAddon;
}


/**
 * Pre-build the addon and store it in prebuilt path by invoking the addon hooks
 * @param {*} addonPath 
 */
function preBuild(object, addon, targetGroup, prebuiltPath, options) {

    // Require the addon
    let addonToBuild = require(addon.realPath);

    if(!prebuiltPath) {
        prebuiltPath = addonToBuild.PREBUILT_PATH;
    }
   prebuiltPath = Helper.getPrebuiltPath(prebuiltPath, addon.realPath);

    const currAddon = setUpAddon(object, addon, addonToBuild, targetGroup);

    const addonVersion = addon.pkg.version ? addon.pkg.version : '';

    const targets = targetGroup ? require(targetGroup).browsers : DEFAULT_TARGETS;
    const prebuiltPathForTarget = Helper.getPreBuiltDirForTargetGroup(targets, addonVersion, prebuiltPath);

    fs.removeSync(prebuiltPathForTarget);

    let treesToPrebuild = DEFAULT_TREES_TO_PREBUILD;
    treesToPrebuild = Helper.checkDefaultTreesSafeToBuild(treesToPrebuild, addonToBuild)

    if(addonToBuild.TREES_TO_NOT_PREBUILD) {
        treesToPrebuild = treesToPrebuild.filter(treeType => !addonToBuild.TREES_TO_NOT_PREBUILD.includes(treeType));

        if(treesToPrebuild.length === 0) {
            currAddon.ui.writeLine(`No trees to pre-build in ${currAddon.name} for the target ${targetGroup}`);
            return Promise.resolve();
        }
    }

    // Merge the trees
    let mergedTree = getMergedTreesFor(currAddon, treesToPrebuild);
    //Build the resulting tree and store it in prebuild path
    if(!mergedTree) {
        return Promise.resolve();
    }

    return build(mergedTree, prebuiltPathForTarget, targetGroup);
 }

 const serialPromise = (iterable, fn) => {
    return iterable.reduce((promise, it) => {
        return promise.then(result =>
            fn(it).then(Array.prototype.concat.bind(result)));
    }, Promise.resolve([]));
}

function preBuildAddonFor(object, targets, addon, prebuiltPath, options) {
    const buildTarget = (targetGroup) => {
      return preBuild(object, addon, targetGroup, prebuiltPath, options).catch(error => {
        console.error(error);
        process.exit(1);
      });
    }

    // Build the addon for all target groups sequentially
    let allTargetBuilds = [];
    if(targets && targets.length > 0) {
      allTargetBuilds = serialPromise(targets, buildTarget);
    } else {
      //If no target group is specified then prebuild the addon using the default target group specified in ember-cli.
      allTargetBuilds.push(buildTarget());
    }
    return allTargetBuilds && allTargetBuilds.length > 0 ? Promise.all(allTargetBuilds) : allTargetBuilds
}

function prebuildAllAddonsFor(object, targets, addons, prebuiltPath, options) {
    const invoker = (addon) => preBuildAddonFor(object, targets, addon, prebuiltPath);
    const builds = serialPromise(addons, invoker);
    return Promise.resolve(builds);
 }

module.exports = { preBuild, build, preBuildAddonFor, prebuildAllAddonsFor};