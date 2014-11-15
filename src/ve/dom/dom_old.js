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
 * Created by chenchangwen on 2014/10/29
 */
$.add(["ve/core/kernel", "ve/dom/selector/q"], function (kernel, query) {


    var dom = function(selector, context){

    };
    // =============================
    // DOM Functions
    // =============================
    //CSS selector
    //@return Array [DOM elements]
    dom.query = function(select, context){
        return query.Q(select, context);
    };

    dom.inject = function()





    var vePublicMethod = {
        append: function (obj) {
            ve._util_.smartInsert(obj, arguments, function (child) {
                obj.nodeType === 1 && obj.appendChild(child);
            });
        },
        prepend: function (obj) {
            ve._util_.smartInsert(obj, arguments, function (child) {
                obj.nodeType === 1 && obj.insertBefore(child, obj.firstChild);
            });
        },
        appendTo: function (obj, target) {
            var ret = [],
            array_push = ret.push;
            ve._util_.smartInsertTo(obj, target, function (child) {
                array_push.apply(ret, ve.makeArray(child.childNodes));
                this.appendChild(child);
            });
            return pushStack(ret);
        },
        prependTo: function (obj, target) {
            var ret = [],
                array_push = ret.push;
            ve._util_.smartInsertTo(obj, target, function (child) {
                array_push.apply(ret, ve.makeArray(child.childNodes));
                this.insertBefore(child, this.firstChild);
            });
            return pushStack(ret);
        },
        after: function (obj) {
            ve._util_.smartInsert(obj, arguments, function (node) {
                this.parentNode && this.parentNode.insertBefore(node, this.nextSibling);
            });
            return this;
        },
        before: function (obj) {
            ve._util_.smartInsert(obj, arguments, function (node) {
                this.parentNode && this.parentNode.insertBefore(node, this);
            });
            return this;
        },
        insertAfter: function (obj, target) {
            var ret = [],
                array_push = ret.push;

            ve._util_.smartInsertTo(obj, target, function (node) {
                array_push.apply(ret, ve.makeArray(node.childNodes));
                this.parentNode.insertBefore(node, this.nextSibling);
            }, 'after');

            return pushStack(ret);
        },
        insertBefore: function (obj, target) {
            var ret = [],
                array_push = ret.push;
            ve._util_.smartInsertTo(obj, target, function (node) {
                array_push.apply(ret, ve.makeArray(node.childNodes));
                this.parentNode.insertBefore(node, this);
            }, 'before');
            return pushStack(ret);
        },
        empty: function () {
            //修正item为arguments
            for (var i = 0, item; item = arguments[i]; i++) {
                item.nodeType === 1 && ve._util_.cleanData(item.getElementsByTagName('*'));
                while (item.firstChild) {
                    item.removeChild(item.firstChild);
                }
            }
            return this;
        },
        remove: function (selector, keepData) {
            //修正ele为arguments
            if (arguments[0].length > 0) {
                arguments = arguments[0];
            }

            for (var i = 0, ele; ele = arguments[i]; i++) {
                if (!keepData && ele.nodeType === 1) {
                    ve._util_.cleanData(ele.getElementsByTagName('*'));
                    ve._util_.cleanData([ele]);
                }
                ele.parentNode && ele.parentNode.removeChild(ele);
            }
            return this;
        },
        detach: function () {
            return this.remove(arguments, true);
        },
        getDocument: function (obj) {
            var ele = obj;
            return ele.nodeType == 9 ? ele : ele.ownerDocument || ele.document;
        },
        getWindow: function (obj) {
            var doc = vePublicMethod.getDocument(obj);
            return (doc.parentWindow || doc.defaultView);
        },
        val: function (obj, value) {
            ve._util_.support.dom.select.disabled = true;
            var util = ve._util_,
                checkOn = util.support.dom.input.value === 'on',
                optDisabled = !util.support.dom.opt.disabled,
                inputType = ['radio', 'checkbox'],
                valHooks = {
                    option: {
                        get: function (ele) {
                            var val = ele.attributes.value;
                            return !val || val.specified ? ele.value : ele.text;
                        }
                    },
                    select: {
                        get: function (ele) {
                            var options = ele.options,
                                index = ele.selectedIndex,
                                one = ele.type === 'select-one' || index < 0,
                                ret = one ? null : [],
                                len = one ? index + 1 : options.length,
                                i = index < 0 ? len : one ? index : 0,
                                item, val;
                            for (; i < len; i++) {
                                item = options[i];
                                if ((item.selected || i === index)
                                    && (optDisabled ? !item.disabled : item.getAttribute('disabled') === null)
                                    && (!item.parentNode.disabled || !util.nodeName(item.parentNode, 'optgroup'))) {
                                    val = ve.dom(item).val();
                                    if (one) { return val; }
                                    ret.push(val);
                                }
                            }
                            return ret;
                        },
                        set: function (ele, key, val) {
                            var ret = ve.makeArray(val);
                            ve.dom(ele).find('option').each(function (index, item) {
                                item.selected = util.inArray(ve.dom(this).val(), ret) >= 0;
                            });
                            !ret.length && (ele.selectedIndex = -1);
                            return ret;
                        }
                    }
                };
            !util.support.getSetAttribute && (valHooks.button = util.nodeHook);
            if (!checkOn) {
                ve.forEach(inputType, function (item) {
                    valHooks[item] = {
                        get: function (ele) {
                            return ele.getAttribute('value') === null ? 'on' : ele.value;
                        }
                    };
                });
            }
            ve.forEach(inputType, function (item) {
                valHooks[item] = valHooks[item] || {};
                valHooks[item].set = function (ele, key, val) {
                    if (ve.type(val) === 'array') {
                        return (ele.checked = util.inArray(ve.dom(ele).val(), val) >= 0);
                    }
                }
            });
            return function (obj, value) {
                var ele, hooks;
                if (value === undefined) {
                    if (!(ele = obj)) {
                        return;
                    }
                    hooks = valHooks[ele.type] || valHooks[ele.nodeName.toLowerCase()] || {};
                    return hooks.get && hooks.get(ele, 'value') || ele.value;
                }
                obj = pushStack(obj);

                each(obj, function (index, item) {
                    if (item.nodeType !== 1) {
                        return;
                    }
                    var tang = pushStack(item),
                        val = ve.type(value) === 'function' ?
                            value.call(item, index, tang.val()) : value;
                    if (val == null) {
                        val = '';
                    } else if (ve.type(val) === 'number') {
                        val += '';
                    } else if (ve.type(val) === 'array') {
                        val = ve.array(val).map(function (it) {
                            return it == null ? '' : it + '';
                        });
                    }
                    hooks = valHooks[item.type] || valHooks[item.nodeName.toLowerCase()] || {};
                    if (!hooks.set || hooks.set(item, 'value', val) === undefined) {
                        item.value = val;
                    }
                });
                return obj;
            }(obj, value);
        },
        html: function (obj, value) {
            var bt = ve._util_,
                isSet = false,
                htmlSerialize = !!bt.support.dom.div.getElementsByTagName('link').length,
                leadingWhitespace = (bt.support.dom.div.firstChild.nodeType === 3),
                result;

            var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
            "header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
                rnoInnerhtml = /<(?:script|style|link)/i,
                rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
                rleadingWhitespace = /^\s+/,
                rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
                rtagName = /<([\w:]+)/,
                wrapMap = {
                    option: [1, "<select multiple='multiple'>", "</select>"],
                    legend: [1, "<fieldset>", "</fieldset>"],
                    thead: [1, "<table>", "</table>"],
                    tr: [2, "<table><tbody>", "</tbody></table>"],
                    td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
                    col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
                    area: [1, "<map>", "</map>"],
                    _default: [0, "", ""]
                };
            wrapMap.optgroup = wrapMap.option;
            wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
            wrapMap.th = wrapMap.td;

            // IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
            // unless wrapped in a div with non-breaking characters in front of it.
            if (!htmlSerialize)
                wrapMap._default = [1, "X<div>", "</div>"];
            obj = pushStack(obj);

            ve.forEach(obj, function (elem, index) {

                if (result)
                    return;

                switch (typeof value) {
                    case 'undefined':
                        result = (elem.nodeType === 1 ? elem.innerHTML : undefined);
                        return;

                    case 'number':
                        value = String(value);

                    case 'string':
                        isSet = true;

                        // See if we can take a shortcut and just use innerHTML
                        if (!rnoInnerhtml.test(value) &&
                            (htmlSerialize || !rnoshimcache.test(value)) &&
                            (leadingWhitespace || !rleadingWhitespace.test(value)) &&
                            !wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {

                            value = value.replace(rxhtmlTag, "<$1></$2>");

                            try {

                                // Remove element nodes and prevent memory leaks
                                if (elem.nodeType === 1) {
                                    vePublicMethod.empty(obj);
                                    elem.innerHTML = value;
                                }

                                elem = 0;

                                // If using innerHTML throws an exception, use the fallback method
                            } catch (e) { }
                        }

                        if (elem) {
                            vePublicMethod.empty(obj).append(value);
                        }

                        break;

                    case 'function':
                        isSet = true;
                        tangramDom.html(value.call(elem, index, tangramDom.html()));
                        break;
                };
            });
            return isSet ? obj : result;
        },
        text: function (obj, value) {
            obj = pushStack(obj);

            var isSet = false,
                result;

            var getText = function (elem) {
                var node,
                    ret = "",
                    i = 0,
                    nodeType = elem.nodeType;
                if (nodeType) {
                    if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
                        // Use textContent for elements
                        // innerText usage removed for consistency of new lines (see #11153)
                        if (typeof elem.textContent === "string") {
                            return elem.textContent;
                        } else {
                            // Traverse its children
                            for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
                                ret += getText(elem);
                            }
                        }
                    } else if (nodeType === 3 || nodeType === 4) {
                        return elem.nodeValue;
                    }
                    // Do not include comment or processing instruction nodes
                }
                return ret;
            };

            ve.forEach(obj, function (elem, index) {

                if (result) { return; };

                switch (typeof value) {
                    case 'undefined':

                        //get first
                        result = getText(elem);
                        return result;

                        // break;

                    case 'number':
                        value = String(value);
                    case 'string':

                        //set all
                        isSet = true;
                        vePublicMethod.empty(elem);
                        vePublicMethod.append(elem, (elem && elem.ownerDocument || document).createTextNode(value));
                        break;
                };
            });
            return isSet ? obj : result;
        },
        insertHTML: function (obj, position, html) {
            var range, begin, element = obj;

            //在opera中insertAdjacentHTML方法实现不标准，如果DOMNodeInserted方法被监听则无法一次插入多element
            //by lixiaopeng @ 2011-8-19
            if (element.insertAdjacentHTML && !ve.browser.opera) {
                element.insertAdjacentHTML(position, html);
            } else {
                // 这里不做"undefined" != typeof(HTMLElement) && !window.opera判断，其它浏览器将出错？！
                // 但是其实做了判断，其它浏览器下等于这个函数就不能执行了
                range = element.ownerDocument.createRange();
                // FF下range的位置设置错误可能导致创建出来的fragment在插入dom树之后html结构乱掉
                // 改用range.insertNode来插入html, by wenyuxiang @ 2010-12-14.
                position = position.toUpperCase();
                if (position == 'AFTERBEGIN' || position == 'BEFOREEND') {
                    range.selectNodeContents(element);
                    range.collapse(position == 'AFTERBEGIN');
                } else {
                    begin = position == 'BEFOREBEGIN';
                    range[begin ? 'setStartBefore' : 'setEndAfter'](element);
                    range.collapse(begin);
                }
                range.insertNode(range.createContextualFragment(html));
            }
            return element;
        },
        offset: function (obj) {
            var ele = obj,
                doc = vePublicMethod.getDocument(obj),
                box = { left: 0, top: 0 },
                win,
                docElement;
            if (!doc) {
                return;
            }
            docElement = doc.documentElement;
            if (!ve._util_.contains(docElement, ele)) {
                return box;
            }
            (typeof ele.getBoundingClientRect) !== 'undefined' && (box = ele.getBoundingClientRect());
            win = vePublicMethod.getWindow(obj);
            return {
                left: box.left + (win.pageXOffset || docElement.scrollLeft) - (docElement.clientLeft || 0),
                top: box.top + (win.pageYOffset || docElement.scrollTop) - (docElement.clientTop || 0)
            };
        },
        position: function (obj) {
            var patrn = /^(?:body|html)$/i,
                coordinate = this.offset(obj),
                offsetP = offsetParent(obj),
                parentCoor = patrn.test(offsetP[0].nodeName) ? { left: 0, top: 0 }
                    : this.offset(offsetP);
            coordinate.left -= parseFloat(getCurrentStyle(obj, 'marginLeft')) || 0;
            coordinate.top -= parseFloat(getCurrentStyle(obj, 'marginTop')) || 0;
            parentCoor.left += parseFloat(getCurrentStyle(obj, 'borderLeftWidth')) || 0;
            parentCoor.top += parseFloat(getCurrentStyle(obj, 'borderTopWidth')) || 0;
            return {
                left: coordinate.left - parentCoor.left,
                top: coordinate.top - parentCoor.top
            }
        },
        scrollLeft: function (obj, value) {
            var ret = ve._util_.smartScroll('scrollLeft');
            //修正为直接返回
            return value === undefined ? ret.get(obj)
                    : ret.set(obj, value) || obj;
        },
        scrollTop: function (obj, value) {
            var ret = ve._util_.smartScroll('scrollTop');
            //修正为直接返回
            return value === undefined ? ret.get(obj)
                    : ret.set(obj, value) || obj;
        },
        width: function (obj, value) {
            obj = pushStack(obj);
            return ve._util_.access(obj, 'width', value, function (ele, key, val) {
                var hasValue = val !== undefined,
                    parseValue = hasValue && parseFloat(val),
                    type = ele != null && ele == ele.window ? 'window'
                        : (ele.nodeType === 9 ? 'document' : false);
                if (hasValue && parseValue < 0 || isNaN(parseValue)) { return; }
                hasValue && /^(?:\d*\.)?\d+$/.test(val += '') && (val += 'px');
                return type ? ve._util_.getWindowOrDocumentWidthOrHeight(ele, type, key)
                    : (hasValue ? ele.style.width = val : ve._util_.getWidthOrHeight(ele, key));
            });
        },
        height: function (obj, value) {
            obj = pushStack(obj);
            return ve._util_.access(obj, 'height', value, function (ele, key, val) {
                var hasValue = val !== undefined,
                    parseValue = hasValue && parseFloat(val),
                    type = ele != null && ele == ele.window ? 'window'
                        : (ele.nodeType === 9 ? 'document' : false);
                if (hasValue && parseValue < 0 || isNaN(parseValue)) { return; }
                hasValue && /^(?:\d*\.)?\d+$/.test(val += '') && (val += 'px');
                return type ? ve._util_.getWindowOrDocumentWidthOrHeight(ele, type, key)
                    : (hasValue ? ele.style.height = val : ve._util_.getWidthOrHeight(ele, key));
            });
        },
        innerHeight: function (obj) {
            var ele = obj,
                 type = ele != null && ele === ele.window ? 'window'
                     : (ele.nodeType === 9 ? 'document' : false);
            return type ? ve._util_.getWindowOrDocumentWidthOrHeight(ele, type, 'height')
                : ve._util_.getWidthOrHeight(ele, 'height', 'padding');
        },
        innerWidth: function (obj) {
            var ele = obj,
               type = ele != null && ele === ele.window ? 'window'
                   : (ele.nodeType === 9 ? 'document' : false);
            return type ? ve._util_.getWindowOrDocumentWidthOrHeight(ele, type, 'width')
                : ve._util_.getWidthOrHeight(ele, 'width', 'padding');
        },
        outerWidth: function (obj, margin) {
            var ele = obj,
                 type = ele != null && ele === ele.window ? 'window'
                     : (ele.nodeType === 9 ? 'document' : false);
            return type ? ve._util_.getWindowOrDocumentWidthOrHeight(ele, type, 'width')
                : ve._util_.getWidthOrHeight(ele, 'width', 'padding|border' + (margin ? '|margin' : ''));
        },
        outerHeight: function (obj, margin) {
            var ele = obj;
            type = ele != null && ele === ele.window ? 'window'
                : (ele.nodeType === 9 ? 'document' : false);
            return type ? ve._util_.getWindowOrDocumentWidthOrHeight(ele, type, 'height')
                : ve._util_.getWidthOrHeight(ele, 'height', 'padding|border' + (margin ? '|margin' : ''));
        },
    }

    var T, ve = T = function () {

        var T, ve = T = ve || function (q, c) { return ve.dom ? ve.dom() : null; };

        ve.version = '1';
        ve.guid = "$ve$";
        ve.key = "ve_guid";

        // Tangram 可能被放在闭包中
        // 一些页面级别唯一的属性，需要挂载在 window[ve.guid]上

        var _ = window[ve.guid] = window[ve.guid] || {};
        (_.versions || (_.versions = [])).push(ve.version);

        // 20120709 mz 添加参数类型检查器，对参数做类型检测保护
        ve.check = ve.check || function () { };

        ve.merge = function (first, second) {
            var i = first.length,
                j = 0;

            if (typeof second.length === "number") {
                for (var l = second.length; j < l; j++) {
                    first[i++] = second[j];
                }

            } else {
                while (second[j] !== undefined) {
                    first[i++] = second[j++];
                }
            }

            first.length = i;

            return first;
        };

        ve.forEach = function (enumerable, iterator, context) {
            var i, n, t;

            if (typeof iterator == "function" && enumerable) {

                // Array or ArrayLike or NodeList or String or ArrayBuffer
                n = typeof enumerable.length == "number" ? enumerable.length : enumerable.byteLength;
                if (typeof n == "number") {

                    // 20121030 function.length
                    //safari5.1.7 can not use typeof to check nodeList - linlingyu
                    if (Object.prototype.toString.call(enumerable) === "[object Function]") {
                        return enumerable;
                    }

                    for (i = 0; i < n; i++) {

                        t = enumerable[i]
                        t === undefined && (t = enumerable.charAt && enumerable.charAt(i));

                        // 被循环执行的函数，默认会传入三个参数(array[i], i, array)
                        iterator.call(context || null, t, i, enumerable);
                    }

                    // enumerable is number
                } else if (typeof enumerable == "number") {

                    for (i = 0; i < enumerable; i++) {
                        iterator.call(context || null, i, i, i);
                    }

                    // enumerable is json
                } else if (typeof enumerable == "object") {

                    for (i in enumerable) {
                        if (enumerable.hasOwnProperty(i)) {
                            iterator.call(context || null, enumerable[i], i, enumerable);
                        }
                    }
                }
            }

            return enumerable;
        };

        ve.lang = ve.lang || {};

        ve.type = (function () {
            var objectType = {},
                nodeType = [, "HTMLElement", "Attribute", "Text", , , , , "Comment", "Document", , "DocumentFragment", ],
                str = "Array Boolean Date Error Function Number RegExp String",
                retryType = { 'object': 1, 'function': '1' },//解决safari对于childNodes算为function的问题
                toString = objectType.toString;

            // 给 objectType 集合赋值，建立映射
            ve.forEach(str.split(" "), function (name) {
                objectType["[object " + name + "]"] = name.toLowerCase();

                ve["is" + name] = function (unknow) {
                    return ve.type(unknow) == name.toLowerCase();
                }
            });

            // 方法主体
            return function (unknow) {
                var s = typeof unknow;
                return !retryType[s] ? s
                    : unknow == null ? "null"
                    : unknow._type_
                        || objectType[toString.call(unknow)]
                        || nodeType[unknow.nodeType]
                        || (unknow == unknow.window ? "Window" : "")
                        || "object";
            };
        })();

        // extend
        ve.isDate = function (unknow) {
            return ve.type(unknow) == "date" && unknow.toString() != 'Invalid Date' && !isNaN(unknow);
        };

        ve.isElement = function (unknow) {
            return ve.type(unknow) == "HTMLElement";
        };

        // 20120818 mz 检查对象是否可被枚举，对象可以是：Array NodeList HTMLCollection $DOM
        ve.isEnumerable = function (unknow) {
            return unknow != null
                && (typeof unknow == "object" || ~Object.prototype.toString.call(unknow).indexOf("NodeList"))
            && (typeof unknow.length == "number"
            || typeof unknow.byteLength == "number"     //ArrayBuffer
            || typeof unknow[0] != "undefined");
        };
        ve.isNumber = function (unknow) {
            return ve.type(unknow) == "number" && isFinite(unknow);
        };

        // 20120903 mz 检查对象是否为一个简单对象 {}
        ve.isPlainObject = function (unknow) {
            var key,
                hasOwnProperty = Object.prototype.hasOwnProperty;

            if (ve.type(unknow) != "object") {
                return false;
            }

            //判断new fn()自定义对象的情况
            //constructor不是继承自原型链的
            //并且原型中有isPrototypeOf方法才是Object
            if (unknow.constructor &&
                !hasOwnProperty.call(unknow, "constructor") &&
                !hasOwnProperty.call(unknow.constructor.prototype, "isPrototypeOf")) {
                return false;
            }
            //判断有继承的情况
            //如果有一项是继承过来的，那么一定不是字面量Object
            //OwnProperty会首先被遍历，为了加速遍历过程，直接看最后一项
            for (key in unknow) { }
            return key === undefined || hasOwnProperty.call(unknow, key);
        };

        ve.createChain = function (chainName, fn, constructor) {
            // 创建一个内部类名
            var className = chainName == "dom" ? "$DOM" : "$" + chainName.charAt(0).toUpperCase() + chainName.substr(1),
                slice = Array.prototype.slice,
                chain = ve[chainName];
            if (chain) { return chain }
            // 构建链头执行方法
            chain = ve[chainName] = fn || function (object) {
                return kernel.extend(object, ve[chainName].fn);
            };

            // 扩展 .extend 静态方法，通过本方法给链头对象添加原型方法
            chain.extend = function (extended) {
                var method;

                // 直接构建静态接口方法，如 ve.array.each() 指向到 ve.array().each()
                for (method in extended) {
                    (function (method) {//解决通过静态方法调用的时候，调用的总是最后一个的问题。
                        // 20121128 这个if判断是防止console按鸭子判断规则将本方法识别成数组
                        if (method != "splice") {
                            chain[method] = function () {
                                var id = arguments[0];

                                // 在新版接口中，ID选择器必须用 # 开头
                                chainName == "dom" && ve.type(id) == "string" && (id = "#" + id);

                                var object = chain(id);
                                var result = object[method].apply(object, slice.call(arguments, 1));

                                // 老版接口返回实体对象 getFirst
                                return ve.type(result) == "$DOM" ? result.get(0) : result;
                            }
                        }
                    })(method);
                }
                return kernel.extend(ve[chainName].fn, extended);
            };

            // 创建 链头对象 构造器
            ve[chainName][className] = ve[chainName][className] || constructor || function () { };

            // 给 链头对象 原型链做一个短名映射
            chain.fn = ve[chainName][className].prototype;

            return chain;
        };

        ve.overwrite = function (Class, list, fn) {
            for (var i = list.length - 1; i > -1; i--) {
                Class.prototype[list[i]] = fn(list[i]);
            }

            return Class;
        };

        ve.createChain("array", function (array) {
            var pro = ve.array.$Array.prototype
                , ap = Array.prototype
                , key;

            ve.type(array) != "array" && (array = []);

            for (key in pro) {
                //ap[key] || (array[key] = pro[key]);
                array[key] = pro[key];
            }

            return array;
        });

        // 对系统方法新产生的 array 对象注入自定义方法，支持完美的链式语法
        ve.overwrite(ve.array.$Array, "concat slice".split(" "), function (key) {
            return function () {
                return ve.array(Array.prototype[key].apply(this, arguments));
            }
        });

        ve.query = ve.query || function () {
            var rId = /^(\w*)#([\w\-\$]+)$/
               , rId0 = /^#([\w\-\$]+)$/
               , rTag = /^\w+$/
               , rClass = /^(\w*)\.([\w\-\$]+)$/
               , rComboClass = /^(\.[\w\-\$]+)+$/
               , rDivider = /\s*,\s*/
               , rSpace = /\s+/g
               , slice = Array.prototype.slice;

            // selector: #id, .className, tagName, *
            function query(selector, context) {
                var t, x, id, dom, tagName, className, arr, list, array = [];

                // tag#id
                if (rId.test(selector)) {
                    id = RegExp.$2;
                    tagName = RegExp.$1 || "*";

                    // 本段代码效率很差，不过极少流程会走到这段
                    ve.forEach(context.getElementsByTagName(tagName), function (dom) {
                        dom.id == id && array.push(dom);
                    });

                    // tagName or *
                } else if (rTag.test(selector) || selector == "*") {
                    ve.merge(array, context.getElementsByTagName(selector));

                    // .className
                } else if (rClass.test(selector)) {
                    arr = [];
                    tagName = RegExp.$1;
                    className = RegExp.$2;
                    t = " " + className + " ";
                    // bug: className: .a.b

                    if (context.getElementsByClassName) {
                        arr = context.getElementsByClassName(className);
                    } else {
                        ve.forEach(context.getElementsByTagName("*"), function (dom) {
                            dom.className && ~(" " + dom.className + " ").indexOf(t) && (arr.push(dom));
                        });
                    }

                    if (tagName && (tagName = tagName.toUpperCase())) {
                        ve.forEach(arr, function (dom) {
                            dom.tagName.toUpperCase() === tagName && array.push(dom);
                        });
                    } else {
                        ve.merge(array, arr);
                    }

                    // IE 6 7 8 里组合样式名(.a.b)
                } else if (rComboClass.test(selector)) {
                    list = selector.substr(1).split(".");

                    ve.forEach(context.getElementsByTagName("*"), function (dom) {
                        if (dom.className) {
                            t = " " + dom.className + " ";
                            x = true;

                            ve.forEach(list, function (item) {
                                ~t.indexOf(" " + item + " ") || (x = false);
                            });

                            x && array.push(dom);
                        }
                    });
                }

                return array;
            }

            // selector 还可以是上述四种情况的组合，以空格分隔
            // @return ArrayLike
            function queryCombo(selector, context) {
                var a, s = selector, id = "__tangram__", array = [];

                // 在 #id 且没有 context 时取 getSingle，其它时 getAll
                if (!context && rId0.test(s) && (a = document.getElementById(s.substr(1)))) {
                    return [a];
                }

                context = context || document;

                // 用 querySelectorAll 时若取 #id 这种唯一值时会多选
                if (context.querySelectorAll) {
                    // 在使用 querySelectorAll 时，若 context 无id将貌似 document 而出错
                    if (context.nodeType == 1 && !context.id) {
                        context.id = id;
                        a = context.querySelectorAll("#" + id + " " + s);
                        context.id = "";
                    } else {
                        a = context.querySelectorAll(s);
                    }
                    return a;
                } else {
                    if (!~s.indexOf(" ")) {
                        return query(s, context);
                    }

                    ve.forEach(query(s.substr(0, s.indexOf(" ")), context), function (dom) { // 递归
                        ve.merge(array, queryCombo(s.substr(s.indexOf(" ") + 1), dom));
                    });
                }

                return array;
            }

            return function (selector, context, results) {
                if (!selector || typeof selector != "string") {
                    return results || [];
                }

                var arr = [];
                selector = selector.replace(rSpace, " ");
                results && ve.merge(arr, results) && (results.length = 0);

                ve.forEach(selector.indexOf(",") > 0 ? selector.split(rDivider) : [selector], function (item) {
                    ve.merge(arr, queryCombo(item, context));
                });

                return ve.merge(results || [], ve.array(arr).unique());
            };
        }();

        ve.createChain("dom",

        // method function


        function (selector, context) {
            var e, me = new ve.dom.$DOM(context);

            // Handle $(""), $(null), or $(undefined)
            if (!selector) {
                return me;
            }

            // Handle $($DOM)
            if (selector._type_ == "$DOM") {
                return selector;

                // Handle $(DOMElement)
            } else if (selector.nodeType || selector == selector.window) {
                me[0] = selector;
                me.length = 1;
                return me;

                // Handle $(Array) or $(Collection) or $(NodeList)
            } else if (selector.length && me.toString.call(selector) != "[object String]") {
                return ve.merge(me, selector);

            } else if (typeof selector == "string") {
                // HTMLString
                if (selector.charAt(0) == "<" && selector.charAt(selector.length - 1) == ">" && selector.length > 2) {
                    // Match a standalone tag
                    var rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
                        doc = context && context._type_ === '$DOM' ? context[0] : context,
                        ret = rsingleTag.exec(selector);
                    doc = doc && doc.nodeType ? doc.ownerDocument || doc : document;
                    ret = ret ? [doc.createElement(ret[1])] : (ve.dom.createElements ? ve.dom.createElements(selector) : []);
                    ve.merge(me, ret);
                    // ve.query
                } else {
                    ve.query(selector, context, me);
                }

                // document.ready
            } else if (typeof selector == "function") {
                return me.ready ? me.ready(selector) : me;
            }

            return me;
        },

        // constructor
        function (context) {
            //        this.length = 0;
            //        this._type_ = "$DOM";
            //        this.context = context || document;
        }

        ).extend({

            size: function () {
                return this.length;
            }

            // 2012.11.27 mz 拥有 .length 和 .splice() 方法，console.log() 就认为该对象是 ArrayLike
            , splice: function () { }


            , get: function (index) {

                if (typeof index == "number") {
                    return index < 0 ? this[this.length + index] : this[index];
                }

                return Array.prototype.slice.call(this, 0);
            }

            // 将 $DOM 转换成 Array(dom, dom, ...) 返回
            , toArray: function () {
                return this.get();
            }

        });

        ve._util_ = ve._util_ || {};

        ve.dom.createElements = function () {
            var tagReg = /<(\w+)/i,
                rhtml = /<|&#?\w+;/,
                tagMap = {
                    area: [1, "<map>", "</map>"],
                    col: [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"],
                    legend: [1, "<fieldset>", "</fieldset>"],
                    option: [1, "<select multiple='multiple'>", "</select>"],
                    td: [3, "<table><tbody><tr>", "</tr></tbody></table>"],
                    thead: [1, "<table>", "</table>"],
                    tr: [2, "<table><tbody>", "</tbody></table>"],
                    _default: [0, "", ""]
                };

            // 建立映射
            tagMap.optgroup = tagMap.option;
            tagMap.tbody = tagMap.tfoot = tagMap.colgroup = tagMap.caption = tagMap.thead;
            tagMap.th = tagMap.td;

            // 将<script>解析成正常可执行代码
            function parseScript(box, doc) {
                var list = box.getElementsByTagName("SCRIPT"),
                    i, script, item;

                for (i = list.length - 1; i >= 0; i--) {
                    item = list[i];
                    script = doc.createElement("SCRIPT");

                    item.id && (script.id = item.id);
                    item.src && (script.src = item.src);
                    item.type && (script.type = item.type);
                    script[item.text ? "text" : "textContent"] = item.text || item.textContent;

                    item.parentNode.replaceChild(script, item);
                }
            }

            return function (htmlstring, doc) {
                ve.isNumber(htmlstring) && (htmlstring = htmlstring.toString());
                doc = doc || document;

                var wrap, depth, box,
                    hs = htmlstring,
                    n = hs.length,
                    div = doc.createElement("div"),
                    df = doc.createDocumentFragment(),
                    result = [];

                if (ve.isString(hs)) {
                    if (!rhtml.test(hs)) {// TextNode
                        result.push(doc.createTextNode(hs));
                    } else {//htmlString
                        wrap = tagMap[hs.match(tagReg)[1].toLowerCase()] || tagMap._default;

                        div.innerHTML = "<i>mz</i>" + wrap[1] + hs + wrap[2];
                        div.removeChild(div.firstChild);  // for ie (<script> <style>)
                        parseScript(div, doc);

                        depth = wrap[0];
                        box = div;
                        while (depth--) { box = box.firstChild; };

                        ve.merge(result, box.childNodes);

                        // 去除 item.parentNode
                        ve.forEach(result, function (dom) {
                            df.appendChild(dom);
                        });

                        div = box = null;
                    }
                }

                div = null;

                return result;
            };
        }();

        ve._util_.support = ve._util_.support || function () {
            var div = document.createElement('div'),
                baseSupport, a, input, select, opt;
            div.setAttribute('className', 't');
            div.innerHTML = ' <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
            a = div.getElementsByTagName('A')[0];
            a.style.cssText = 'top:1px;float:left;opacity:.5';
            select = document.createElement('select');
            opt = select.appendChild(document.createElement('option'));
            input = div.getElementsByTagName('input')[0];
            input.checked = true;

            baseSupport = {
                dom: {
                    div: div,
                    a: a,
                    select: select,
                    opt: opt,
                    input: input
                }
                //        radioValue: only import by ve._util.attr
                //        hrefNormalized: only import by ve._util.attr
                //        style: only import by ve._util.attr
                //        optDisabled: only import by ve.dom.val
                //        checkOn: only import by ve.dom.val
                //        noCloneEvent: only import by ve.dom.clone
                //        noCloneChecked: only import by ve.dom.clone
                //        cssFloat: only import ve.dom.styleFixer
                //        htmlSerialize: only import ve.dom.html
                //        leadingWhitespace: only import ve.dom.html
            };
            return baseSupport;
        }();

        ve.global = ve.global || (function () {
            var me = ve._global_ = window[ve.guid],
                // 20121116 mz 在多个tangram同时加载时有互相覆写的风险
                global = me._ = me._ || {};

            return function (key, value, overwrite) {
                if (typeof value != "undefined") {
                    overwrite || (value = typeof global[key] == "undefined" ? value : global[key]);
                    global[key] = value;

                } else if (key && typeof global[key] == "undefined") {
                    global[key] = {};
                }

                return global[key];
            }
        })();

        ve.browser = ve.browser || function () {
            var ua = navigator.userAgent;

            var result = {
                isStrict: document.compatMode == "CSS1Compat"
                , isGecko: /gecko/i.test(ua) && !/like gecko/i.test(ua)
                , isWebkit: /webkit/i.test(ua)
            };

            try { /(\d+\.\d+)/.test(external.max_version) && (result.maxthon = +RegExp['\x241']) } catch (e) { };

            // 蛋疼 你懂的
            switch (true) {
                case /msie (\d+\.\d+)/i.test(ua):
                    result.ie = document.documentMode || +RegExp['\x241'];
                    break;
                case /chrome\/(\d+\.\d+)/i.test(ua):
                    result.chrome = +RegExp['\x241'];
                    break;
                case /(\d+\.\d)?(?:\.\d)?\s+safari\/?(\d+\.\d+)?/i.test(ua) && !/chrome/i.test(ua):
                    result.safari = +(RegExp['\x241'] || RegExp['\x242']);
                    break;
                case /firefox\/(\d+\.\d+)/i.test(ua):
                    result.firefox = +RegExp['\x241'];
                    break;

                case /opera(?:\/| )(\d+(?:\.\d+)?)(.+?(version\/(\d+(?:\.\d+)?)))?/i.test(ua):
                    result.opera = +(RegExp["\x244"] || RegExp["\x241"]);
                    break;
            }

            kernel.extend(ve, result);

            return result;
        }();

        ve.id = function () {
            var maps = ve.global("_maps_id")
                , key = ve.key;

            // 2012.12.21 与老版本同步
            window[ve.guid]._counter = window[ve.guid]._counter || 1;

            return function (object, command) {
                var e
                    , str_1 = ve.isString(object)
                    , obj_1 = kernel.isObject(object)
                    , id = obj_1 ? object[key] : str_1 ? object : "";

                // 第二个参数为 String
                if (ve.isString(command)) {
                    switch (command) {
                        case "get":
                            return obj_1 ? id : maps[id];
                            //            break;
                        case "remove":
                        case "delete":
                            if (e = maps[id]) {
                                // 20120827 mz IE低版本(ie6,7)给 element[key] 赋值时会写入DOM树，因此在移除的时候需要使用remove
                                if (ve.isElement(e) && ve.browser.ie < 8) {
                                    e.removeAttribute(key);
                                } else {
                                    delete e[key];
                                }
                                delete maps[id];
                            }
                            return id;
                            //            break;
                        default:
                            if (str_1) {
                                (e = maps[id]) && delete maps[id];
                                e && (maps[e[key] = command] = e);
                            } else if (obj_1) {
                                id && delete maps[id];
                                maps[object[key] = command] = object;
                            }
                            return command;
                    }
                }

                // 第一个参数不为空
                if (obj_1) {
                    !id && (maps[object[key] = id = ve.id()] = object);
                    return id;
                } else if (str_1) {
                    return maps[object];
                }

                return "TANGRAM_" + ve._global_._counter++;
            };
        }();

        ve._util_.eventBase = ve._util_.eventBase || {};

        ve._util_.cleanData = function (array) {
            var tangId;
            for (var i = 0, ele; ele = array[i]; i++) {
                tangId = ve.id(ele, 'get');
                if (!tangId) { continue; }
                ve._util_.eventBase.queue.remove(ele);
                ve.id(ele, 'remove');
            }
        };

        ve._util_.smartInsert = function (tang, args, callback) {
            var doc = vePublicMethod.getDocument(tang) || document,
                fragment = doc.createDocumentFragment(),
                len = 0,
                firstChild;
            //将tang对象转换为数组对象
            if (tang.nodeType) {
                tang = [tang];
            }
            //根据args判断截取参数
            var i = args.length > 1 ? 1 : 0;
            for (var item; item = args[i]; i++) {
                if (item.nodeType) {
                    fragment.appendChild(item);
                } else {
                    ve.forEach(~'string|number'.indexOf(ve.type(item)) ?
                        ve.dom.createElements(item, doc)
                            : item, function (ele) {
                                fragment.appendChild(ele);
                            });
                }
            }

            if (!(firstChild = fragment.firstChild)) { return; }
            ve.forEach(tang, function (item, index) {
                callback.call(item.nodeName.toLowerCase() === 'table'
                    && firstChild.nodeName.toLowerCase() === 'tr' ?
                        item.tBodies[0] || item.appendChild(item.ownerDocument.createElement('tbody'))
                            : item, index < len ? fragment.cloneNode(true) : fragment);
            });
        };

        ve.makeArray = function (array, results) {
            var ret = results || [];
            if (!array) { return ret; }
            array.length == null || ~'string|function|regexp'.indexOf(ve.type(array)) ?
                [].push.call(ret, array) : ve.merge(ret, array);
            return ret;
        };

        ve._util_.contains = document.compareDocumentPosition ?
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

        ve._util_.smartInsertTo = function (tang, target, callback, orie) {
            var insert = pushStack(target),
                first = insert[0],
                tangDom;
            if (tang.nodeType) {
                tang = [tang];
            }
            if (orie && first && (!first.parentNode || first.parentNode.nodeType === 11)) {
                orie = orie === 'before';
                tangDom = ve.merge(orie ? tang : insert, !orie ? tang : insert);
                if (tang !== tangDom) {
                    tang.length = 0;
                    ve.merge(tang, tangDom);
                }
            } else {
                for (var i = 0, item; item = insert[i]; i++) {
                    ve._util_.smartInsert(item, i > 0 ? vePublicMethod.clone(tang,true, true) : tang, callback);
                }
            }
        };

        ve.dom.match = function () {
            var reg = /^[\w\#\-\$\.\*]+$/,

                // 使用这个临时的 div 作为CSS选择器过滤
                div = document.createElement("DIV");
            div.id = "__tangram__";

            return function (array, selector, context) {
                var root, results = ve.array();

                switch (ve.type(selector)) {
                    // 取两个 TangramDom 的交集
                    case "$DOM":
                        for (var x = array.length - 1; x > -1; x--) {
                            for (var y = selector.length - 1; y > -1; y--) {
                                array[x] === selector[y] && results.push(array[x]);
                            }
                        }
                        break;

                        // 使用过滤器函数，函数返回值是 Array
                    case "function":
                        ve.forEach(array, function (item, index) {
                            selector.call(item, index) && results.push(item);
                        });
                        break;

                    case "HTMLElement":
                        ve.forEach(array, function (item) {
                            item == selector && results.push(item);
                        });
                        break;

                        // CSS 选择器
                    case "string":
                        var da = ve.query(selector, context || document);
                        ve.forEach(array, function (item) {
                            if (root = getRoot(item)) {
                                var t = root.nodeType == 1
                                    // in DocumentFragment
                                    ? ve.query(selector, root)
                                    : da;

                                for (var i = 0, n = t.length; i < n; i++) {
                                    if (t[i] === item) {
                                        results.push(item);
                                        break;
                                    }
                                }
                            }
                        });
                        results = results.unique();
                        break;

                    default:
                        results = ve.array(array).unique();
                        break;
                }
                return results;

            };

            function getRoot(dom) {
                var result = [], i;

                while (dom = dom.parentNode) {
                    dom.nodeType && result.push(dom);
                }

                for (var i = result.length - 1; i > -1; i--) {
                    // 1. in DocumentFragment
                    // 9. Document
                    if (result[i].nodeType == 1 || result[i].nodeType == 9) {
                        return result[i];
                    }
                }
                return null;
            }
        }();

        ve.dom.extend({
            find: function (selector) {
                var a = [],
                    expr,
                    id = "__tangram__find__",
                    td = [];

                switch (ve.type(selector)) {
                    case "string":
                        this.each(function () { ve.merge(td, ve.query(selector, this)); });
                        break;
                    case "HTMLElement":
                        expr = selector.tagName + "#" + (selector.id ? selector.id : (selector.id = id));
                        this.each(function () { if (ve.query(expr, this).length > 0) a.push(selector); });
                        selector.id == id && (selector.id = "");
                        if (a.length > 0) ve.merge(td, a);
                        break;
                    case "$DOM":
                        a = selector.get();
                        this.each(function () {
                            ve.forEach(ve.query("*", this), function (dom) {
                                for (var i = 0, n = a.length; i < n; i++) {
                                    dom === a[i] && (td[td.length++] = a[i]);
                                }
                            });
                        });
                        break;
                }
                return this.pushStack(td);
            }
        });

        ve._util_.nodeName = function (ele, nodeName) {
            return ele.nodeName && ele.nodeName.toLowerCase() === nodeName.toLowerCase();
        };

        ve._util_.inArray = function (ele, array, index) {
            if (!array) { return -1; }
            var indexOf = Array.prototype.indexOf,
                len;
            if (indexOf) { return indexOf.call(array, ele, index); }
            len = array.length;
            index = index ? index < 0 ? Math.max(0, len + index) : index : 0;
            for (; index < len; index++) {
                if (index in array && array[index] === ele) {
                    return index;
                }
            }
            return -1;
        };

        ve._util_.support.getSetAttribute = ve._util_.support.dom.div.className !== 't';

        ve._util_.nodeHook = function () {
            if (ve._util_.support.getSetAttribute) { return; }
            var fixSpecified = {};
            fixSpecified.name = fixSpecified.id = fixSpecified.coords = true;
            return {
                get: function (ele, key) {
                    var ret = ele.getAttributeNode(key);
                    return ret && (fixSpecified[key] ? ret.value !== '' : ret.specified) ?
                         ret.value : undefined;
                },
                set: function (ele, key, val) {
                    // Set the existing or create a new attribute node
                    var ret = ele.getAttributeNode(key);
                    if (!ret) {
                        ret = document.createAttribute(key);
                        ele.setAttributeNode(ret);
                    }
                    return (ret.value = val + '');
                }
            };
        }();

        ve._util_.smartScroll = function (axis) {
            var orie = { scrollLeft: 'pageXOffset', scrollTop: 'pageYOffset' }[axis],
                is = axis === 'scrollLeft',
                ret = {};
            function isDocument(ele) {
                return ele && ele.nodeType === 9;
            }
            function getWindow(ele) {
                return ve.type(ele) == "Window" ? ele
                    : isDocument(ele) ? ele.defaultView || ele.parentWindow : false;
            }
            return {
                get: function (ele) {
                    var win = getWindow(ele);
                    return win ? (orie in win) ? win[orie]
                        : ve.browser.isStrict && win.document.documentElement[axis]
                            || win.document.body[axis] : ele[axis];
                },

                set: function (ele, val) {
                    if (!ele) { return; }
                    var win = getWindow(ele);
                    win ? win.scrollTo(is ? val : this.get(ele), !is ? val : this.get(ele))
                        : ele[axis] = val;
                }
            };
        };

        ve._util_.access = function (tang, key, value, callback, pass) {
            switch (ve.type(key)) {
                case 'string': //高频
                    if (value === undefined) {
                        return callback.call(tang, tang[0], key);
                    } else {
                        tang.each(function (index, item) {
                            callback.call(tang, item, key,
                                (ve.type(value) === 'function' ? value.call(item, index, callback.call(tang, item, key)) : value),
                                pass);
                        });
                    }
                    break;
                case 'object':
                    for (var i in key) {
                        ve._util_.access(tang, i, key[i], callback, value);
                    }
                    break;
            }
            return tang;
        };

        ve._util_.getWidthOrHeight = function () {
            var ret = {},
                cssShow = { position: 'absolute', visibility: 'hidden', display: 'block' },
                rdisplayswap = /^(none|table(?!-c[ea]).+)/;
            function swap(ele, options) {
                var defaultVal = {};
                for (var i in options) {
                    defaultVal[i] = ele.style[i];
                    ele.style[i] = options[i];
                }
                return defaultVal;
            }
            ve.forEach(['Width', 'Height'], function (item) {
                var cssExpand = { Width: ['Right', 'Left'], Height: ['Top', 'Bottom'] }[item];
                ret['get' + item] = function (ele, extra) {
                    var defaultValue = ele.offsetWidth === 0
                            && rdisplayswap.test(getCurrentStyle(ele, 'display'))
                            && (swap(ele, cssShow)),
                        rect = ele['offset' + item] || parseInt(getCurrentStyle(ele, item.toLowerCase())) || 0,
                        delString = 'padding|border';
                    extra && ve.forEach(extra.split('|'), function (val) {
                        if (!~delString.indexOf(val)) {//if val is margin
                            rect += parseFloat(getCurrentStyle(ele, val + cssExpand[0])) || 0;
                            rect += parseFloat(getCurrentStyle(ele, val + cssExpand[1])) || 0;
                        } else {//val is border or padding
                            delString = delString.replace(new RegExp('\\|?' + val + '\\|?'), '');
                        }
                    });
                    delString && ve.forEach(delString.split('|'), function (val) {
                        rect -= parseFloat(getCurrentStyle(ele, val + cssExpand[0] + (val === 'border' ? 'Width' : ''))) || 0;
                        rect -= parseFloat(getCurrentStyle(ele, val + cssExpand[1] + (val === 'border' ? 'Width' : ''))) || 0;
                    });
                    defaultValue && swap(ele, defaultValue);
                    return rect;
                }
            });
            //
            return function (ele, key, extra) {
                return ret[key === 'width' ? 'getWidth' : 'getHeight'](ele, extra);
            }
        }();

        ve._util_.getWindowOrDocumentWidthOrHeight = ve._util_.getWindowOrDocumentWidthOrHeight || function () {
            var ret = { 'window': {}, 'document': {} };
            ve.forEach(['Width', 'Height'], function (item) {
                var clientProp = 'client' + item,
                    offsetProp = 'offset' + item,
                    scrollProp = 'scroll' + item;
                ret['window']['get' + item] = function (ele) {
                    var doc = ele.document,
                        rectValue = doc.documentElement[clientProp];
                    return ve.browser.isStrict && rectValue
                        || doc.body && doc.body[clientProp] || rectValue;
                };
                ret['document']['get' + item] = function (ele) {
                    var doc = ele.documentElement;
                    return doc[clientProp] >= doc[scrollProp] ? doc[clientProp]
                        : Math.max(ele.body[scrollProp], doc[scrollProp], ele.body[offsetProp], doc[offsetProp]);
                }
            });
            return function (ele, type, key) {
                return ret[type][key === 'width' ? 'getWidth' : 'getHeight'](ele);
            }
        }();

        return ve;
    }();

    function pushStack(elems) {
        if (elems.nodeType) {
            elems = [elems];
        }
        var ret = {}
        ret.length = 0;
        ret.element = elems;
        ve.merge(ret, elems);
        // ret[0] = elems;
        ret.prevObject = elems;    //ret.prevObject = this;    将this 改为elems
        ret.context = this.context;
        return ret;
    }

    function getCurrentStyle(obj, key) {
        var css = document.documentElement.currentStyle ?
             function (key) { return obj.currentStyle ? obj.currentStyle[key] : obj.style[key]; }
                 : function (key) { return getComputedStyle(obj, key); }
        return function(obj,key) {
            return css.call(obj, key);
        }(obj, key);
    }

    function getComputedStyle(obj, key) {
        if (!obj.ownerDocument) { return; }// document can not get style;
        var defaultView = obj.ownerDocument.defaultView,
            computedStyle = defaultView && defaultView.getComputedStyle
                && defaultView.getComputedStyle(obj, null),
            val = computedStyle ? (computedStyle.getPropertyValue(key) || computedStyle[key]) : '';
        return val || obj.style[key];
    }

    function offsetParent(obj) {
        return map(obj, function () {
            var offsetP = obj.offsetParent || document.body,
                exclude = /^(?:body|html)$/i;
            while (offsetP && getCurrentStyle(offsetP, 'position') === 'static'
                && !exclude.test(offsetP.nodeName)) {
                offsetP = offsetP.offsetParent;
            }
            return offsetP;
        });
    }

    function map(obj, iterator) {
        var ret = [],
            i = 0;
        if (obj.nodeType) {
            obj = [obj];
        }
        ve.forEach(obj, function (dom, index) {
            ret[i++] = iterator.call(dom, index, dom, dom);
        });

        return pushStack(ret);
    
    }

    function each(obj, iterator) {
        var i, result,
            n = 1;

        for (i = 0; i < n; i++) {
            result = iterator.call(obj[i], i, obj[i], obj);

            if (result === false || result == "break") { break; }
        }

        return obj;
    }

    //return vePublicMethod;

    return dom;
});