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
$.add(["./kernel", "ve/extensions/object", "ve/extensions/array"], function(kernel){
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
        var t = it._meta._super, seqs = [it];
        if(t){
            if(!kernel.isArray(t)){
                return seqs.concat(t);
            }else{
                while(true){
                    seqs = seqs.concat(t);
                    t = t._meta._super;
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
        var l = bases.length;
        if(l == 1){
            if(!bases[0]._meta._super){
                return bases;
            }else{
                return bases.concat(mro_c3([].concat(bases[0]._meta._super)));
            }
        }else{
            var seqs = [], res = [];
            for(var i = 0; i < l; i++){
                seqs.push(MRO(bases[i]));
            }
            seqs.push(bases);
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
            meta = this._class._meta, p, _super;name
        if(meta._super){
            _super = [].concat(meta._super);
            _super = _super[_super.length - 1];
            p = _super.prototype;
            if(p && p[name] && kernel.isFunction(p[name])){
                p[name].apply(p, arguments);
            }
        }
    }

    var isPrivate = function(it){
            return it.indexOf("-") == 0;
        },

        isStatic = function(it){
            return it.indexOf("+") == 0;
        },
        isNelectful  = function(it){
            return it.indexOf("~") == 0;
        },
        safeMixin = function(target, source, crackPrivate){
            var name, t, p = [];
            for(name in source){
                t = source[name];
                if(kernel.isNotObjectProperty(t, name) && !isNelectful(name)){
                    //crack private
                    if(isPrivate(name)){
                        name = name.substr(1);
                        p.push(name);
                    }
                    if(kernel.isFunction(t)){
                        //assign the name to a function
                        t._name = name;
                    }
                    target[name] = t;
                }
            }
            //crack all the privates
            if(crackPrivate && target._class){
                var __proto__;
                target._class.privates.forEach(function(i){
                    delete  target[i];
                    __proto__ = target.__proto__;
                    while(__proto__ && !__proto__[i]){
                        __proto__ = __proto__.__proto__;
                    }
                    if(__proto__ && __proto__[i]){
                        delete __proto__[i];
                    }
                });
            }
            return p;
        },
        aF = new Function,

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
        /**
         * Create a constructor using a compact notation for inheritance and
         * prototype extension.
         * @param obj
         */
        declare = function(obj){
            var superclass = obj["~superclass"], proto = {}, clsName = obj["~name"], ctor = false, crackPrivate = false, privates = [];
            if(superclass){
                (function(supercls){
                    if(kernel.isFunction(supercls)){
                        //force new
                        aF.prototype = supercls.prototype;
                        proto = new aF;
                        //clean up
                        aF.prototype = null;
                    }else if(kernel.isArray(supercls)){
                        var t = supercls.slice(0);
                        t = mro_c3(t);
                        for(var i = 0, base, l = t.length; i < l; i++){
                            base = t[i];
                            aF.prototype = base.prototype;
                            privates = privates.concat(safeMixin(proto, new aF, false));
                            aF.prototype = null;
                        }
                    }
                    crackPrivate = true;
                })(superclass);
            }
            //clone the properties
            var rPorot = kernel.mixin(true, {}, proto);
            //add all properties
            privates = privates.concat(safeMixin(rPorot, obj, crackPrivate));
            //new constructor
            if(obj.ctor){
                ctor =  rPorot.ctor = obj.ctor;
            }
            var f = (function(ctor){
                return function(){
                    f.executed || processSynthesize(this);
                    if(ctor){
                        ctor.apply(this,arguments);
                    }
                }
            })(ctor);
            f.executed = false;
            //cache meta information
            f._meta = {ctor : obj.ctor, synthesize : obj["~synthesize"], _super : superclass};
            rPorot._super = callSuperImpl;
            //constructor the prototype
            f.prototype = rPorot;
            f.privates = privates;
            //crack static
            crackStatic(f);
            //
            rPorot._class = f;
            //synthesize properties
            __synthesizes.push(f);
            //add name if specified
            if(clsName){
                kernel.set(clsName, f);
                rPorot._class._name = clsName;
            }
            //return
            return f;
        },
        processSynthesize = function(context){
            for(var it, i = 0, l = __synthesizes.length; i < l; i++){
                it = __synthesizes[i];
                it.executed || injectSynthesize(it, context);
            }
            __synthesizes.length = 0;
        },
        injectSynthesize = function (it, context){
            for(var i = 0 , synthesize = it._meta.synthesize, l = synthesize ? synthesize.length : 0; i < l; i++){
                synthesizeProperty(it.prototype, synthesize[i], context);
            }
            it.executed = true;
        },
        synthesizeProperty = function (proto, prop, context){
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
            };
            //to support IE7/IE8
            if($.browser.ie && $.browser.ie < 9){
                kernel.watcher.add(context, prop, mSet);
            }else{
                Object.defineProperty(proto, prop, {
                    get: getter,
                    set: setter
                });
            }
        };

    return declare;
});