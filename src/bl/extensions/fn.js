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
$.add("bl/extensions/fn",["bl/core/kernel"], function(kernel){

    var fn = Function.prototype,
        slice = Array.prototype.slice;

    kernel.extend(fn, {
        /**
         *  Creates a function that is associated with a specified object, and that can have specific initial parameters.
         */
        bind : fn.bind || function(o){
            if (!kernel.isFunction(this)) { throw TypeError("Bind must be called on a function"); }
            var slice = [].slice,
                args = slice.call(arguments, 1),
                self = this,
                bound = function () {
                    return self.apply(this instanceof nop ? this : (o || {}),
                        args.concat(slice.call(arguments)));
                };
            /** @constructor */
            function nop() {}
            nop.prototype = self.prototype;
            bound.prototype = new nop();
            return bound;
        }
    });
});