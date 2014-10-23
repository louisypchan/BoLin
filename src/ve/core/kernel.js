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
 * Created by Louis Y P Chen on 2014/10/23.
 */
$.add(["lang"], function(lang){

    var result = {};
    result = lang.mixin(result, lang);

    /**
     * A internal plugin to fix the accuracy of float number calculation
     */
    function roundTo(num, unit){
        if(0 > unit) return num;
        unit = Math.pow(10, unit);
        return Math.round(num * unit) / unit;
    }

    function addZeros(){
        var num = arguments[0], decimalSeparator = arguments[1], precision = arguments[2];
        num = num.split(decimalSeparator);
        void 0 == num[1] && precision > 0 && (num[1] == "0");
        return num[1].length < precision ? (num[1] += "0", addZeros(num[0] + decimalSeparator + num[1], decimalSeparator, precision)) : void 0 != num[1] ? num[0] + decimalSeparator + num[1] : num[0];
    }

    lang.mixin(result, {
        /**
         * similar to isArray() but more permissive
         * Doesn't strongly test for "arrayness".  Instead, settles for "isn't
         * a string or number and has a length property". Arguments objects
         * and DOM collections will return true when passed to
         * isArrayLike(), but will return false when passed to
         * isArray().
         * @param it
         */
        isArrayLike : function(it){
            return it && it !== undefined &&
            // keep out built-in constructors (Number, String, ...) which have length
                !lang.isString(it) && !lang.isFunction(it) &&
                !(it.tagName && it.tagName.toLowerCase() == "form") &&
                (lang.isArray(it) || isFinite(it.length));
        },
        /**
         * A alias method to mixin
         */
        extend : function(){
            return lang.mixin.apply(lang, arguments);
        },
        /**
         * Returns true if it is a built-in function
         */
        isNative : function(it){
            return /^[^{]+\{\s*\[native code/.test(it + "");
        },
        /**
         * Acoording to the format passing in to adjust the accuracy of float number
         * @param number
         * @param format
         *          precision           : the float precision, for this function, we will set 2 to precision
         *          decimalSeparator    : in some country, the float indicates by ",", by defalut is "."
         *          thousandsSeparator  :
         */
        sanitize : function(number, format){
            format = format || {precision : 2, decimalSeparator : ",", thousandsSeparator : "."};
            number = roundTo(number,format.precision);
            var decimalSeparator = format.decimalSeparator,
                thousandsSeparator = format.thousandsSeparator,
                isMinus = 0 > number ? '-' : '',
                number = Math.abs(number),
                numStr = number.toString();
            if(numStr.indexOf('e') == -1){
                for(var numArr = numStr.split(decimalSeparator), i = "", k = numArr[0].toString(), j = k.length; 0 <= j; j -= 3){
                    i = j != k.length ? 0 != j ? k.substring(j - 3, j) + thousandsSeparator + i : k.substring(j - 3, j) + i : k.substring(j - 3, j);
                }
                numArr[1] && (i = i + decimalSeparator + numArr[1]);
                format.precision > 0 && "0" != i && (i = addZeros(i,decimalSeparator,format.precision));
            }else{
                i = h;
            }
            i = isMinus + i;
            return i - 0;
        },
        /**
         * Clones objects (including DOM nodes) and all children.
         * Warning: do not clone cyclic structures.
         * @param src The object to clone
         */
        clone : function(src){
            if(!src || typeof src != "object" || lang.isFunction(src)){
                // null, undefined, any non-object, or function
                return src;
            }
            if(src.nodeType && "cloneNode" in src){
                // DOM Node
                return src.cloneNode(true); // Deep clone
            }
            if(src instanceof Date){
                // Date
                return new Date(src.getTime());	// Date
            }
            if(src instanceof RegExp){
                // RegExp
                return new RegExp(src);   // RegExp
            }
            var r, i, l;
            if(lang.isArray(src)){
                // array
                r = [];
                for(i = 0, l = src.length; i < l; ++i){
                    if(i in src){
                        r.push(lang.clone(src[i]));
                    }
                }

            }else{
                // generic objects
                r = src.constructor ? new src.constructor() : {};
            }
            return lang.mixin(true, {}, r, src);
        },
        /**
         * Add zero to number
         * @param num
         * @param digits
         */
        pad : function(num, digits){
            var pre = "",
                negative = (num < 0),
                string = String(Math.abs(num));
            if (string.length < digits) {
                pre = (new Array(digits - string.length + 1)).join('0');
            }
            return (negative ?  "-" : "") + pre + string;
        }
    });

    return result;
});