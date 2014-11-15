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
$.add(["ve/core/kernel", "ve/dom/selector/q", "ve/extensions/array"], function (kernel, query) {
    // =============================
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
        var doc = doc || $.global.document;
        //make sure frag is a string
        frag += "";
        var match, depth, tag, wrap, div = doc.createElement("div"), df, fc;
        match = frag.match(tagReg);
        tag = match ? match[1].toLowerCase() : "_default";
        wrap = tagMap[tag];
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

    function domInjection(){

    }

    kernel.extend(DOM.prototype, {
        /**
         *
         * @param selector
         */
        find : function(selector){
            var result = [];
            this.elems.forEach(function(context){
                result = result.concat(query.Q(selector, context));
            });
            this.elems = result;
            result = null;
            return this;
        },
        append : function(){

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
            obj.elems = query.Q(selector, context);
            return obj;
        })(new DOM());
    }

    return dom;
});
