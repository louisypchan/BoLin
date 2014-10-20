/****************************************************************************
 Copyright (c) 2014 Louis Y P Chen (陈壹鹏).
 http://www.ve.cn
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/
/**
 * Created by Louis Y P Chen on 2014/10/10.
 */

//nodejs modules
var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;
var fs = require('fs');
var exists = fs.existsSync;
var path = require('path');
var dirname = path.dirname;
var basename = path.basename;

/**
 * Expose the root command.
 */
exports = module.exports = new Command;
/**
 * Expose `Command`.
 */
exports.Command = Command;
/**
 * Expose `Option`.
 */
exports.Option = Option;

/**
 * Initiate a new command
 * @param name
 * @constructor
 */
function Command(name){
    this.commands = [];
    this.options = [];
    this._execs = [];
    this._args = [];
    this._name = name;
}
//Inherit from EventEmitter
Command.prototype.__proto__ = EventEmitter.prototype;


Command.prototype.command = function(name, desc){
    var args = name.splice(/ +/), parent = this;
    if(args){
        var cmd = new Command(args.shift());
        cmd.parent = this;
        if(desc){
            parent = cmd;
        }
        this.commands.push(cmd);
    }
    return parent;
};



Command.prototype.version = function(str, flags){
    if(arguments.length == 0) return this._version;
    this._version = str;
    flags = flags || '-V, --version';
    this.on("version", function(){
        console.log(str);
        process.exit(0);
    });
    return this;
};
