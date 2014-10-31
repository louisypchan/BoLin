/****************************************************************************
 Copyright (c) 2014.

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
/**
 * joinpoint — a point in the control flow.
 *      Examples:
 *          calling a method,
 *          executing a method’s body or an exception handler,
 *          referencing an object’s attribute, and so on.
 *
 * pointcut — a query that is used to define a set of affected joinpoints. Essentially this is a logical expression that can pick out joinpoints and make sure that their context is right.
 *      Examples: it can verify that the affected object is of right type, that we are in particular control flow branch, and so on.
 *
 * advice — an additional behavior (a code) that will be applied at joinpoints.
 *      Available advice types:
 *          "before"            — runs before a joinpoint,
 *          "after"             — runs after a joinpoint was executed,
 *          "after returning"   — runs only after a normal execution of a joinpoint,
 *          "after throwing"    — runs only if during execution of a joinpoint an unhandled exception was thrown.
 *          "around"            — runs instead of a joinpoint, may call the original joinpoint.
 *
 * aspect — an entity that encapsulates related pointcuts, and advices together, and can add some attributes to advised classes.
 * refer to http://www.lazutkin.com/blog/2008/05/17/aop-aspect-javascript-dojo/
 */
$.add(["public"], function(expose){
    "use strict";

    function advise(inst, method){
        this.next_before = this.prev_before =
            this.next_after = this.prev_after = this.next_around = this.prev_around = this;
        this.inst = inst;
        this.method = method;
    }

    function __around(f, a){
        return f(a);
    }

    advise.prototype = {
        add : function(before, after, around, target){
            var advice = new advise(this.inst, this.method);
            advice.advise = this;
            advice.before = before;
            advice.after = after;
            advice.around = around;
            advice.target = target;

            this._add("before", advice);
            this._add("around", advice);
            this._add("after", advice);

            if(around){
                advice.target = __around(around, advice.prev_around.target);
            }
            return advice;
        },

        _add : function(type, advice){
            if(advice[type]){
                var next = "next_" + type, prev = "prev_" + type;
                //create chain
                (advice[prev] = this[prev])[next] = (advice[next] = this)[prev] = advice;
            }
        },

        remove : function(advice){
            this._remove("before", advice);
            this._remove("around", advice);
            this._remove("after" , advice);
        },

        _remove : function(type, advice){
            var next = "next_" + type, prev = "prev_" + type;
            advice[next][prev] = advice[prev];
            advice[prev][next] = advice[next];
        },

        destory : function(){
            var target = this.prev_around.target, advise = this.advise, na = this.next_around;
            this.remove(this);
            if(na !== this){
                for(; na !== advise; target = na.target, na = na.next_around){
                    if(advise.around){
                        advise.target = __around(advise.around, target);
                    }
                }
            }
            this.inst = 0;
        }
    };

    function AOPmaker(advised){
        var f =  function(){
            var process;
            //running before chain
            for(process = advised.prev_before; process !== advised; process = process.prev_before){
                process.before.apply(this, arguments);
            }
            //running the around chain
            try{
                if(advised.prev_around !== advised){
                    advised.prev_around.target.apply(this, arguments);
                }
            }catch (e){ throw e; }
            //running the after chain
            for(process = advised.prev_after; process !== advised; process = process.prev_after){
                process.after.apply(this, arguments);
            }

            return this;
        };
        f.advised = advised;
        return f;
    }

    function weaver(inst, method, advice){
        var f = inst[method], advised;
        if(f && f.advised){
            advised = f.advised;
        }else{
            advised = new advise(inst, method);
            //construct the advice chians by target
            advised.add(0, 0, 0, f);

            inst[method] = AOPmaker(advised);
        }
        return advised.add(advice.before, advice.after, advice.around, 0);
    }

    expose.before = function(inst, method, advice) { return weaver(inst, method, {before : advice})};
    expose.around = function(inst, method, advice) { return weaver(inst, method, {around : advice})};
    expose.after = function(inst, method, advice) { return weaver(inst, method, {after : advice})};
});