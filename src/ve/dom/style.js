/*
     DOM样式方法
     引用: 基于jquery 1.2.6 部分代码 
     及一些修正整理
*/

(function () {

    if (typeof window.ve === "undefined") {
        window.ve = {};
    }

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
  
    function grep (elems, callback, inv) {
        var ret = [];
        for (var i = 0, length = elems.length; i < length; i++)
            if (!inv != !callback(elems[i], i))
                ret.push(elems[i]);
        return ret;
    }

    var privateObj = {
        each: function (callback, args) {
            this.length = 1;
            return each(this, callback, args);
        },
        className: {
            add: function (elem, classNames) {
                each((classNames || "").split(/\s+/), function (i, className) {
                    if (elem.nodeType == 1 && !privateObj.className.has(elem.className, className))
                        elem.className += (elem.className ? " " : "") + className;
                });
            },
            remove: function (elem, classNames) {
                if (elem.nodeType == 1)
                    elem.className = classNames != undefined ?
                        grep(elem.className.split(/\s+/), function (className) {
                            return !privateObj.className.has(classNames, className);
                        }).join(" ") :"";
            },
            has: function (elem, className) {
                return this.inArray(className, (elem.className || elem).toString().split(/\s+/)) > -1;
            },
            inArray: function (elem, array) {
                for (var i = 0, length = array.length; i < length; i++)
                    // Use === because on IE, window == document
                    if (array[i] === elem)
                        return i;
                return -1;
            }
        },
        event: {}
    };
    ve.style= {
        Class: {
            
        }
    }
    each({
        add: function(obj,classNames) {
            privateObj.className.add(obj,classNames);
        },
        remove: function(obj,classNames) {
                privateObj.className.remove(obj,classNames);
            }
        },
        function (name, fn) {
            ve.style.Class[name] = function() {
                return privateObj.each(fn, arguments);
            };
        }
    );

})();





