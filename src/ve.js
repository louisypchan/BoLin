/****************************************************************************
 Copyright (c) 2014 Louis Y P CHEN (陈壹鹏).
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
 * The main namespace of ve, all engine core class, functions, properties and constants are defined in this namespace
 */
var ve = ve || {}, doc = window.document,
    ie_event_behavior = doc.attachEvent && typeof Windows === "undefined" && (typeof opera === "undefined" || opera.toString() != "[object Opera]"),
    noop = function(){},
    toString =  {}.toString,
    hasOwn = {}.hasOwnProperty;

//the version of ve
//will be replaced from moduleCfg
//TODO: replace the version in build phase
ve.version = "${version}";

//configurations for VE
ve.Cfg = {};

//Currently now it is browser-base framework
ve.isNative = false;

//AMD namespace
ve.__AMD = {};

ve._types = {};

(function(){
    //populate into types
    var arr = "Boolean Number String Function Array Date RegExp Object Error".split(" ");
    for(var i = 0, l = arr.length; i < l; i++){
        ve._types["[object " + arr[i] + "]"] = arr[i].toLowerCase();
    }
})();


//This is a temporary function to  handler the diff event across the browsers
//The event control will be moved to be an individual module
var domOn = function (node, eventName, ieEventName, handler){
    // Add an event listener to a DOM node using the API appropriate for the current browser;
    // return a function that will disconnect the listener.
    if(ie_event_behavior){
       node.attachEvent(ieEventName, handler);
        return function(){
            node.detachEvent(ieEventName, handler);
        }
    }else{
        node.addEventListener(eventName, handler);
        return function(){
            node.detachEvent(ieEventName, handler);
        }
    }
};

//+++++++++++++++++++++++++define a minimal library to help build the loader+++++++++++++++++++++++++++
(function(v){
    //internal, can be reused in lang.js
    v.__lang = {

        type : function(it){
           return it == null ? it + "" : (typeof it === "object" || typeof it === "function" ) ? ve._types[toString.call(it)]||"object" : typeof it;
        },

        isEmpty : function(it){

            for(var p in it){
                return 0;
            }
            return 1;
        },

        isFunction : function(it){
            return toString.call(it) == "[object Function]";
        },

        isString : function(it){
            return toString.call(it) == "[[object String]";
        },

        isArray : function(it) {
            return toString.call(it) == "[object Array]";
        },

        isPlainObject : function(it){
            if(this.type(it) !== "object" || (it && it.nodeType) || (it != null && it === it.window)){
                return false;
            }
            try{
                if(it && it.constructor && !hasOwn.call(it.constructor.prototype, "isPrototypeOf")){
                    return false;
                }
            }catch(e){return false;}
            return true;
        },

        forEach : function(it, callback){
            if(it){
                for(var i = 0; i < it.length;){
                    callback(it[i++]);
                }
            }
        },
        /**
         * Allows for easy use of object member functions in callbacks and other places
         * in which the "this" keyword
         * @param scope
         * @param method
         */
        ride : function (scope, method){
            if(!method){
                method = scope;
                scope = null;
            }
            if(this.isString(method)){
                scope = scope || window;
                if(!scope[method]){
                    throw new Error('ve.__lang.ride: scope["', method, '"] is null (scope="', scope, '")');
                }
                return function() { return scope[method].apply(scope, arguments || []);};
            }
            return !scope ? method : function() { return method.apply(scope, arguments || []); };
        },
        /**
         * simple copy function from src to dest
         * it is not for a deep copy
         * @param dest
         * @param src
         */
        mix : function(dest, src){
            for(var p in src){
                dest[p] = src[p];
            }
            return dest;
        },

        /**
         * The function refer to the implementation of jQuery to copy properties from source to target
         * https://github.com/jquery/jquery/tree/2.1.1-rc2
         * @returns {*|{}}
         */
        mixin : function(){
            var options, name, src, copy, copyIsArray, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false;
            //Handle a deep copy situation
            if ( typeof target === "boolean" ) {
                deep = target;
                //skip the boolean and the target
                target = arguments[ i ] || {};
                i++;
            }

            if(typeof target !== "object" && !this.isFunction(target)){
                target = {};
            }
            //extend jQuery itself if only one argument is passed
            if(i === length){
                target = this;
                i--;
            }

            for(; i < length; i++){
                //Only deal with non-null/undefined values
                if ( (options = arguments[ i ]) != null ) {
                    for ( name in options ) {
                        src = target[name];
                        copy = options[name];
                        if ( target === copy ) {
                            continue;
                        }
                        // Recurse if we're merging plain objects or arrays
                        if ( deep && copy && ( this.isPlainObject(copy) || (copyIsArray = this.isArray(copy)) ) ) {
                            if ( copyIsArray ) {
                                copyIsArray = false;
                                clone = src && this.isArray(src) ? src : [];
                            }else{
                                clone = src && this.isPlainObject(src) ? src : {};
                            }

                            // Never move original objects, clone them
                            target[name] = ve.__lang.mixin(deep, clone, copy);
                        }else if(copy !== undefined){
                            // Don't bring in undefined values
                            target[name] = copy;
                        }
                    }
                }
            }

            return target;
        }
    };
})(ve);
//+++++++++++++++++++++++++define a minimal library to help build the loader+++++++++++++++++++++++++++

//non-UA-based IE version check by James Padolsey, modified by jdalton - from http://gist.github.com/527683
ve.browser = {};

ve.browser.ie = (function(){
    var v = 3,
        div = doc.createElement("div"),
        a = div.all||[];
    do{
        div.innerHTML = "<!--[if gt IE " + ( ++v ) + "]><br><![endif]-->";
    }while(a[0]);

    return v > 4 ? v : !v;
})();
ve.browser.opera = typeof window.opera !== "undefined";

//+++++++++++++++++++++++++something about logger start+++++++++++++++++++++++++++
(function(v){
    var loggerLevelEnum = {
        'debug' : 1,
        'info'  : 2,
        'warn'  : 3,
        'error' : 4
        },
        logger = function(logFrom){
            var obj = {};
            for(var E in loggerLevelEnum){
                (function (obj, E) {
                    obj[E] = function (msg) {
                        return v.log(msg, E, logFrom);
                    };
                })(obj, E);
            }
            return obj;
        };
    /**
     * log function
     * Currently we log all of the debug messages, won't handle exclusive cases
     * @param msg
     * @param category
     * @param logFrom
     */
    v.log = function (msg, category, logFrom){
        var hit = true;
        //set debug to be a defualt category
        category = category||'debug';
        if(logFrom && hit){
            msg = '[' + logFrom + '] : ' + msg;
        }
        //
        if(typeof console !== 'undefined' && console.log && hit){
            console[category && console[category] ? category : 'log'](msg);
        }
    };
    v.logger = function(logFrom){
        return logger(logFrom);
    };
})(ve);
//+++++++++++++++++++++++++something about logger end+++++++++++++++++++++++++++

//+++++++++++++++++++++++++something about JSON start+++++++++++++++++++++++++++
(function(v){
    /**
     * Functions to parse and serialize JSON
     * to support JSON on IE6,7
     */
    var json = v.json = {},
        hasJSON = typeof JSON != "undefined";

    /**
     * check stringify property
     * Firefox 3.5/Gecko 1.9 fails to use replacer in stringify properly
     * refer to : https://bugzilla.mozilla.org/show_bug.cgi?id=509184
     */
    var __stringify = hasJSON && JSON.stringify({v:0},function(i,j){return j||1;}) == '{"v" : 0}';

    //use the function constructor to reduce the pollution
    v.eval = new Function('return eval(arguments[0]);');

    if(__stringify){
        v.json = JSON;
    }else{
        /**
         * form a valid string maybe with non-visual characters, double qutoe and backslash, surrounds with double quotes
         * @param str
         */
        var formString = function(str){
            return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
                replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
                replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r");
        };
        v.json = {
            /**
             * This is a temporay solution, will be revised in phase2
             * TODO: eval to be removed
             */
            parse : hasJSON ? JSON.parse : function (str, strict){
                if(strict && !/^([\s\[\{]*(?:"(?:\\.|[^"])*"|-?\d[\d\.]*(?:[Ee][+-]?\d+)?|null|true|false|)[\s\]\}]*(?:,|:|$))+$/.test(str)){
                    throw new SyntaxError("Invalid characters in JSON");
                }
                return v.eval('(' + str + ')');
            },
            stringify : function (value, replacer, spacer){
                var undef;
                if(typeof replacer == "string"){
                    spacer = replacer;
                    replacer = null;
                }
                function stringify(it, indent, key){
                    if(replacer){
                        it = replacer(key, it);
                    }
                    var val, objtype = typeof it;
                    if(objtype == "number"){
                        return isFinite(it) ? it + "" : "null";
                    }
                    if(objtype == "boolean"){
                        return it + "";
                    }
                    if(it === null){
                        return "null";
                    }
                    if(typeof it == "string"){
                        return formString(it);
                    }
                    if(objtype == "function" || objtype == "undefined"){
                        return undef; // undefined
                    }
                    // short-circuit for objects that support "json" serialization
                    // if they return "self" then just pass-through...
                    if(typeof it.toJSON == "function"){
                        return stringify(it.toJSON(key), indent, key);
                    }
                    if(it instanceof Date){
                        return '"{FullYear}-{Month+}-{Date}T{Hours}:{Minutes}:{Seconds}Z"'.replace(/\{(\w+)(\+)?\}/g, function(t, prop, plus){
                            var num = it["getUTC" + prop]() + (plus ? 1 : 0);
                            return num < 10 ? "0" + num : num;
                        });
                    }
                    if(it.valueOf() !== it){
                        // primitive wrapper, try again unwrapped:
                        return stringify(it.valueOf(), indent, key);
                    }
                    var nextIndent= spacer ? (indent + spacer) : "";
                    /* we used to test for DOM nodes and throw, but FF serializes them as {}, so cross-browser consistency is probably not efficiently attainable */

                    var sep = spacer ? " " : "";
                    var newLine = spacer ? "\n" : "";

                    // array
                    if(it instanceof Array){
                        var itl = it.length, res = [];
                        for(key = 0; key < itl; key++){
                            var obj = it[key];
                            val = stringify(obj, nextIndent, key);
                            if(typeof val != "string"){
                                val = "null";
                            }
                            res.push(newLine + nextIndent + val);
                        }
                        return "[" + res.join(",") + newLine + indent + "]";
                    }
                    // generic object code path
                    var output = [];
                    for(key in it){
                        var keyStr;
                        if(it.hasOwnProperty(key)){
                            if(typeof key == "number"){
                                keyStr = '"' + key + '"';
                            }else if(typeof key == "string"){
                                keyStr = escapeString(key);
                            }else{
                                // skip non-string or number keys
                                continue;
                            }
                            val = stringify(it[key], nextIndent, key);
                            if(typeof val != "string"){
                                // skip non-serializable values
                                continue;
                            }
                            // At this point, the most non-IE browsers don't get in this branch
                            // (they have native JSON), so push is definitely the way to
                            output.push(newLine + nextIndent + keyStr + ":" + sep + val);
                        }
                    }
                    return "{" + output.join(",") + newLine + indent + "}"; // String
                }
                return stringify(value, "", "");
            }
        };
    }
})(ve);
//+++++++++++++++++++++++++something about JSON end+++++++++++++++++++++++++++


//+++++++++++++++++++++++++something about loader start+++++++++++++++++++++++++++
(function(v){

    var force_active_xhr = !doc.addEventListener && window.location.protocol == "file:";
    /**
     * Loader for resource loading process. It's a singleton object.
     * @object
     * deprecated
     */
    v.__loader = {

        baseUrl : "./",

        getXhr : function(){
            var xhr = null;
            if(typeof XMLHttpRequest !== 'undefined' && !force_active_xhr){
                xhr = new XMLHttpRequest();
            }else{
                //old IEs
                for(var tags = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'], tag, i = 0; i < 3;){
                    try{
                        tag = tags[i++];
                        xhr = new ActiveXObject(tag);
                        if(xhr){
                            //use it if works
                            break;
                        }
                    }catch (e){
                        //fail to create a xhr object
                        xhr = null;
                        throw new Error("Can not create xhr object!");
                    }
                }
            }
            return xhr;
        },
        /**
         * load text by ajax
         * @param url
         * @param async
         * @param onLoad
         * @returns {string}
         */
        getText : function(url, async, onLoad) {
            var xhr = this.getXhr(), eventName = null;
            xhr.open('GET', url, async);
            if(ve.browser.ie && !ve.browser.opera){
                //specific logic for IE here
                xhr.setRequestHeader("Accept-Charset", "utf-8");
                if(async){
                    eventName = "onreadystatechange";
                }
            }else{
                if(xhr.overrideMimeType) xhr.overrideMimeType("text\/plain; charset=utf-8");
                if(async){
                    eventName = "onload";
                }
            }
            if(async){
                xhr[eventName] = function(){
                    if(xhr.readyState == 4 && xhr.status == 200){
                        onLoad(xhr.responseText);
                    }else{
                        throw new Error("Unable to load " + url + ' status: ' + xhr.status);
                    }
                };
            }
            xhr.send(null);
            if(!async){
                if(xhr.status == 200 || (!location.host && !xhr.status)){
                    if(onLoad){
                        onload(xhr.responseText);
                    }
                }else{
                    throw new Error("Unable to load " + url + ' status: ' + xhr.status);
                }
            }
            return xhr.responseText;
        },
        loadJSON : function(url, handler){
            this.getText(url, true, function(text){
                handler(ve.json.parse(text));
            });
        }
    };



    var logger = v.logger("Bolin");
    /**
     *
     * @param cfg
     * @constructor
     */
    var Module = function(cfg){
        this.pid = "";
        this.mid = "";
        this.url = "";
        this.pack = null;
        this.executed = ve.__AMD.state.INIT;
        this.deps = {};
        this.factory = noop;
        this.result = null;
        this.attached = ve.__AMD.state.INIT;
        this.plugin = null;
        ve.__lang.mix(this, cfg);
    };

    /**
     * A loader engine
     * @type {{}}
     */
    v.__AMD = {

        baseUrl : "./",

        timeout : 15000,

        cache : false,

        cacheMaps : {}, //TODO

        defaultCfg : {

            cache : false, //dev mode : false

            pkgs : [{
                "name" : "ve",
                "path" : "."
            }],
            async : true,  //do we need it????

            timeout : 7000  //by default is 7 seconds
        },

        sniffCfg : {}, //give vecfg as sniffed from script tag

        packs : {}, //a map from packageId to package configuration object

        aliases : [], //a vetor of pairs of [regexs or string, replacement] = > (alias, actual)

        state : {
            "ERROR"     : 23,
            "ABANDON"   : 110, //not a module
            "INIT"      : 0,
            "REQUESTED" : 1,
            "ARRIVED"   : 2,
            "EXECUTING" : 3,
            "EXECUTED"  : 4
        },
        /**
         *A hash:(mid) --> (module-object) the module namespace
         *The module-object can refer to Module class
         */
        mods : {},
        /**
         * Stores the modules which will be initialized at the end of laoder initialization
         */
        deferMods : [],

        pkg : {
            /**
             * redress the path
             * @param path
             * @returns {string}
             */
            redress : function(path){
                if(!path) return "";
                //reform the string
                path = path.replace(/\\/g, '/').replace(/[^\/]+(?=\/)\//g, function($0){
                        return $0 == "./" ? "" : $0;
                    });
                var cRegx = /[^\/]+\/\.\.\//g,
                    startWithRelative = (path.indexOf("../") === 0), prefix = "";
                if(startWithRelative){
                    prefix = "../";
                    path = path.substr(prefix.length);
                }
                while(/\.\.\//.test(path) && path.indexOf("../") != 0){
                    path = path.replace(cRegx, function(){ return "" });
                }
                return prefix + path;
            },

            /**
             *
             * @param name
             * @param refMod
             */
            getModule : function(name, refMod){

            },
            /**
             * agument package info
             * @param pkg
             */
            aumentPkgInfo : function(pkg){
                //assumpation the package object passed in is full-resolved
                var name = pkg.name;
                pkg = v.__lang.mix({m:"m"}, pkg);
                pkg.path = pkg.path ? pkg.path : name;
                //
                if(!pkg.m.indexOf("./")){
                    pkg.m = pkg.m.substr(2);
                }
                //put agumented pkg info in packs
                v.__AMD.packs[name] = pkg;
            },


            /**
             *
             * @param cfg
             * @param boot
             * @param refMod
             */
            configure : function(cfg, boot, refMod){
                //timeout timer
                v.__AMD.timeout = cfg['timeout']|| v.__AMD.defaultCfg.timeout;
                //if true, will generate a random number along with module to flush the cache
                v.__AMD.cache = cfg['cache'] ||v.__AMD.defaultCfg.cache;
                //augment the package info
                v.__lang.forEach(cfg.pkgs, v.__lang.ride(this, function(pkg){
                    this.aumentPkgInfo(pkg);
                }));
                //map aliases
                //override will happen if the key name is the same
                //key name has to be unique
                v.__lang.forEach(cfg.aliases, function(aliase){
                    if(v.__lang.isString(aliase[0])){
                        aliase[0] = aliase[0].replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, function(str) { return "\\" + str });
                    }
                    v.__lang.aliases.push([new RegExp("^" + aliase[0] + "$"), aliase[1]]);
                });
            }
        }
    };

    v.__AMD.BoLin = {

        defalutDeps : ["want", "exports", "module"],

        req : function(){

        },
        /**
         *
         * @param name
         * @param deps
         * @param factory
         *
         * eg: def("lang");
         */
        def : function(name, deps, factory){

            logger.debug("call def");

            var l = arguments.length,
                args = [0, name, deps];
            if(l == 1){
                args = [0, ve.__lang.isFunction(name) ? this.defalutDeps :[], name];
            }else if(l == 2 && ve.__lang.isString(name)){
                args = [name, ve.__lang.isFunction(deps) ? this.defalutDeps :[], deps];
            }else if(l == 3){
                args = [name, deps, factory];
            }

            if(args[1] === this.defalutDeps){
                //Remove comments from the callback string,
                //look for require calls, and pull them into the dependencies,
                //but only if there are function args.
                args[2].toString().replace(/(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg, "").replace(/[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g, function(match, dep){
                    //
                    args[1].push(dep);
                });
            }


        }
    };

    //only for easy use
    ve.req = ve.__AMD.BoLin.req;
    ve.def = ve.__AMD.BoLin.def;
})(ve);
//+++++++++++++++++++++++++something about loader end+++++++++++++++++++++++++++


//looks for a src attribute ending in ve.js
(function(v){
    //
    var scripts = doc.getElementsByTagName("script"),
        i = 0, l = scripts.length, script,src, match;
    while(i < l){
        script = scripts[i++];
        if((src = script.getAttribute("src")) && (match = src.match(/(((.*)\/)|^)ve\.js(\W|$)/i))){
            //sniff ve dir and baseUrl
            //v.__loader.baseUrl = (match[3] + "/") ||"./";
            v.__AMD.baseUrl = (match[3] + "/") || "./";
            break;
        }
        if(src = script.getAttribute("vecfg")){
            v.__AMD.sniffCfg = v.eval("({ " + src + " })");
        }
    }
})(ve);
/**
 * An engine to boot the framework
 */

ve.boot = {

    config : function(config){

    }
};

//init default config for loader
ve.__AMD.pkg.configure(ve.__AMD.defaultCfg);
ve.__AMD.pkg.configure(ve.__AMD.sniffCfg);