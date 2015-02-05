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
$.add("bl/core/base", ["./declare", "./kernel"], function(declare, kernel){
    var PROPREGEX =  /[^\[\]]+/g ;

    return declare({
        "~name" : "$.core.base",
        /**
         * constructor
         *
         */
        ctor : function(){
            this.__$$__watchers__$$__ = [];
            this.$dirtyChecking = true; //turn on the dirty checking
        },
        /**
         *
         * @param expr
         * @param value
         * @param ctx
         * @returns {*}
         * @private
         */
        _helper : function(expr, value, ctx){
            var parts = expr.split("."), len = parts.length, last = parts[len - 1], oldVal = null, p, i = 0, rs = ctx, j = 0, l;
            while(rs && (p = parts[i++]) && i < len){
                j = 0;
                p = p.match(PROPREGEX);
                for(l = p.length; j < l; j++){
                    rs = rs[p[j]];
                }
            }
            if(rs === undefined) return $.noop;
            last = last.match(PROPREGEX);
            l = last.length;
            j = 0;
            for(; j < l - 1; j++){
                rs = rs[last[j]];
            }
            if(j=== (l -1)){
                oldVal = rs[last[j]];
                value !== undefined && (rs[last[j]] = value);
            }
            return oldVal;
        },
        /**
         *
         * @param expr
         * @param context
         * @returns {*}
         */
        get : function(expr, context){
            return this._helper(expr, undefined, context);
        },
        /**
         *
         * @param expr
         * @param value
         * @param context
         */
        set : function(expr, value, context){
            this._helper(expr, value, context);
            this.digest();
        },
        /**
         *
         * @param expr
         * @param listener
         * @param ctx
         */
        watch : function(expr, listener, ctx){
            if(this.$dirtyChecking){
                this.__$$__watchers__$$__.push({
                    expr : expr,
                    $new : this.get,
                    $old : $.noop,
                    listener : listener || $.noop,
                    ctx : ctx
                });
            }
        },
        /**
         *dirty check
         */
        digest : function(){
            if(!this.$dirtyChecking) return;
            var watch, len = this.__$$__watchers__$$__.length, ctx, newVal, dirty,j;
            j = len-1;
            do{
                dirty = false;
                for(;j>=0;j--){
                    watch = this.__$$__watchers__$$__[j];
                    if(watch){
                        ctx = watch.ctx;
                        if((newVal = watch.$new.call(this, watch.expr, ctx)) != watch.$old){
                            dirty = true;
                            watch.listener.apply(this, [newVal]);
                            watch.$old = newVal;
                        }else{
                            if(newVal === $.noop){
                                //the last time to publish the listener
                                watch.listener.apply(this, [newVal]);
                                //remove watch
                                this.__$$__watchers__$$__.splice(j,1);
                            }
                        }
                    }
                }
            }while(dirty);
        }
    });
});