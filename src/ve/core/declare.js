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
$.add(["./kernel", "ve/extensions/object"], function(kernel){

    "use strict";


    var __synthesizes  = [];
    /**
     * http://www.python.org/download/releases/2.3/mro/
     * class A(O)
     * class B(O)
     * class C(O)
     *
     * class E(A,B)
     *
     * mro(A) = [A,O]
     * mro(B) = [B,O]
     * mro(E) = [E] + merge(mro(A), mro(B), [A,B])
     * [E] + ([A,O], [B,O], [A,B])
     * [E,A]
     * [A,B]
     */
    function MRO(it){
        var t = it._meta.super, seqs = [it];
        if(t){
            if(!kernel.isArray(t)){
                return seqs.concat(t);
            }else{
                while(true){
                    seqs = seqs.concat(t);
                    t = t._meta.super;
                    if(!t){
                        break;
                    }
                }
                return seqs;
            }
        }
        return seqs;
    }
    /**
     * C3 Method Resolution Order (see http://www.python.org/download/releases/2.3/mro/)
     */
    function mro_c3(bases){
        var l = bases.length,t;
        if(l == 1){
            if(!bases[0]._meta.super){
                return bases;
            }else{
                return bases.concat(mro_c3([].concat(bases[0]._meta.super)));
            }
        }else{
            var seqs = [], res = [];
            for(var i = 0; i < l; i++){
                seqs.push(MRO(bases[i]));
            }
//
            seqs.push(bases);
//
            while(seqs.length){
                res = res.concat(merge(seqs));
            }
            return res;
        }
    }
    /**
     * Merge Impl
     */
    function merge(args){
        if(args){
            var t, l = args.length, top = 0, index, res = [];
            for(var i = 0; i < l; i++){
                t = args[i][0];
                top = 0;
                index = -1;
                //
                for(var j = i+1; j < l; j++){
                    index = args[j].indexOf(t);
                    top += index;
                    //find in the first
                    if(index == 0){
                        args[j].splice(index,1);
                        if(args[j].length == 0){
                            args.splice(j, 1);
                        }
                        //break;
                    }
                    //still can find it, but not in the first
                    //
                    if(index > -1){
                        top += index;
                    }
                }
                //
                if(top == 0 || top == -1){
                    res.push(t);
                    args[i].splice(0,1);
                    if(args[i].length == 0){
                        args.splice(i,1);
                    }
                    break;
                }
            }
            if(!res.length){
                throw new Error("can't build consistent linearization");
            }
            return res;
        }
    }
    /**
     * call parents' method implementation
     */
    function callSuperImpl(){
        var caller = callSuperImpl.caller, name = caller._name,
            meta = this._class._meta, p, _super;
        if(meta.super){
            _super = [].concat(meta.super);
            _super = _super[_super.length - 1];
            p = _super.prototype;
            if(p && p[name] && kernel.isFunction(p[name])){
                p[name].apply(p, arguments);
            }
        }
    }


    var isPrivate = function(it){
            return (it.indexOf("-") == 0 || it.indexOf("_") == 0);
        },

        isStatic = function(it){
            return it.indexOf("+") == 0;
        },
        isNelectful  = function(it){
            return it.indexOf("~") == 0;
        },
        safeMixin = function(target, source){
            var name, t;
            for(name in source){
                t = source[name];
                if(kernel.isNotObjectProperty(t, name) && name != "ctor" && !isNelectful(name)){
                    //crack private
                    if(isPrivate(name)){
                       continue;
                    }
                    if(kernel.isFunction(t)){
                        //assign the name to a function
                        t._name = name;
                    }
                    target[name] = t;
                }
            }
        },
        aF = new Function,

        runCtor = function(superclass, ctor){
            if(kernel.isFunction(superclass)){
                if(superclass._meta){
                    ctor.unshift(superclass._meta.ctor);
                    superclass = superclass._meta.super || null;
                    runCtor(superclass, ctor);
                }
            }else if(kernel.isArray(superclass)){
                var t = superclass.splice(0), base;
                t = mro_c3(t);
                for(var i = 0, base, l = t.length; i < l; i++){
                    base = t[i];
                    if(base._meta){
                        ctor = ctor.concat(base._meta.constructor);
                    }
                }
            }else{
                return;
            }
        },

        crackStatic = function(it){
            var t = it.prototype, name, src;
            for(name in t){
                if(isStatic(name)){
                    src = t[name];
                    name = name.substr(1);
                    it[name] = src;
                    delete t["+" + name];
                }
            }
            t = name = src = null;
        },

        declare = function(obj){
            var superclass = obj["~superclass"], proto = {}, clsName = obj["~name"], ctor = [];
            if(superclass){
                //inheritance
                var _superclass = superclass;

                if(kernel.isFunction(superclass)){
                    //force new
                    aF.prototype = superclass.prototype;
                    proto = new aF;
                    //clean up
                    aF.prototype = null;
                }else if(kernel.isArray(superclass)){
                    var t = superclass.slice(0);
                    t = mro_c3(t);
                    for(var i = 0, base, l = t.length; i < l; i++){
                        base = t[i];
                        aF.prototype = base.prototype;
                        safeMixin(proto, new aF);
                        aF.prototype = null;
                    }
                }
                runCtor(_superclass, ctor);
                _superclass = null;
            }
            //add all properties
            safeMixin(proto, obj);
            //new constructor
            if(obj.ctor){
                ctor = ctor.concat(obj.ctor);
            }
            var f = (function(ctor){
                return function(){
                    f.executed || processSynthesize();
                    if(ctor){
                        for(var i = 0, l = ctor.length; i < l; i++){
                            ctor[i] && ctor[i].apply(this, arguments);
                        }
                    }
                }
            })(ctor);
            f.executed = false;
            //cache meta information
            f._meta = {ctor : obj.ctor, synthesize : obj["~synthesize"], super : superclass};
            //
            proto.callSuper = callSuperImpl;
            //constructor the prototype
            f.prototype = proto;
            //
            //crack static
            crackStatic(f);
            //
            proto._class = f;
            //synthesize properties
            __synthesizes.push(f);
            //add name if specified
            if(clsName){
                proto._class._name = clsName;
            }
            //return
            return f;
        },
        processSynthesize = function(){
            for(var it, i = 0, l = __synthesizes.length; i < l; i++){
                it = __synthesizes[i];
                it.executed || injectSynthesize(it);
            }
            __synthesizes.length = 0;
        },
        injectSynthesize = function (it){
            for(var i = 0 , synthesize = it._meta.synthesize, l = synthesize ? synthesize.length : 0; i < l; i++){
                synthesizeProperty(it.prototype, synthesize[i]);
            }
            it.executed = true;
        },
        synthesizeProperty = function (proto, prop){
            var m = prop.charAt(0).toUpperCase() + prop.substr(1),
                //getter
                mGet = "get" + m,
                //setter
                mSet = "set" + m,
                //real variable in use
                _prop = "_" + prop;
            kernel.objectHasMethod(proto, mSet) || (proto[mSet] = function(value){
                this[_prop] = value;
            });
            //define setter
            var setter = function(value){
                this[mSet](value);
            };
            kernel.objectHasMethod(proto, mGet) || (proto[mGet] = function(){
                return this[_prop];
            });
            //define getter
            var getter = function(){
                return this[mGet]();
            }
            //
            Object.defineProperty(proto, prop, {
               get : getter,
               set : setter
            });
        };

    return declare;
});