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
$.add(["bl/core/kernel", "bl/dom/selector/q", "bl/dom/attr",
    "bl/dom/style"], function (kernel, query, domAttr, domStyle) {
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
        pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source,
        rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" ),
        rclass = /[\t\r\n\f]/g,
        tagReg = /<\s*([\w\:]+)/i;
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


    function getWidthOrHeight(elem, prop, value){
        if(elem === $.global){
            return elem.document.documentElement["client" + prop];
        }
        if(elem.nodeType === 9){
            var doc = elem.documentElement;
            return Math.max(elem.body["scroll" + prop], doc["scroll" + prop],
                            elem.body["offset" + prop], doc["scroll" + prop],
                            doc["client" + name]);
        }
        return value === undefined ?
            // Get width or height on the element, requesting but not forcing parseFloat
            domStyle.get(elem, prop, "content") : domStyle.style(elem, prop, value, "content");
    }

    /**
     *
     * @param cls
     * @param action - "add" or "remove"
     */
    function addOrRemoveClass(cls, action){
        if(kernel.isString(cls)){
            var classes = (cls||"").match(/\S+/g)||[], i = 0, c, cur;
            this.each(function(elem){
                cur = elem.nodeType == 1 && (elem.className ? (" " + elem.className + " ").replace(rclass," "): " ");
                if(cur){
                    i = 0;
                    while(( c = classes[i++] )){
                        if(action === "add"){
                            if(cur.indexOf(" " + c + " ") < 0){
                                cur += c + " ";
                            }
                        }
                        if(action === "remove"){
                            if(cur.indexOf(" " + c + " ") > -1){
                                cur = cur.replace( " " + c + " ", " " );
                            }
                        }
                    }
                    cur = kernel.trim(cur);

                    if(elem.className !== cur){
                        console.log(elem);
                        elem.className = cur;
                    }
                }
            });
        }
    }

    kernel.extend(DOM.prototype, {

        size : function(){
          return this.elems.length;
        },

        each : function(cb){
            this.elems.forEach(kernel.ride(this, cb));
            return this;
        },
        html : function(html){
            if(typeof html === "undefined"){
                //get
                return this.elems[0].innerHTML;
            }else{
                //set
                this.each(function(elem){
                    elem.innerHTML = html
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
            var hooks, elem = this.elems[0],ret;
            if(!value){
                if ( elem ) {
                    hooks = domAttr.valHooks[ elem.type ] || domAttr.valHooks[ elem.nodeName.toLowerCase() ];
                    if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
                        return ret;
                    }
                    ret = elem.value;
                    return typeof ret === "string" ? ret.replace(/\r/g, "") : ret == null ? "" : ret;
                }
            }
            return this.each(function(n){
                var val;
                if(n.nodeType !== 1){
                    return;
                }
                val = value;
                // Treat null/undefined as ""; convert numbers to string
                if(val == null){
                    val = "";
                }else if(kernel.isNumber(val)){
                    val += "";
                }else if(kernel.isArray(val)){
                    val = val.map(function(v){
                        return v == null ? "" : v + "";
                    });
                }
                hooks = domAttr.valHooks[ n.type ] || domAttr.valHooks[ n.nodeName.toLowerCase() ];
                // If set returns undefined, fall back to normal setting
                if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ){
                    n.value = val;
                }
            });
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
            var pos = {top : 0, left : 0}, elem = this.elems[0], doc = elem && elem.ownerDocument, docElem;
            if(!doc) return pos;
            docElem = doc.documentElement;
            // Make sure it's not a disconnected DOM node
            if(!kernel.contains(docElem, elem)){
                return pos;
            }
            // If we don't have gBCR, just use 0,0 rather than error
            // BlackBerry 5, iOS 3 (original iPhone)
            if ( typeof elem.getBoundingClientRect !== "undefined") {
                pos = elem.getBoundingClientRect();
            }
            return {
                top : pos.top + ($.global.pageYOffset || docElem.scrollTop) - (docElem.clientTop || 0),
                left : pos.left + ($.global.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || 0)
            };
        },
        attr : function(name, value){
            return this.each(function(elem){
               domAttr.attr(elem, name, value);
            });
        },
        removeAttr : function(name){
            return this.each(function(elem){
                domAttr.removeAttr(elem, name);
            });
        },
        style : function(name, value){
            var arity = arguments.length;
            if(arity == 2){
                return this.each(function(elem){
                    domStyle.style(elem, name, value);
                });
            }
            if(arity == 1){
                if(kernel.type(name) == "object"){
                    for(var i in name){
                            (function(context, p, obj){
                            context.each(function(elem){
                                domStyle.style(elem, p, obj[p]);
                            });
                        })(this, i, name);
                    }
                    return this;
                }
                if(kernel.isString(name)){
                    if(name == "top" || name == "left"){
                        var that = this;
                        var t = domStyle.addGetHookIf($.support.pixelPosition, function( elem, computed ) {
                            if ( computed ) {
                                computed = domStyle.curCSS( elem, name );
                                // if curCSS returns percentage, fallback to offset
                                return rnumnonpx.test( computed ) ? that.position()[name] + "px" : computed;
                            }
                        });
                        return domStyle.css(t, this.elems[0], name);
                    }
                    return domStyle.get(this.elems[0], name);
                }
            }
        },
        position : function(){
            var l = this.size();
            if(l){
                var offsetParent, offset,parentOffset = { top: 0, left: 0 },elem = this.elems[0];
                // fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
                if(domStyle.get(elem, "position") === "fixed"){
                    offset = elem.getBoundingClientRect();
                }else{
                    // Get *real* offsetParent
                    offsetParent = this.elems.map(function(_elem){
                        var _offsetParent = _elem.offsetParent || $.doc.documentElement;
                        while ( _offsetParent && ( !kernel.nodeName( _offsetParent, "html" ) && domStyle.get( _offsetParent, "position" ) === "static" ) ) {
                            _offsetParent = _offsetParent.offsetParent;
                        }
                        return _offsetParent || $.doc.documentElement;
                    });
                    // Get correct offsets
                    offset = this.offset();
                    if ( !kernel.nodeName(offsetParent[0], "html" ) ) {
                        parentOffset = dom(offsetParent[0]).offset();
                    }
                    parentOffset.top  += domStyle.get( offsetParent[ 0 ], "borderTopWidth", true );
                    parentOffset.left += domStyle.get( offsetParent[ 0 ], "borderLeftWidth", true );
                    return {
                        top:  offset.top  - parentOffset.top - domStyle.get( elem, "marginTop", true ),
                        left: offset.left - parentOffset.left - domStyle.get( elem, "marginLeft", true)
                    }
                }
            }
            return {
                top : 0,
                left : 0
            }
        },
        width : function(w){
            return getWidthOrHeight(this.elems[0],"Width", w);
        },
        height : function(h){
            return getWidthOrHeight(this.elems[0],"Height", h);
        },
        addClass : function(cls){
            addOrRemoveClass.call(this, cls, "add");
            return this;
        },
        removeClass : function(cls){
            addOrRemoveClass.call(this, cls, "remove");
            return this;
        },
        hasClass : function(clsName){
            var className =  " " + clsName + " ", i = 0, l = this.size(), elem;
            for(; i < l; ){
                elem = this.elems[i++];
                if(elem.nodeType === 1 && (" " + elem.className + " ").replace(rclass, " ").indexOf(className) > -1){
                    return true;
                }
            }
            return false;
        },
        wrap : function(html){
            var wrap = dom(html);
            wrap.append(kernel.clone(this.elems[0]));
            this.replace(wrap.elems[0]);
            return wrap;
        },
        exist : function(){
            return !!this.elems.length;
        },
        toString : function(){
            return "[object $DOM]";
        },
        parent : function(){
            var elem = this.elems[0],
                parent = elem.parentNode;
            return parent && parent.nodeType !== 11 ? parent : null;
        }
    });
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
                if(selector.charAt(0) === '<' && selector.charAt(selector.length - 1) === '>' && selector.length >= 3){
                    var doc = context ? context.ownerDocument : $.doc;
                    obj.elems = [createElements(selector, doc)];
                }else{
                    obj.elems = query.qsa(selector, context);
                }
            }
            else if(selector && selector.nodeType){
                obj.elems = [selector];
            }
            else if(kernel.isArray(selector)){
                obj.elems = selector;
            }else if(kernel.isArrayLike(Object(selector))) {
                obj.elems = kernel.makeArray(selector);
            }else{
                obj.elems = [];
            }
            return obj;
        })(new DOM());
    }
    dom.$DOM = DOM;
    return dom;
});