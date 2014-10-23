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
 * Created by Louis Y P Chen on 2014/10/23.
 */
$.add(["ve/core/kernel"], function(kernel){
    // module:
    //		ve/extensions/array
    //      an extension of Array

    // indexOf, lastIndexOf
    function index(up){
        console.log("[ve/extensions/array] : index");
        var delta = 1, lOver = 0, uOver = 0;
        if(!up){
            delta = lOver = uOver = -1;
        }
        var __index = function(a, x, from, last){
            if(last && delta > 0){
                return __index(a, x, from);
            }
            var l = a && a.length || 0, end = up ? l + uOver : lOver, i;
            if(from === u){
                i = up ? lOver : l + uOver;
            }else{
                if(from < 0){
                    i = l + from;
                    if(i < 0){
                        i = lOver;
                    }
                }else{
                    i = from >= l ? l + uOver : from;
                }
            }
            if(l && typeof a == "string") a = a.split("");
            for(; i != end; i += delta){
                if(a[i] == x){
                    return i; // Number
                }
            }
            return -1; // Number
        };
        return __index;
    }

    var arr = Array.prototype;

    kernel.extend(Array.prototype, {
        indexOf : arr.indexOf || function(){
            return index(true).apply(this, arguments);
        },
        contains : arr.contains || function(){
            return this.indexOf.apply(this, arguments) != -1
        },
        lastIndexOf : arr.indexOf || function(){
            return index(false).apply(this, arguments);
        },
        /**
         * only support number or string array now
         * TODO:
         */
        unique : arr.unique || function(){
            var result = [], hash = {};
            for(var i = 0, elem , l = this.length; i < l; ){
                elem = this[i++];
                if(!hash[elem]){
                    result.push(elem);
                    hash[elem] = true;
                }
            }
            return result;
        },
        /**
         * Returns a new Array with those items from arr that match the condition implemented by callback.
         * example:
         *      filter([1, 2, 3, 4], function(item){ return item>1; });
         *      ->
         *          [2,3,4]
         */
        filter : arr.filter || function(/*Function*/rule){
            var i = 0, l = this.length, out = [], value;
            for(; i < l; ++i){
                value = this[i];
                if(rule(value, i, this)){
                    out.push(value);
                }
            }
            return out;
        },
        /**
         *  for every item in arr, callback is invoked. Return values are ignored.
         */
        forEach : arr.forEach || function(cb){
            var i = 0, l = this.length;
            for(; i < l; ++i){
                cb.apply(this, [this[i], i]);
            }
        },
        /**
         * applies callback to each element of arr and returns an Array with the results
         * example:
         *      map([1, 2, 3, 4], function(item){ return item + 1; });
         *      ->
         *          [2,3,4, 5]
         */
        map : arr.map || function(cb){
            var i = 0, l = this.length, out = [];
            for(; i < l; ++i){
                out[i] = cb.apply(this, [this[i], i]);
            }
            return out;
        },

        //TODO: move to phase2
        /**
         * Determines whether or not every item in arr satisfies the condition implemented by callback.
         */
        every : function(){},
        /**
         * Determines whether or not any item in arr satisfies the condition implemented by callback.
         */
        some : function(){}
    });
});