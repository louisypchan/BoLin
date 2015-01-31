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

$.add("bl/semantic/base",["bl/core/kernel", "bl/core/declare", "bl/core/base", "bl/dom/dom", "bl/core/aspect",
    "bl/semantic/directive",
    "bl/core/when",
    "bl/extensions/fn"], function(kernel, declare, base, dom, aspect, directive, when){

    return declare({
        "~name" : "$.directive.base",
        "~superclass" : base,
        "+DIRECTIVEDEF" : "yp-def",

        ctor : function(args){
            this._super(args);
            aspect.before(this, "bootStrap", this.beforeBootStrap);
            aspect.after(this, "bootStrap", this.afterBootStrap);
            //aspect the methods which related to the DOM operations
            var self = this,
                collect = function(candicate){
                    //directive.collect.call(self, this, candicate);
                };
            aspect.after(dom.$DOM.prototype, "html", collect);
            aspect.after(dom.$DOM.prototype, "append", collect);
            aspect.after(dom.$DOM.prototype, "prepend", collect);
            aspect.after(dom.$DOM.prototype, "before", collect);
            aspect.after(dom.$DOM.prototype, "after", collect);
            aspect.after(dom.$DOM.prototype, "replace", collect);
            aspect.after(dom.$DOM.prototype, "empty", collect);
            aspect.after(dom.$DOM.prototype, "remove", collect);

            this.bootStrap();
        },

        bootStrap : function(){
            var doc = $.doc, def;
            def = dom('[' + $.directive.base.DIRECTIVEDEF + ']', doc);
            if(!def.exist()){
                throw new Error("Can not find yp-def is defined!");
            }
            this.compile(def);
        },

        compile : function(it){
            var rootElement = it.elems[0], childNodes = rootElement.childNodes;
            childNodes && this._compile(childNodes, rootElement);
        },

        _compile : function(nodeList, parent){
            var node, i = 0, l = nodeList.length, childNodes,directives;
            for(; i < l; ){
                node = nodeList[i++];
                directives = directive.collect.call(this, dom(node), true);
                this.applyDirectivesToNode(directives, node);
                childNodes = node.childNodes;
                childNodes && this._compile(childNodes, node);
            }
        },
        applyDirectivesToNode : function(directives, node){
            var controller = this.getController(node), renderId = "", renderTemplate = null;
            directives.forEach(kernel.ride(this,function(it){
                switch (it.identify){
                    case directive.IDENTIFY.ypController :
                        kernel.isFunction(it.compile) && it.compile.apply(this, [node, it.prop, controller.context]);
                        break;
                    case directive.IDENTIFY.ypModel :
                        if(kernel.isFunction(it.compile)){
                            when(renderTemplate,  it.prop).then(kernel.ride(this, function(results){
                                it.compile.apply(this, [node, it.prop, controller, results[0]])
                            }));
                        }
                        kernel.isFunction(it.compile) && it.compile.apply(this, [node, it.prop, controller]);
                        break;
                    case directive.IDENTIFY.ypTemplate :
                        kernel.isFunction(it.compile) && (renderTemplate = it.compile.apply(this, [node, it.prop, renderId]));
                        break;
                    case directive.IDENTIFY.ypRender :
                        kernel.isFunction(it.compile) && (renderId = it.compile(it.prop));
                        break;
                }

            }));
        },
        getController : function(node){
            var parent = dom(node).parent(), prop = "";
            while(parent){
                if(dom(parent).hasClass(directive.IDENTIFY.ypController)){
                    prop = parent.$prop;
                    break;
                }
                parent = dom(parent).parent();
            }
            return {
                context : this[prop]||this,
                namespace : prop
            }
        },

        beforeBootStrap : $.noop,
        afterBootStrap : $.noop
    });
});