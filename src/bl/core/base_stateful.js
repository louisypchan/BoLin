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
 * Created by Louis Y P Chen on 2014/10/31.
 */
/**
 * The base class to be inherited
 */
$.add("bl/core/base_stateful", ["./declare", "./kernel"], function(declare, kernel){

    var PROPREGEX =  /[^\[\]]+/g ;



    return declare({
        "~name" : "$.core.base_stateful",
        /**
         * constructor
         * @param params
         */
        ctor : function(/*Object?*/ params){
            // Automatic setting of params during construction
        },

        /**
         * set value to the particular given name
         *  name should be a valid variable
         *  eg : test.items[1].title
         * @param parts
         * @param value
         * @private
         */
        _helper : function(parts, value){
            var len = parts.length, last = parts[len - 1], oldVal;
            var p, i = 0, rs = this, j = 0, l;
            while(rs && (p = parts[i++]) && i < len){
                j = 0;
                p = p.match(PROPREGEX);
                for(l = p.length; j < l; j++){
                    rs = rs[p[j]];
                }
            }
            last = last.match(PROPREGEX);
            l = last.length;
            j = 0;
            for(; j < l; j++){
                if(j=== (l -1)){
                    oldVal = rs[last[j]];
                    rs[last[j]] = value;
                    break;
                }
                rs = rs[last[j]];
            }
            return oldVal;
        },
        //set value to the particular given name
        set : function(name, value){
            var parts = name.split(".");
            //var oldValue = this._helper(name);
            var oldVal = this._helper(parts, value);
            if(this._watchCallbacks){
                this._watchCallbacks(name, oldVal, value);
            }
        },
        //TODO:
        watch : function(name, fn){
            if(!this._watchCallbacks){
                var self = this;
                this._watchCallbacks = function(name, oldValue, value, ignoreCatchall){
                    var notify = function(propertyCallbacks){
                        if(propertyCallbacks){
                            propertyCallbacks = propertyCallbacks.slice();
                            for(var i = 0, l = propertyCallbacks.length; i < l; i++){
                                propertyCallbacks[i].call(self, name, oldValue, value);
                            }
                        }
                    };
                    notify(self._watchCallbacks[name]);
                }
            }
            if(kernel.isFunction(name)){
                name = name();
            }
            if(!this._watchCallbacks[name]){
                this._watchCallbacks[name] = [];
            }
            this._watchCallbacks[name].push(fn);
        }
    });
});