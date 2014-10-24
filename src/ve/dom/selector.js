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

$.add(["ve/core/kernel"], function (kernel) {

    var queryEngine = function (selector, context) {
        return new queryEngine.fn.init(selector, context);
    };
    //一个检测HTML字符串和ID字符串的简单方法.
    var quickExpr = /^[^<]*(<(.|\s)+>)[^>]*$|^#(\w+)$/,
        //一个简单的选择器
        isSimple = /^.[^:#\[\.]*$/,

        undefined;

    queryEngine.fn = queryEngine.prototype = {
        init: function (selector, context) {
            selector = selector || document;
            //是Dom元素就应该有一个nodeType
            if (selector.nodeType) {
                this[0] = selector;
                this.length = 1;
                return this;
            }
            if (typeof selector == 'string') {
                //是否正在处理html或者id字符串
                var match = quickExpr.exec(selector);
                /*
                   * 通过match变量来将string类型的情况再区分成两类:
                   * (1) 是HTML字符串或者ID字符串的情况
                   * (2) 其他,如'.className', 'tagName'之类.
                */
                if (match && (match[1] || !context)) {
                    //clean将字符串转化成真正的DOM元素然后装在一个数组里面,最后返回给selector
                    if (match[1]) {
                        selector = queryEngine.clean([match[1]], context);
                    } else {
                        // 如果是#id, 那就调用JavaScript原生的getElementById
                        var elem = document.getElementById(match[3]);
                        if (elem) {
                            if (elem.id != match[3]) {
                                return queryEngine.find(selector);
                            }
                            return queryEngine(elem);
                        }
                        //没获得元素,返回空
                        selector = [];
                    }
                } else {
                    //如果是不正确乱七八糟的则直接调用find
                    return queryEngine(context).find(selector);
                }
            }
            //else if (queryEngine.isFunction(selector)) {
            //    return queryEngine(document)[queryEngine.ready ? "ready" : "load"](selector);
            //}
            return this.setArray(queryEngine.makeArray(selector));
        },
        //匹配元素集合长度,初始设置为0
        length: 0,
        setArray: function (elems) {
            this.length = 0;
            //追加到当前对象
            Array.prototype.push.apply(this, elems);
            return this;
        },
        each: function (callback, args) {
            return queryEngine.each(this, callback, args);
        },
        pushStack: function (elems) {
            var ret = queryEngine(elems);
            ret.prevObject = this;
            return ret;
        },
        find: function (selector) {
            var elems = queryEngine.map(this, function (elem) {
                return queryEngine.find(selector, elem);
            });

            return this.pushStack(/[^+>] [^+>]/.test(selector) || selector.indexOf("..") > -1 ?
                queryEngine.unique(elems) :
                elems);
        },
        map: function (callback) {
            return this.pushStack(queryEngine.map(this, function (elem, i) {
                return callback.call(elem, i, elem);
            }));
        },
    }

    queryEngine.fn.init.prototype = queryEngine.fn;

    //用户代理
    var userAgent = navigator.userAgent.toLowerCase();

    queryEngine.browser = {
        fnrsion: (userAgent.match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [])[1],
        safari: /webkit/.test(userAgent),
        opera: /opera/.test(userAgent),
        msie: /msie/.test(userAgent) && !/opera/.test(userAgent),
        mozilla: /mozilla/.test(userAgent) && !/(compatible|webkit)/.test(userAgent)
    };



    //------------------静态核心函数----------------//
    //这些静态函数为queryEngine对象实例方法或者其他需要的函数所调用.queryEngine
    kernel.extend(queryEngine, {
        //用一个Array克隆另外一个内容一致的数组
        makeArray: function (array) {
            var ret = [];
            if (array != null) {
                var i = array.length;
                if (i == null || array.split || array.setInterval || array.call) {
                    ret[0] = array;
                } else {
                    while (i) {
                        ret[--i] = array[i];
                    }
                }
            }
            return ret;
        },
        /*
        * 判断一个元素的nodeName是不是给定的name
        * 
        * elem - 要判定的元素
        * name - 看看elem.nodeName是不是这个name
        */
        nodeName: function (elem, name) {
            return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase();
        },
        /*
         * 把两个数组拼接起来(将第二个数组接到第一个数组的尾巴上)
         */
        merge: function (first, second) {
            var i = 0, elem, pos = first.length;
            if (queryEngine.browser.msie) {
                while (elem = second[i++]) {
                    if (elem.nodeType != 8) {
                        first[pos++] = elem;
                    }
                }
            } else {
                while (elem = second[i++])
                    first[pos++] = elem;
            }
            return first;
        },
        /**
          * 如果elems是Number类型,则变成数字字符;
          * 如果elems是XHTML字符串,则将这些字符变成真正的DOM Element 
            然后把这些元素存储在匹配元素集合里面.
          * 
            在queryEngine对象的构造函数中,当传入的字符串是HTML字符串时,queryEngine将会调用本
            函数来将这些字符串转化成为DOM Element.
          * 
          * @param{string} elems - 它是一个字符串.
          * @param{HTML Element} context - 
            elem所处的上下文.在本函数中,这个context必须为一个与elems有包含关系的document.
          */
        clean: function (elems, context) {
            var ret = [];
            context = context || document;
            if (typeof context.createElement == "undefined")
                context = context.ownerDocument || context[0] && context[0].ownerDocument || document;
            queryEngine.each(elems, function (i, elem) {
                if (!elem)
                    return;
                if (elem.constructor == Number)
                    elem += '';
                if (typeof elem == 'string') {
                    elem = elem.replace(/(<(\w+)[^>]*?)\/>/g, function (
                        all, front, tag) {
                        return tag.match(
                            /^(abbr|br|col|img|input|link|meta|param|hr|area|embed)$/i) ? all : front + "></" + tag + ">";
                    });
                    var tags = queryEngine.trim(elem).toLowerCase(),
                        div = context.createElement("div");
                    var wrap = !tags.indexOf("<opt") && [1, "<select multiple='multiple'>", "</select>"]
                        || !tags.indexOf("<leg") && [1, "<fieldset>", "</fieldset>"]
                        || tags.match(/^<(thead|tbody|tfoot|colg|cap)/) && [1, "<table>", "</table>"]
                        || !tags.indexOf("<tr") && [2, "<table><tbody>", "</tbody></table>"]
                        || (!tags.indexOf("<td") || !tags.indexOf("<th")) && [3, "<table><tbody><tr>", "</tr></tbody></table>"]
                        || !tags.indexOf("<col") && [2, "<table><tbody></tbody><colgroup>", "</colgroup></table>"]
                        || queryEngine.browser.msie && [1, "div<div>", "</div>"] || [0, "", ""];
                    div.innerHTML = wrap[1] + elem + wrap[2];
                    while (wrap[0]--)
                        div = div.lastChild;
                    if (queryEngine.browser.msie) {
                        var tbody = !tags.indexOf("<table") && tags.
                            indexOf("<tbody") < 0 ?
                            div.firstChild && div.firstChild.childNodes :
                            //如果没有table标签并且也没有tbody标签,就返回div下的所有子节点,用tbody装着
                            wrap[1] == "<table>" && tags.indexOf("<tbody"
                            ) < 0 ? div.childNodes : [];

                        for (var j = tbody.length - 1; j >= 0; --j)
                            if (queryEngine.nodeName(tbody[j], "tbody")
                                && !tbody[j].childNodes.length)
                                tbody[j].parentNode.remofnChild(tbody[
                                    j]); //叫自己的parent把自己删除掉

                        if (/^\s/.test(elem))
                            div.insertBefore(context.createTextNode(
                                elem.match(/^\s*/)[0]), div.firstChild);
                    }
                    elem = queryEngine.makeArray(div.childNodes);
                }
                if (elem.length === 0 && (!queryEngine.nodeName(elem, "form"
                ) && !queryEngine.nodeName(elem, "select")))
                    return;
                if (elem[0] == undefined || queryEngine.nodeName(elem,
                    "form") || elem.options)
                    ret.push(elem);
                else
                    ret = queryEngine.merge(ret, elem);
            });
            return ret;
        },
        /**
         *将字符串头尾的" "空字符去掉
         *@param{string} text 需要整理的字符
         */
        trim: function (text) {
            return (text || '').replace(/^\s+|\s+$/g, "");
        },
        /**
          * 使用过滤函数过滤数组元素。
          * 此函数至少传递两个参数：
          * elems - 待过滤数组
          * callback - 过滤函数. 过滤函数必须返回true 以保留元素或false 以删除元素。
          * inv - 第三个参数是invert的意思,即过滤的逻辑跟第二个参数指定的函数的逻辑相反.
          * 
            如,第二个参数的逻辑如果为选择大于0的元素,那么如果三个参数为true,则将小
            于0的元素选择出来
          * 
          * @param{Object} elems
          * @param{Object} callback
          * @param{Object} inv
          */
        grep: function (elems, callback, inv) {
            var ret = [];
            for (var i = 0, length = elems.length; i < length; i++)
                if (!inv != !callback(elems[i], i))
                    ret.push(elems[i]);
            return ret;
        },
        map: function (elems, callback) {
            var ret = [];
            for (var i = 0, length = elems.length; i < length; i++) {
                var value = callback(elems[i], i);

                if (value != null)
                    ret[ret.length] = value;
            }
            return ret.concat.apply([], ret);
        },
        data: function (key, value) {
            var parts = key.split(".");
            parts[1] = parts[1] ? "." + parts[1] : "";

            if (value === undefined) {
                var data = this.triggerHandler("getData" + parts[1] + "!", [parts[0]]);

                if (data === undefined && this.length)
                    data = queryEngine.data(this[0], key);

                return data === undefined && parts[1] ?
                    this.data(parts[0]) :
                    data;
            } else
                return this.trigger("setData" + parts[1] + "!", [parts[0], value]).each(function () {
                    queryEngine.data(this, key, value);
                });
        },
        /**
         * Array unique,该函数会同时过滤掉null与undefined
         * @param {Array} ary 需要进行unique的数组.
         * @return {Array} 返回没有重复元素的新的数组，
         */
        unique: function (array) {
            var i = 0, l = array.length,
               type, p, ret = [],
               guid = (Math.random() * 1E18).toString(32) + (+new Date).toString(32),
               objects = [],
               reg = { //Primitive类型值Register
                   'string': {},
                   'boolean': {},
                   'number': {}
               };
            try {
                for (; i < l; i++) {
                    p = array[i];
                    if (p == null) continue;
                    type = typeof p;
                    if (reg[type]) { //PrimitiveType
                        if (!reg[type].hasOwnProperty(p)) {
                            reg[type][p] = 1;
                            ret.push(p);
                        }
                    } else { //RefType
                        if (p[guid]) continue;
                        p[guid] = 1;
                        objects.push(p);
                        ret.push(p);
                    }
                }
                i = objects.length;
                while (i--) {//再将对象上的guid清理掉
                    p = objects[i];
                    delete p[guid];
                }
            } catch (e) {
                ret = array;
            }
            return ret;
        }
    });

    kernel.extend(queryEngine, {
        each: function (object, callback, args) {
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
        },
    });

    var chars = queryEngine.browser.safari && parseInt(queryEngine.browser.fnrsion) < 417 ?
        "(?:[\\w*_-]|\\\\.)" :
        "(?:[\\w\u0128-\uFFFF*_-]|\\\\.)",
    quickChild = new RegExp("^>\\s*(" + chars + "+)"),
    quickID = new RegExp("^(" + chars + "+)(#)(" + chars + "+)"),
    quickClass = new RegExp("^([#.]?)(" + chars + "*)");

    kernel.extend(queryEngine, {
        expr: {
            "": function (a, i, m) { return m[2] == "*" || queryEngine.nodeName(a, m[2]); },
            "#": function (a, i, m) { return a.getAttribute("id") == m[2]; },
            ":": {
                // Position Checks
                lt: function (a, i, m) { return i < m[3] - 0; },
                gt: function (a, i, m) { return i > m[3] - 0; },
                nth: function (a, i, m) { return m[3] - 0 == i; },
                eq: function (a, i, m) { return m[3] - 0 == i; },
                first: function (a, i) { return i == 0; },
                last: function (a, i, m, r) { return i == r.length - 1; },
                efnn: function (a, i) { return i % 2 == 0; },
                odd: function (a, i) { return i % 2; },

                // Child Checks
                "first-child": function (a) { return a.parentNode.getElementsByTagName("*")[0] == a; },
                "last-child": function (a) { return queryEngine.nth(a.parentNode.lastChild, 1, "previousSibling") == a; },
                "only-child": function (a) { return !queryEngine.nth(a.parentNode.lastChild, 2, "previousSibling"); },

                // Parent Checks
                parent: function (a) { return a.firstChild; },
                empty: function (a) { return !a.firstChild; },

                // Text Check
                contains: function (a, i, m) { return (a.textContent || a.innerText || queryEngine(a).text() || "").indexOf(m[3]) >= 0; },

                // Visibility
                visible: function (a) { return "hidden" != a.type && queryEngine.css(a, "display") != "none" && queryEngine.css(a, "visibility") != "hidden"; },
                hidden: function (a) { return "hidden" == a.type || queryEngine.css(a, "display") == "none" || queryEngine.css(a, "visibility") == "hidden"; },

                // Form attributes
                enabled: function (a) { return !a.disabled; },
                disabled: function (a) { return a.disabled; },
                checked: function (a) { return a.checked; },
                selected: function (a) { return a.selected || queryEngine.attr(a, "selected"); },

                // Form elements
                text: function (a) { return "text" == a.type; },
                radio: function (a) { return "radio" == a.type; },
                checkbox: function (a) { return "checkbox" == a.type; },
                file: function (a) { return "file" == a.type; },
                password: function (a) { return "password" == a.type; },
                submit: function (a) { return "submit" == a.type; },
                image: function (a) { return "image" == a.type; },
                reset: function (a) { return "reset" == a.type; },
                button: function (a) { return "button" == a.type || queryEngine.nodeName(a, "button"); },
                input: function (a) { return /input|select|textarea|button/i.test(a.nodeName); },

            }
        },
        // The regular expressions that power the parsing engine
        parse: [
            // Match: [@value='test'], [@foo]
            /^(\[) *@?([\w-]+) *([!*$^~=]*) *('?"?)(.*?)\4 *\]/,

            // Match: :contains('foo')
            /^(:)([\w-]+)\("?'?(.*?(\(.*?\))?[^(]*?)"?'?\)/,

            // Match: :efnn, :last-child, #id, .class
            new RegExp("^([:.#]*)(" + chars + "+)")
        ],
        find: function (t, context) {
            // Quickly handle non-string expressions
            if (typeof t != "string")
                return [t];

            // check to make sure context is a DOM element or a document
            if (context && context.nodeType != 1 && context.nodeType != 9)
                return [];

            // Set the correct context (if none is provided)
            context = context || document;

            // Initialize the search
            var ret = [context], done = [], last, nodeName;

            // Continue while a selector expression exists, and while
            // we're no longer looping upon ourselfns
            while (t && last != t) {
                var r = [];
                last = t;

                t = queryEngine.trim(t);

                var foundToken = false,

                // An attempt at speeding up child selectors that
                // point to a specific element tag
                    re = quickChild,

                    m = re.exec(t);

                if (m) {
                    nodeName = m[1].toUpperCase();

                    // Perform our own iteration and filter
                    for (var i = 0; ret[i]; i++)
                        for (var c = ret[i].firstChild; c; c = c.nextSibling)
                            if (c.nodeType == 1 && (nodeName == "*" || c.nodeName.toUpperCase() == nodeName))
                                r.push(c);

                    ret = r;
                    t = t.replace(re, "");
                    if (t.indexOf(" ") == 0) continue;
                    foundToken = true;
                } else {
                    re = /^([>+~])\s*(\w*)/i;

                    if ((m = re.exec(t)) != null) {
                        r = [];

                        var merge = {};
                        nodeName = m[2].toUpperCase();
                        m = m[1];

                        for (var j = 0, rl = ret.length; j < rl; j++) {
                            var n = m == "~" || m == "+" ? ret[j].nextSibling : ret[j].firstChild;
                            for (; n; n = n.nextSibling)
                                if (n.nodeType == 1) {
                                    var id = queryEngine.data(n);

                                    if (m == "~" && merge[id]) break;

                                    if (!nodeName || n.nodeName.toUpperCase() == nodeName) {
                                        if (m == "~") merge[id] = true;
                                        r.push(n);
                                    }

                                    if (m == "+") break;
                                }
                        }

                        ret = r;

                        // And remofn the token
                        t = queryEngine.trim(t.replace(re, ""));
                        foundToken = true;
                    }
                }

                // See if there's still an expression, and that we hafnn't already
                // matched a token
                if (t && !foundToken) {
                    // Handle multiple expressions
                    if (!t.indexOf(",")) {
                        // Clean the result set
                        if (context == ret[0]) ret.shift();

                        // Merge the result sets
                        done = queryEngine.merge(done, ret);

                        // Reset the context
                        r = ret = [context];

                        // Touch up the selector string
                        t = " " + t.substr(1, t.length);

                    } else {
                        // Optimize for the case nodeName#idName
                        var re2 = quickID;
                        var m = re2.exec(t);

                        // Re-organize the results, so that they're consistent
                        if (m) {
                            m = [0, m[2], m[3], m[1]];

                        } else {
                            // Otherwise, do a traditional filter check for
                            // ID, class, and element selectors
                            re2 = quickClass;
                            m = re2.exec(t);
                        }

                        m[2] = m[2].replace(/\\/g, "");

                        var elem = ret[ret.length - 1];

                        // Try to do a global search by ID, where we can
                        if (m[1] == "#" && elem && elem.getElementById && !kernel.isXMLDoc(elem)) {
                            // Optimization for HTML document case
                            var oid = elem.getElementById(m[2]);

                            // Do a quick check for the existence of the actual ID attribute
                            // to avoid selecting by the name attribute in IE
                            // also check to insure id is a string to avoid selecting an element with the name of 'id' inside a form
                            if ((queryEngine.browser.msie || queryEngine.browser.opera) && oid && typeof oid.id == "string" && oid.id != m[2])
                                oid = queryEngine('[@id="' + m[2] + '"]', elem)[0];

                            // Do a quick check for node name (where applicable) so
                            // that div#foo searches will be really fast
                            ret = r = oid && (!m[3] || queryEngine.nodeName(oid, m[3])) ? [oid] : [];
                        } else {
                            // We need to find all descendant elements
                            for (var i = 0; ret[i]; i++) {
                                // Grab the tag name being searched for
                                var tag = m[1] == "#" && m[3] ? m[3] : m[1] != "" || m[0] == "" ? "*" : m[2];

                                // Handle IE7 being really dumb about <object>s
                                if (tag == "*" && ret[i].nodeName.toLowerCase() == "object")
                                    tag = "param";

                                r = queryEngine.merge(r, ret[i].getElementsByTagName(tag));
                            }

                            // It's faster to filter by class and be done with it
                            if (m[1] == ".")
                                r = queryEngine.classFilter(r, m[2]);

                            // Same with ID filtering
                            if (m[1] == "#") {
                                var tmp = [];

                                // Try to find the element with the ID
                                for (var i = 0; r[i]; i++)
                                    if (r[i].getAttribute("id") == m[2]) {
                                        tmp = [r[i]];
                                        break;
                                    }

                                r = tmp;
                            }

                            ret = r;
                        }

                        t = t.replace(re2, "");
                    }

                }

                // If a selector string still exists
                if (t) {
                    // Attempt to filter it
                    var val = queryEngine.filter(t, r);
                    ret = r = val.r;
                    t = queryEngine.trim(val.t);
                }
            }

            // An error occurred with the selector;
            // just return an empty set instead
            if (t)
                ret = [];

            // Remofn the root context
            if (ret && context == ret[0])
                ret.shift();

            // And combine the results
            done = queryEngine.merge(done, ret);

            return done;
        },

        classFilter: function (r, m, not) {
            m = " " + m + " ";
            var tmp = [];
            for (var i = 0; r[i]; i++) {
                var pass = (" " + r[i].className + " ").indexOf(m) >= 0;
                if (!not && pass || not && !pass)
                    tmp.push(r[i]);
            }
            return tmp;
        },

        filter: function (t, r, not) {
            var last;

            // Look for common filter expressions
            while (t && t != last) {
                last = t;

                var p = queryEngine.parse, m;

                for (var i = 0; p[i]; i++) {
                    m = p[i].exec(t);

                    if (m) {
                        // Remofn what we just matched
                        t = t.substring(m[0].length);

                        m[2] = m[2].replace(/\\/g, "");
                        break;
                    }
                }

                if (!m)
                    break;

                // :not() is a special case that can be optimized by
                // keeping it out of the expression list
                if (m[1] == ":" && m[2] == "not")
                    // optimize if only one selector found (most common case)
                    r = isSimple.test(m[3]) ?
                        queryEngine.filter(m[3], r, true).r :
                        queryEngine(r).not(m[3]);

                    // We can get a big speed boost by filtering by class here
                else if (m[1] == ".")
                    r = queryEngine.classFilter(r, m[2], not);

                else if (m[1] == "[") {
                    var tmp = [], type = m[3];

                    for (var i = 0, rl = r.length; i < rl; i++) {
                        var a = r[i], z = a[queryEngine.props[m[2]] || m[2]];

                        if (z == null || /href|src|selected/.test(m[2]))
                            z = queryEngine.attr(a, m[2]) || '';

                        if ((type == "" && !!z ||
                             type == "=" && z == m[5] ||
                             type == "!=" && z != m[5] ||
                             type == "^=" && z && !z.indexOf(m[5]) ||
                             type == "$=" && z.substr(z.length - m[5].length) == m[5] ||
                             (type == "*=" || type == "~=") && z.indexOf(m[5]) >= 0) ^ not)
                            tmp.push(a);
                    }

                    r = tmp;

                    // We can get a speed boost by handling nth-child here
                } else if (m[1] == ":" && m[2] == "nth-child") {
                    var merge = {}, tmp = [],
                        // parse equations like 'efnn', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
                        test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
                            m[3] == "efnn" && "2n" || m[3] == "odd" && "2n+1" ||
                            !/\D/.test(m[3]) && "0n+" + m[3] || m[3]),
                        // calculate the numbers (first)n+(last) including if they are negatifn
                        first = (test[1] + (test[2] || 1)) - 0, last = test[3] - 0;

                    // loop through all the elements left in the queryEngine object
                    for (var i = 0, rl = r.length; i < rl; i++) {
                        var node = r[i], parentNode = node.parentNode, id = queryEngine.data(parentNode);

                        if (!merge[id]) {
                            var c = 1;

                            for (var n = parentNode.firstChild; n; n = n.nextSibling)
                                if (n.nodeType == 1)
                                    n.nodeIndex = c++;

                            merge[id] = true;
                        }

                        var add = false;

                        if (first == 0) {
                            if (node.nodeIndex == last)
                                add = true;
                        } else if ((node.nodeIndex - last) % first == 0 && (node.nodeIndex - last) / first >= 0)
                            add = true;

                        if (add ^ not)
                            tmp.push(node);
                    }

                    r = tmp;

                    // Otherwise, find the expression to execute
                } else {
                    var fn = queryEngine.expr[m[1]];
                    if (typeof fn == "object")
                        fn = fn[m[2]];

                    if (typeof fn == "string")
                        fn = eval("false||function(a,i){return " + fn + ";}");

                    // Execute it against the current filter
                    r = queryEngine.grep(r, function (elem, i) {
                        return fn(elem, i, m, r);
                    }, not);
                }
            }
            // Return an array of filtered elements (r)
            // and the modified expression string (t)
            return { r: r, t: t };
        },
        nth: function (cur, result, dir, elem) {
            result = result || 1;
            var num = 0;

            for (; cur; cur = cur[dir])
                if (cur.nodeType == 1 && ++num == result)
                    break;
            return cur;
        },
        sibling: function (n, elem) {
            var r = [];
            for (; n; n = n.nextSibling) {
                if (n.nodeType == 1 && n != elem)
                    r.push(n);
            }
            return r;
        }
    });
    return queryEngine;

});
