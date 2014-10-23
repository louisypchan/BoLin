/*
     DOM属性方法
     引用: 基于jquery 1.2.6 部分代码 
     及一些修正整理
*/

(function () {

    if (typeof window.ve === "undefined") {
        window.ve = {};
    }

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
 
    util.props= {
        "for": "htmlFor",
        "class": "className",
        "float": styleFloat,
        cssFloat: styleFloat,
        styleFloat: styleFloat,
        readonly: "readOnly",
        maxlength: "maxLength",
        cellspacing: "cellSpacing"
    }
   
    var exclude = /z-?index|font-?weight|opacity|zoom|line-?height/i;

    function isXMLDoc(elem) {
        return elem.documentElement && !elem.body ||
               elem.tagName && elem.ownerDocument && !elem.ownerDocument.body;
    }
    //检测一个对象是不是Function
    //修正
    function isFunction(fn) {
        return typeof fn === 'function';

    }

    function nodeName(elem, name) {
        return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase();
    }

    //通用属性
    function prop(elem, value, type, i, name) {
        if (isFunction(value))
            value = value.call(elem, i);
        return value && value.constructor == Number && type == "curCSS" && !exclude.test(name) ?
            value + "px" :
            value;
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

        var notxml = !isXMLDoc(elem),
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
                    if (name == "type" && nodeName(elem, "input") && elem.parentNode)
                        throw "type property can't be changed";

                    elem[name] = value;
                }
                 // browsers index elements by id/name on forms, give priority to attributes.
                if (nodeName(elem, "form") && elem.getAttributeNode(name))
                    return elem.getAttributeNode(name).nodeValue;

                return elem[name];
            }

            if (msie && notxml && name == "style")
                return ve.attribute.attr(elem.style, "cssText", value);

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

        name = name.replace(/-([a-z])/ig, function(all, letter) {
            return letter.toUpperCase();
        });
        if (set)
            elem[name] = value;
        return elem[name];
    };
    
    //内部方法
    var tempFnObj= {
        attr: attr,
        each: each
    }

    var privateObj = {
        each: function (callback, args) {
            return each(this, callback, args);
        },
        attr: function (obj,name, value, type) {
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
                        name, prop(this, options[name], type, i, name)
                    );
            });
        }
    };

    ve.attribute = {
        attr: {
            get: function (obj, name, value, type) {
                return privateObj.attr(obj, name, value, type);
            },
            set: function (obj, name, value, type) {
                privateObj.attr(obj, name, value, type);
            }
        }
    }
})();


 


