/****************************************************************************
 Copyright (c) 2014 Louis Y P Chen.

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
 * Created by Louis Y P Chen on 2015/1/4.
 */
var gulp  = require('gulp');
var Path  = require('path');
var fs    = require('fs');
var gutil = require('gulp-util');
var swig  = require('swig');

var magenta = gutil.colors.magenta;

var bl = '../src/bl/core';
var output = '../bin';

var moduelRegex = /\$\.add\([\s\r\n]*(?:"([^"]+)"|(\[[^\[\]]*\]))[\s\r\n]*,[\s\r\n]*(?:(\[[^\[\]]*\]))*/im,
    moduleTemplate = '\n/* Generate by BoLin Compiler */\n$.config({{module|json|raw}});';
var mods = [];
function generateModules(){
    listDir(bl);
}

function listDir(dir){
    fs.readdir(dir, function(err, files){
        if(err){
            log('Can not find path : ' + err.path);
            return void(0);
        }
        files.forEach(function(p){
            p = Path.join(bl, p);
            fs.stat(p, function(err, stats){
                if(err) return void(0);
                if(stats.isDirectory()){
                    listDir(p);
                }else if(stats.isFile()){
                    //read file
                    fs.readFile(p,{encoding : 'utf-8'}, function(err, data){
                        if(err) return void(0);
                        var match = data.match(moduelRegex);
                        if(match){
                            var name, deps;
                            name = match[1];
                            deps = (name ? match[3] : match[2]).replace(/[\[\]"']|\s*/g, '');
                            !name && (name = p.replace('../src/', ""));
                            var mod = { mod : {} };
                            mod.mod[name] = {dependencies : deps ? deps.split(",") : []};
                            mods.push(mod);
                            //console.log(mods);
                            fs.appendFile('../src/bl.js',swig.render(moduleTemplate, {locals : {module : mod}}));
                        }
                    });
                }
            });
        });
    });
}


gulp.task('gen', function(){
    generateModules();
});


function log(message){
    gutil.log(magenta("BoLin -> "), message);
}