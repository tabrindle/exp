#!/usr/bin/env node

var _ = require('lodash-node');
var child_process = require('child_process');
var Command = require('commander').Command;
var crayon = require('@ccheever/crayon');
var glob = require('glob');
var instapromise = require('instapromise');
var path = require('path');
var program = require('commander');

var log = require('./log');
var update = require('./update');
var urlOpts = require('./urlOpts');

Command.prototype.urlOpts = function () {
  urlOpts.addOptions(this);
  return this;
};

Command.prototype.asyncAction = function (asyncFn) {
  return this.action(async (...args) => {
    try {
      let result = await asyncFn(...args);
    } catch (err) {
     if (err._isCommandError) {
       if (false) {
         log.error(crayon.orange.bold(err.code) + ' ' + crayon.red(err.message));
       } else {
         log.error(err.message);
       }
     } else if (err._isApiError) {
       log.error(crayon.red(err.message));
     } else {
       log.error(err.message);
       crayon.gray.error(err.stack);
     }
   }
  });
}

Command.prototype.asyncActionProjectDir = function (asyncFn) {
  return this.asyncAction(async (projectDir, ...args) => {
    if (!projectDir) {
      projectDir = process.cwd();
    }

    return asyncFn(projectDir, ...args);
  });
}

async function runAsync() {
  try {
    program.name = 'exp';
    program.version(require('../package.json').version);
    //glob.sync('./commands/**/*.js').forEach(file => {
    //  require(path.resolve(file))(program);
    //});

    require('./commands/url')(program);
    require('./commands/whoami')(program);

    program.parse(process.argv);

    /*let subCommand = _.head(program.args)
    let commands = _.map(program.commands, '_name');
    console.log('sldfjds ' + subCommand + ' ' + commands);
    if (!_.includes(commands, subCommand)) {
      program.help()
    }*/
  } catch (e) {
    console.error(e);
  }
}

async function checkForUpdateAsync() {
  let checkForUpdate = await update.checkForExpUpdateAsync();
  switch (checkForUpdate.state) {
    case 'up-to-date':
      break;
    case 'out-of-date':
      crayon.green.error(checkForUpdate.message);
      break;
    case 'ahead-of-published':
      crayon.cyan.error(checkForUpdate.message);
      break;
    case 'deprecated':
      crayon.yellow.bold.error(checkForUpdate.message);
      break;
    default:
      log.error("Confused about what version of exp you have?");
  }
}

if (require.main === module) {
  Promise.all([
    runAsync(),
    checkForUpdateAsync(),
  ]);
}
