
'use strict';

const fs = require('fs-extra');
const path = require('path');
const PackageInfo = require('ember-cli/lib/models/package-info-cache/package-info')
const Project = require('ember-cli/lib/models/project');
const presetEnv = require('babel-preset-env/lib/targets-parser');
const md5Hex = require('md5-hex');

/**
 * Fetches the target groups for the addon from the path specified in `prebuildTargets` options
 * @param {*} options
 */
function getPrebuildTargets(options) {
    const prebuildTargets = options.prebuildTargets;
    let targets = [];
    if(fs.existsSync(prebuildTargets)) {
        fs.readdirSync(prebuildTargets).forEach(targetGroup => {
        targets.push(path.resolve(path.join(prebuildTargets, targetGroup)));
        });
    }
    return targets;
}

/**
 * Get the base path for storing the prebuilt addon
 * @param {*} options
 */
function getPrebuiltPath(prebuiltPath, addonPath) {
    if(!prebuiltPath || !path.isAbsolute(prebuiltPath)) {
        prebuiltPath = path.join(addonPath, 'pre-built');
    }
    return prebuiltPath;
}

function getAddons(options) {
  //  if(options.all) {      
        let addons = [];
        let packageInfoCache =  this.project.packageInfoCache.entries;
        let object = this;
        Object.keys(packageInfoCache).forEach( key => {
            let value = packageInfoCache[key];
            if(value instanceof PackageInfo) {
           
                if(value.pkg['ember-addon'] && value.pkg['ember-addon'].apps) {
                    value.pkg['ember-addon'].apps.map(app => {
                    const project = Project.closestSync(
                        path.resolve(app, ''),
                        object.project.ui,
                        object.project.cli
                    );
                    project.initializeAddons();
                    });
                }
            }
        });

        packageInfoCache =  object.project.packageInfoCache.entries;

        Object.keys(packageInfoCache).forEach( key => {
            let value = packageInfoCache[key];
            if(value instanceof PackageInfo && value.isAddon()) {
                    if(this.project.pkg.prebuild && this.project.pkg.prebuild.blacklistAddons && !this.project.pkg.prebuild.blacklistAddons.includes(value.name)) {
                   // console.log(value.name);
                    addons.push(value);
                    }
            }
        });

        return addons;
    // } else {
    //     // Return addon base path
    //     return [this.project.root];
    // }
}

/**
 * Create the prebuilt path for addon from the prebuilt base path, given target group and addon version
 * @param {*} targetGroup
 * @param {*} addonVersion
 * @param {*} prebuildPath
 */
function getPreBuiltDirForTargetGroup(targetGroup, addonVersion, prebuildPath) {
    const targetGrpDir = findCheckSumOfTargetGroup(targetGroup);
    const prebuiltPath = path.join(prebuildPath, `${targetGrpDir}-${addonVersion}`);
    return prebuiltPath;
}

/**
 * Find checksum of a target group using md5
 * @param {*} targets 
 */
function findCheckSumOfTargetGroup(targets) {
    if(Array.isArray(targets)) {        
        targets = targets.sort();
    }    
    targets = String.prototype.toUpperCase.apply(targets).split(",");
    return md5Hex(targets.toString());
}

function checkDefaultTreesSafeToBuild(treesToPrebuild, addonToBuild) {
    return treesToPrebuild.filter(treeType => {
        let fnName = 'treeFor' + (treeType.charAt(0).toUpperCase() + treeType.slice(1));
        return !addonToBuild.hasOwnProperty(fnName);
    });
}

function storeMetaData(prebuiltPath, targetGroupFile) {       
    let targets = presetEnv.default(targetGroupFile); 
    fs.writeFileSync(path.join(prebuiltPath, '.metadata'), JSON.stringify(targets), 'utf8');
}


module.exports = { getPrebuildTargets, getPrebuiltPath, getAddons, findCheckSumOfTargetGroup, getPreBuiltDirForTargetGroup, checkDefaultTreesSafeToBuild , storeMetaData};