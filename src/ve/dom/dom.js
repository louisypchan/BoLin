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
 * Created by Louis Y P Chen on 2014/11/13.
 */
$.add(["ve/core/kernel", "ve/dom/selector/q", "ve/dom/attr", "ve/extensions/array"], function (kernel, query, domAttr) {
    // ============================
    // DOM Functions
    // =============================
    if($.browser.ie < 7){
        try{
            //IE6: Background-Image Load Event
            //Clear image cache
            document.execCommand("BackgroundImageCache", false, true);
        }catch (e){}
    }

    var DOM = $.noop,
        tagMap = {
            area: [1, "<map>", "</map>"],
            col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
            legend: [1, "<fieldset>", "</fieldset>"],
            option: [1, "<select multiple='multiple'>", "</select>"],
            td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
            thead: [1, "<table>", "</table>"],
            tr: [2, "<table><tbody>", "</tbody></table>"],
            _default: [0, "", ""]
        },
        tagReg = /<\s*([\w\:]+)/i,
        gcs = 'getComputedStyle' in $.global;
    tagMap.optgroup = tagMap.option;
    tagMap.tbody = tagMap.tfoot = tagMap.colgroup = tagMap.caption = tagMap.thead;
    tagMap.th = tagMap.td;
    /**
     * instantiates an HTML fragment returning the corresponding DOM.
     * @param frag
     * @param doc
     */
    function createElements(frag, doc){
        doc = doc || $.doc;
        //make sure frag is a string
        frag += "";
        var match, depth, tag, wrap, div = doc.createElement("div"), df, fc;
        match = frag.match(tagReg);
        tag = match ? match[1].toLowerCase() : "";
        wrap = tagMap[tag]||tagMap["_default"];
        depth = wrap[0];

        if(match && wrap){
            div.innerHTML = wrap[1] + frag + wrap[2];
            while(depth--){
                div = div.firstChild;
            }
        }else{
            div.innerHTML = frag;
        }
        //return the node itself if noe node
        if(div.childNodes.length == 1){
            console.log(div);
            return div.removeChild(div.firstChild);
        }
        //return multiple nodes as a documetn fragment
        df = doc.createDocumentFragment();
        while((fc = div.firstChild)){
            df.appendChild(fc);
        }
        return df;
    }

    function _insertBefore(node, refNode){
        var parent = refNode.parentNode;
        if(parent){
            parent.insertBefore(node, refNode);
        }
    }

    function _insertAfter(node, refNode){
        var parent = refNode.parentNode;
        if(parent){
            if(parent.lastChild == refNode){
                parent.appendChild(node);
            }else{
                parent.insertBefore(node, refNode.nextSibling);
            }
        }
    }

    function _empty(node){
        for(var c; c = node.lastChild;){
            node.removeChild(c);
        }
    }


    function _destory(node, parent){
        // in IE quirks, node.canHaveChildren can be false but firstChild can be non-null (OBJECT/APPLET)
        if(node.firstChild){
            _empty(node);
        }
        if(parent){
            // removeNode(false) doesn't leak in IE 6+, but removeChild() and removeNode(true) are known to leak under IE 8- while 9+ is TBD.
            // In IE quirks mode, PARAM nodes as children of OBJECT/APPLET nodes have a removeNode method that does nothing and
            // the parent node has canHaveChildren=false even though removeChild correctly removes the PARAM children.
            // In IE, SVG/strict nodes don't have a removeNode method nor a canHaveChildren boolean.
            $.browser.ie && parent.canHaveChildren && "removeNode" in node ? node.removeNode(false) : parent.removeChild(node);
        }
    }

    function domInjection(args, position){
        if(this.size() <= 0) return;
        args = Array.prototype.concat.apply([], args);
        var i = 0, item;
        this.each(function(elem){
            i = 0;
            for(; item = args[i]; i++){
                if(kernel.isString(item)){
                   item = createElements(item, elem.ownerDocument);
                }
                switch (position){
                    case "before" :
                        _insertBefore(item, elem);
                        break;
                    case "after" :
                        _insertAfter(item, elem);
                        break;
                    case "replace" :
                        elem.parentNode.replaceChild(item, elem);
                        break;
                    case "first" :
                        if(elem.firstChild){
                            _insertBefore(item, elem.firstChild);
                        }
                        break;
                    default :
                        elem.appendChild(item);
                        break;
                }
            }
        });
        return this;
    }

    var _contains = $.doc.compareDocumentPosition ?
        function (container, contained) {
            return !!(container.compareDocumentPosition(contained) & 16);
        } : function (container, contained) {
        if (container === contained) {
            return false;
        }
        if (container.contains && contained.contains) {
            return container.contains(contained);
        } else {
            while (contained = contained.parentNode) {
                if (contained === container) {
                    return true;
                }
            }
            return false;
        }
    };

    kernel.extend(DOM.prototype, {

        size : function(){
          return this.elems.length;
        },

        each : function(cb){
            this.elems.forEach(kernel.ride(this, cb));
            return this;
        },
        html : function(){
            var arity = arguments.length;
            if(arity == 0){
                //get
                return this.elems[0].innerHTML;
            }else{
                //set
                this.each(function(elem, index){
                   elem.innerHTML = arguments[0];
                });
            }
            return this;
        },
        /**
         * Get or set the value of form controls. When no value is given, return the value of the first element.
         * For <select multiple>, an array of values is returend. When a value is given, set all elements to this value.
         * @param value
         */
        val : function(value){
            return value ? this.each(function(elem){
               elem.value = value;
            }) : (this.elems[0] && (this.elems[0].multiple ? query.qsa("option:selected", this.elems[0]).map(function(elem){
                return elem.value;
            }) : this.elems[0].value));
        },
        /**
         *
         * @param selector
         */
        find : function(selector){
            var result = [];
            this.elems.forEach(function(context){
                result = result.concat(query.qsa(selector, context));
            });
            this.elems = result;
            result = null;
            return this;
        },
        append : function(){
            return domInjection.apply(this, [arguments]);
        },
        prepend : function(){
            return domInjection.apply(this, [arguments, "first"]);
        },
        before : function(){
            return domInjection.apply(this, [arguments, "before"]);
        },
        after : function(){
            return domInjection.apply(this, [arguments, "after"]);
        },
        replace : function(){
            return domInjection.apply(this, [arguments, "replace"]);
        },
        /**
         * using removeChild() is actually faster than setting node.innerHTML
         * see http://jsperf.com/clear-dom-node.
         * @returns {*}
         */
        empty : function(){
            return this.each(function(elem){
                _empty(elem);
            });
        },
        remove : function(expr){
            var elems = expr ? this.filter(expr) : this.elems, elem;
            for(var i = 0; elem = elems[i]; i++){
                _destory(elem, elem.parentNode);
            }
        },
        filter : function(expr){
            var elem = this.elems[0], l = this.size();
            if(l === 1 && elem.nodeType){
                return query.qsa.matchesSelector(elem, expr)||[];
            }else{
                return query.qsa.matches(expr, this.elems.map(function(elem){
                    return elem.nodeType === 1;
                }));
            }
        },
        offset : function(){
            var pos = {x : 0, y : 0}, elem = this.elems[0], doc = elem && elem.ownerDocument, docElem;
            if(!doc) return pos;
            docElem = doc.documentElement;
            // Make sure it's not a disconnected DOM node
            if(!_contains(docElem, elem)){
                return pos;
            }
            // If we don't have gBCR, just use 0,0 rather than error
            // BlackBerry 5, iOS 3 (original iPhone)
            if ( typeof elem.getBoundingClientRect !== "undefined") {
                pos = elem.getBoundingClientRect();
            }
            return {
                y : pos.y + ($.global.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
                x : pos.x + ($.global.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
            };
        },
        style : function(){

        },
        position : function(){

        },
        width : function(){

        },
        height : function(){

        }
    });

    DOM.prototype.query = DOM.prototype.find;
    /**
     * @examples
     *      dom("#ID")
     *      dom(".class")
     *      fn ...
     * @param selector
     * @param context
     */
    function dom(selector, context){
        return (function(obj){
            //the results
            if(kernel.isString(selector)){
                obj.elems = query.qsa(selector, context);
            }
            else if(selector && selector.nodeType){
                obj.elems = [selector];
            }
            else if(kernel.isArray(selector)){
                obj.elems = selector;
            }else{
                obj.elems = [];
            }
            return obj;
        })(new DOM());
    }
    return dom;
});