/****************************************************************************
 Copyright (c) 2014 chenchangwen
 http://www.ve.cn
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
 * Created by chenchangwen on 2014/10/24
 */

$.add(["ve/core/kernel"], function(kernel) {

    var userAgent = navigator.userAgent.toLowerCase();

    var util = {
        browser: { 
            fnrsion: (userAgent.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [])[1],
            safari: /webkit/.test(userAgent),
            opera: /opera/.test(userAgent),
            msie: /msie/.test(userAgent) && !/opera/.test(userAgent),
            mozilla: /mozilla/.test(userAgent) && !/(compatible|webkit)/.test(userAgent)
        }
    }
    var styleFloat = util.browser.msie ? "styleFloat" : "cssFloat";
    var defaultView = document.defaultView || {};

    util.props = {
        "for": "htmlFor",
        "class": "className",
        "float": styleFloat,
        cssFloat: styleFloat,
        styleFloat: styleFloat,
        readonly: "readOnly",
        maxlength: "maxLength",
        cellspacing: "cellSpacing"
    }

    //循环
    function each(object, callback, args) {
        var name, i = 0, length = object.length;
        if (args) {
            if (length == undefined) {
                for (name in object)
                    if (callback.apply(object[name], args) === false)
                        break;
            } else
                for (; i < length;)
                    if (callback.apply(object[i++], args) === false)
                        break;
            // A special, fast, case for the most common use of each
        } else {
            if (length == undefined) {
                for (name in object)
                    if (callback.call(object[name], name, object[name]) === false)
                        break;
            } else
                for (var value = object[0];
                    i < length && callback.call(value, i, value) !== false; value = object[++i]) {
                }
        }
        return object;
    }

    //属性
    function attr(elem, name, value) {
        // don't set attributes on text and comment nodes
        if (!elem || elem.nodeType == 3 || elem.nodeType == 8)
            return undefined;

        var notxml = !kernel.isXMLDoc(elem),
            // Whether we are setting (or getting)
            set = value !== undefined,
            msie = util.browser.msie;

        // Try to normalize/fix the name
        name = notxml && util.props[name] || name;
        // Only do all the following if this is a node (faster for style)
        // IE elem.getAttribute passes even for style
        if (elem.tagName) {

            // These attributes require special treatment
            var special = /href|src|style/.test(name);

            // Safari mis-reports the default selected property of a hidden option
            // Accessing the parent's selectedIndex property fixes it
            if (name == "selected" && util.browser.safari)
                elem.parentNode.selectedIndex;

            // If applicable, access the attribute via the DOM 0 way
            if (name in elem && notxml && !special) {
                if (set) {
                    // We can't allow the type property to be changed (since it causes problems in IE)
                    if (name == "type" && kernel.nodeName(elem, "input") && elem.parentNode)
                        throw "type property can't be changed";

                    elem[name] = value;
                }
                // browsers index elements by id/name on forms, give priority to attributes.
                if (kernel.nodeName(elem, "form") && elem.getAttributeNode(name))
                    return elem.getAttributeNode(name).nodeValue;

                return elem[name];
            }

            if (msie && notxml && name == "style")
                return attribute.attr(elem.style, "cssText", value);

            if (set) {
                // convert the value to a string (all browsers do this but IE) see #1070
                elem.setAttribute(name, "" + value);
            }
            var tattr = msie && notxml && special
                // Some attributes require a special call on IE
                ? elem.getAttribute(name, 2)
                : elem.getAttribute(name);
            // Non-existent attributes return null, we normalize to undefined
            return tattr === null ? undefined : tattr;
        }

        // elem is actually elem.style ... set the style

        // IE uses filters for opacity
        if (msie && name == "opacity") {
            if (set) {
                // IE has trouble with opacity if it does not have layout
                // Force it by setting the zoom level
                elem.zoom = 1;

                // Set the alpha filter to set the opacity
                elem.filter = (elem.filter || "").replace(/alpha\([^)]*\)/, "") +
                (parseInt(value) + '' == "NaN" ? "" : "alpha(opacity=" + value * 100 + ")");
            }

            return elem.filter && elem.filter.indexOf("opacity=") >= 0 ?
                (parseFloat(elem.filter.match(/opacity=([^)]*)/)[1]) / 100) + '' :
                "";
        }

        name = name.replace(/-([a-z])/ig, function (all, letter) {
            return letter.toUpperCase();
        });
        if (set)
            elem[name] = value;
        return elem[name];
    };

    function curCSS(elem, name, force) {
        var ret, style = elem.style;

        // A helper method for determining if an element's values are broken
        function color(elem) {
            if (!util.browser.safari)
                return false;

            // defaultView is cached
            var ret = defaultView.getComputedStyle(elem, null);
            return !ret || ret.getPropertyValue("color") == "";
        }

        // We need to handle opacity special in IE
        if (name == "opacity" && util.browser.msie) {
            ret = attr(style, "opacity");

            return ret == "" ?
                "1" :
                ret;
        }
        // Opera sometimes will give the wrong display answer, this fixes it, see #2037
        if (util.browser.opera && name == "display") {
            var save = style.outline;
            style.outline = "0 solid black";
            style.outline = save;
        }

        // Make sure we're using the right name for getting the float value
        if (name.match(/float/i))
            name = styleFloat;

        if (!force && style && style[name])
            ret = style[name];

        else if (defaultView.getComputedStyle) {

            // Only "float" is needed here
            if (name.match(/float/i))
                name = "float";

            name = name.replace(/([A-Z])/g, "-$1").toLowerCase();

            var computedStyle = defaultView.getComputedStyle(elem, null);

            if (computedStyle && !color(elem))
                ret = computedStyle.getPropertyValue(name);
            // If the element isn't reporting its values properly in Safari
            // then some display: none elements are involved
            else {
                var swap = [], stack = [], a = elem, i = 0;

                // Locate all of the parent display: none elements
                for (; a && color(a); a = a.parentNode)
                    stack.unshift(a);

                // Go through and make them visible, but in reverse
                // (It would be better if we knew the exact display type that they had)
                for (; i < stack.length; i++)
                    if (color(stack[i])) {
                        swap[i] = stack[i].style.display;
                        stack[i].style.display = "block";
                    }

                // Since we flip the display style, we have to handle that
                // one special, otherwise get the value
                ret = name == "display" && swap[stack.length - 1] != null ?
                    "none" :
                    (computedStyle && computedStyle.getPropertyValue(name)) || "";

                // Finally, revert the display styles back
                for (i = 0; i < swap.length; i++)
                    if (swap[i] != null)
                        stack[i].style.display = swap[i];
            }

            // We should always get a number back from opacity
            if (name == "opacity" && ret == "")
                ret = "1";

        } else if (elem.currentStyle) {
            var camelCase = name.replace(/\-(\w)/g, function(all, letter) {
                return letter.toUpperCase();
            });

            ret = elem.currentStyle[name] || elem.currentStyle[camelCase];

            // From the awesome hack by Dean Edwards
            // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

            // If we're not dealing with a regular pixel number
            // but a number that has a weird ending, we need to convert it to pixels
            if (!/^\d+(px)?$/i.test(ret) && /^\d/.test(ret)) {
                // Remember the original values
                var left = style.left, rsLeft = elem.runtimeStyle.left;

                // Put in the new values to get a computed value out
                elem.runtimeStyle.left = elem.currentStyle.left;
                style.left = ret || 0;
                ret = style.pixelLeft + "px";

                // Revert the changed values
                style.left = left;
                elem.runtimeStyle.left = rsLeft;
            }
        }
        return ret;
    }

    //内部方法
    var tempFnObj = {
        attr: attr,
        each: each,
        curCSS: curCSS
    }

    var privateObj = {
        each: function (callback, args) {
            return each(this, callback, args);
        },
        attr: function (obj, name, value, type) {
            obj = obj || document;
            if (obj.nodeType) {
                this[0] = obj;
                this.length = 1;
            }
            var options = name;
            // Look for the case where we're accessing a style value
            if (name.constructor == String) {
                if (value === undefined) {
                    return this[0] && tempFnObj[type || "attr"](this[0], name);
                } else {
                    //如果传入了要设置的值,则设置key, value
                    options = {};
                    options[name] = value;
                }
            }
            // Check to see if we're setting style values
            return this.each(function (i) {
                // Set all the styles
                for (name in options)
                    attr(
                        type ?
                            this.style :
                            this,
                        name, kernel.prop(this, options[name], type, i, name)
                    );
            });
        }
    };
    var attribute = {
        attr: function (obj, name, value, type) {
            return privateObj.attr(obj, name, value, type);
        },
        removeAttr: function(obj,name) {
            obj.removeAttribute(name);
        }
    }
    return attribute;
});