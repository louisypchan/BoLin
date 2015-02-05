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
$.add("bl/semantic/directive", ["bl/core/kernel", "bl/dom/dom", "bl/event/on", "bl/provider/doT", "bl/core/deferred"], function(kernel, dom, on, doT, deferred){

    var DIRECTIVE_SEPARATE =  /([\:\-\_]+(.))/g,

        DIRECTIVE_FACTORY = {
            ypController : {
                priority : 1,
                compile : function(node, prop, context){
                    if(!node.$compiled){
                        prop = "$" + prop;
                        this[prop] = {};
                        this[prop][$.PARENT] = context;
                        node.$prop = prop;
                        dom(node).addClass(directive.IDENTIFY.ypController);
                        node.$compiled = true;
                        return this[prop];
                    }
                    return this;
                }
            },
            ypTemplate  : {
                priority : 3,
                compile : function(node, template, render){
                    if(!render) throw new Error(" Please make sure yp-render is defined and correct!");
                    var $def = new deferred();
                    $.use(["template/" + template], function(tmpl){
                        $def.resolve(tmpl[render]);
                    });
                    dom(node).addClass(directive.IDENTIFY.ypTemplate);
                    return $def.promise;
                }
            },
            ypRender  : {
                priority : 2,
                compile : function(render, ctx){
                    ctx.$scope = kernel.isArray(ctx) ? [] : {};
                    return render;
                }
            },

            ypModel  : {
                priority : 4,
                compile : function(node, prop, ctx, template){
                    if(!node.$compiled){
                        var parts = prop.split("."), tag = node.nodeName.toLowerCase(), expr = prop;
                        if(prop.indexOf("[") == -1){
                            kernel.getProp(parts, true, ctx);
                        }
                        //
                        if(tag === "input" || tag === "textarea" || tag === "select"){
                            //emit event
                            if(kernel.hasEvent("input")){
                                on(node, "input", kernel.ride(this, function(e){
                                    var value = e.target.value;
                                    this.set(expr, value, ctx);
                                }));
                            }else{
                                //<=IE11
                                var origValue = "";
                                on(node, "keydown", kernel.ride(this, function(e){
                                    var key = e.which, target = e.target;
                                    // ignore
                                    // command  modifiers  arrows
                                    if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) return;
                                    setTimeout(kernel.ride(this,function(){
                                        if(target.value !== origValue){
                                            origValue = target.value;
                                            this.set(expr, origValue, ctx);
                                        }
                                    }), 0);
                                }));
                            }
                            // if user paste into input using mouse on older browser
                            // or form autocomplete on newer browser, we need "change" event to catch it
                            on(node, "change", kernel.ride(this, function(e){
                                this.set(expr, e.target.value, ctx);
                            }));
                        }
                        this.watch(expr, function(value){
                            if(tag === "input" || tag === "textarea" || tag === "select"){
                                dom(node).val(value);
                            }else{
                                if(value !== $.noop){
                                    template ? dom(node).html(doT.compile(template, value)(value)) : dom(node).html(value);
                                }else{
                                    dom(node).remove();
                                }
                            }
                        }, ctx);
                        node.$compiled = true;
                        node.$scope = ctx;
                    }
                }
            }
        };
    var directive = {

        IDENTIFY : {
            ypController : 'C',
            ypTemplate   : 'T',
            ypRender     : "R",
            ypModel      : 'M'
        },

        collect : function(node, candicate){
            var results = [];
            if(!(node instanceof dom.$DOM)){
                node = dom(node);
            }
            if(!node.exist()){
                return results;
            }
            node.each(kernel.ride(this, function(elem){
                switch (elem.nodeType){
                    case $.DOM.NODE_TYPE_ELEMENT :
                        //find directives through the attributes
                        var attrs = elem.attributes, i = 0, l = attrs && attrs.length, attr, name, val;
                        for(; i < l; ){
                            attr = attrs[i++];
                            name = attr.name;
                            val = kernel.trim(attr.value);
                            name = name.replace(DIRECTIVE_SEPARATE, function(_, separator, letter, offset){ return offset ? letter.toUpperCase() : letter; });
                            results.push({
                                prop : val,
                                identify : directive.IDENTIFY[name],
                                priority : DIRECTIVE_FACTORY[name] ? DIRECTIVE_FACTORY[name].priority : 100,
                                compile : DIRECTIVE_FACTORY[name] ? DIRECTIVE_FACTORY[name].compile : $.noop
                            });
                        }
                        break;
                    case $.DOM.NODE_TYPE_TEXT :
                        break;
                }
            }));
            //sort the collected directives by priority
            results.sort(function(a1, a2){
                var v1 = a1["priority"], v2 = a2["priority"];
                if(v1 < v2){
                    return -1;
                }else if(v1 > v2){
                    return 1;
                }else{
                    return 0;
                }
            });
            return results;
        }
    };

    return directive;
});