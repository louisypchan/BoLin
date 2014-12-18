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
 * Created by Louis Y P Chen on 2014/10/31.
 *
 * An extension to window.event
 *
 */
$.add("bl/event/event", ["bl/core/kernel", "bl/extensions/date"], function(kernel){
    "use strict";

    var hasStopimmediatepropagation = $.global.Event && !!$.global.Event.prototype && !!$.global.Event.prototype.stopImmediatePropagation,
        lastEvent = {},
        _event =  function(event){
        var me = this, e, t;
        if(typeof event == "object" && event.type){
            me.originalEvent = e = event;
            for(var name in e){
                if(!kernel.isFunction){
                    me[name] = e[name];
                }

                if(e.extraData){
                    kernel.extend(me, e.extraData);
                }

                me.target = me.srcElement = e.srcElement || (( t = e.target ) && ( t.nodeType == 3 ? t.parentNode : t ));

                me.relatedTarget = e.relatedTarget || (( t = e.fromElement ) && ( t === me.target ? e.toElement : t ));
                me.keyCode = me.which = e.keyCode || e.which;

                //
                if(me.type == "keypress"){
                    var c = ("charCode" in e ? e.charCode : e.keyCode);
                    if(c == 10){
                        // CTRL-ENTER is CTRL-ASCII(10) on IE, but CTRL-ENTER on Mozilla
                        c = 0;
                        me.keyCode = 13;
                    }else if(c == 13 || c == 27){
                        // Mozilla considers ENTER and ESC non-printable
                        c = 0;
                    }else if(c == 3){
                        // Mozilla maps CTRL-BREAK to CTRL-c
                        c = 99;
                    }
                    //is it neccessary???
                    me.charCode = c;
                    me.keyChar = me.charCode ? String.fromCharCode(me.charCode) : '';
                }
                // Add which for mouseclick: 1 === left; 2 === middle; 3 === right
                if(!me.which && e.button !== undefined){
                    me.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) );
                }

                var doc = $.doc.documentElement, body = $.doc.body;

                me.pageX = e.pageX || (e.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0));

                me.pageY = e.pageY || (e.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0));

                //TODO: add touch events
            }
        }

        me.timeStamp = new Date().now();
        me.__type__ = "@VE_EVENT";
    };

    kernel.extend(_event.prototype, {
        stopPropagation : function(){
            var e = this.originalEvent;
            this.cancelBubble = e.cancelBubble = true;
        },
        preventDefault : function(){
            var e = this.originalEvent;
            this.bubbledKeyCode = this.keyCode;
            if(e.ctrlKey){
                try{
                    this.keyCode = e.keyCode = 0;
                }catch (e){}
            }
            this.defaultPrevented = e.defaultPrevented = true;
            this.returnValue = e.returnValue = false;

        },
        stopImmediatePropagation : function () {
            this.immediatelyStopped = true;
        }
    });

    return function(event){
        // should be same event, reuse event object (so it can be augmented);
        if(event["__type__"] === "@VE_EVENT") return event;
        return lastEvent && lastEvent.originalEvent === event ? lastEvent : new _event(event);
    };
});