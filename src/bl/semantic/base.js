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
                collect = function(){
                    var node = this.elems[0];
                    self._compile(node.childNodes, [], node.$scope||self.$getController(node));
                };
            aspect.after(dom.$DOM.prototype, "html", collect);
            aspect.after(dom.$DOM.prototype, "append", collect);
            aspect.after(dom.$DOM.prototype, "prepend", collect);
            //aspect.after(dom.$DOM.prototype, "before", collect);
            //aspect.after(dom.$DOM.prototype, "after", collect);
            aspect.after(dom.$DOM.prototype, "replace", collect);
            aspect.after(dom.$DOM.prototype, "empty", function(){this.each(function(node){self.$remove(node, false)})});
            aspect.after(dom.$DOM.prototype, "remove", function(){this.each(function(node){self.$remove(node, true)})});
            aspect.after(this, "postCreate", this.digest);
            this.bootStrap();
        },

        bootStrap : function(){
            var doc = $.doc, def;
            def = dom('[' + $.directive.base.DIRECTIVEDEF + ']', doc);
            if(!def.exist()){
                throw new Error("Can not find yp-def is defined!");
            }
            when(this.compile(def)).then(kernel.ride(this, function(){
                this.postCreate();
            }));
        },

        compile : function(it){
            var rootElement = it.elems[0], childNodes = rootElement.childNodes, deferredList = [];
            childNodes && (deferredList = this._compile(childNodes, deferredList));
            return deferredList;
        },

        _compile : function(nodeList, deferredList, scope){
            scope = scope||this;
            var node, i = 0, l = nodeList.length, childNodes,directives, $scope;
            for(; i < l; i++){
                node = nodeList[i];
                node.$index = i;
                directives = directive.collect.call(this, dom(node), true);
                $scope = this.applyDirectivesToNode(directives, node, deferredList, scope);
                childNodes = node.childNodes;
                childNodes && this._compile(childNodes, deferredList, $scope);
            }
            return deferredList;
        },
        applyDirectivesToNode : function(directives, node, deferredList, scope){
            var renderId = "", renderTemplate = null;
            directives.forEach(kernel.ride(this,function(it){
                switch (it.identify){
                    case directive.IDENTIFY.ypController :
                        scope = kernel.isFunction(it.compile) && it.compile.apply(this, [node, it.attr, scope]);
                        break;
                    case directive.IDENTIFY.ypModel :
                        if(kernel.isFunction(it.compile)){
                            deferredList.push(when(renderTemplate).then(kernel.ride(this, function(){
                                it.compile.apply(this, [node, it.attr, scope]);
                            })));
                        }
                        break;
                    case directive.IDENTIFY.ypTemplate :
                        kernel.isFunction(it.compile) && (renderTemplate = it.compile.apply(this, [node, it.attr, renderId]));
                        break;
                    case directive.IDENTIFY.ypRender :
                        kernel.isFunction(it.compile) && (renderId = it.compile(it.attr));
                        break;
                    case directive.IDENTIFY.ypVar :
                        kernel.isFunction(it.compile) && (scope = it.compile.apply(this, [node, it.attr, scope]));
                        break;
                }

            }));
            return scope;
        },
        /**
         *
         * @param node
         * @returns {*}
         */
        $getController : function(node){
            var parent = dom(node).parent();
            while(dom(parent).exist() && !dom(parent).hasClass(directive.IDENTIFY.ypController)){
                parent =  dom(parent).parent();
            }
            var c = dom(parent).attr(directive.DIRETIVES.ypController);
            return c ? this["$" + c] : this;
        },
        /**
         *
         * @param node
         * @param removeItself
         */
        $remove : function(node, removeItself){
            if(removeItself){
                if(node.$$watcher){
                    var index = this.__$$__watchers__$$__.indexOf(node.$$watcher);
                    if(index > -1){
                        try{
                            this.__$$__watchers__$$__.splice(index, 1);
                        }catch (e){}
                    }
                }
            }
            var childNodes = node.childNodes;
            if(childNodes){
                var i = 0, l = childNodes.length,elem;
                for(i = l -1; i >=0; i--){
                    elem = childNodes[i];
                    this.$remove(elem, true);
                }
            }
        },
        postCreate : $.noop,
        beforeBootStrap : $.noop,
        afterBootStrap : $.noop
    });
});