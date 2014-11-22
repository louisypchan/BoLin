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
 * Created by Louis Y P Chen on 2014/11/4.
 */
$.add(["ve/event/event", "ve/core/kernel", "ve/core/aspect"], function(Event, kernel, aspect){

    var jscript = 11; //IE 8

    if($.global.ScriptEngineMinorVersion){
        jscript = $.global.ScriptEngineMinorVersion() + $.global.ScriptEngineMinorVersion()/10;
    }

    //
    var div = $.doc.createElement("div"),
        hasEventFocusin = 'onfocusin' in div,
        captures = hasEventFocusin ? {} : { focusin: "focus", focusout: "blur" },
        slice = [].slice,
        IESignal = function(handle){
            this.handle = handle;
        },
        //open interface
        on = function(target, type, listener){
            return on.add(target, type, listener);
        };

    IESignal.prototype.remove = function(){
        delete _IEListeners_[this.handle];
    };

    //solution refer to DOJO/ON
    function fixAttach(target, type, listener){
        if(((target.ownerDocument ? target.ownerDocument.parentWindow : target.parentWindow || target.window || window) != top) ||
            jscript < 5.8){
            // IE will leak memory on certain handlers in frames (IE8 and earlier) and in unattached DOM nodes for JScript 5.7 and below.
            // Here we use global redirection to solve the memory leaks
            if(typeof _IEListeners_ == "undefined"){
                _IEListeners_ = [];
            }
            var emitter = target[type];
            if(!emitter || !emitter.listeners){
                var oldListener = emitter;
                emitter = Function('event', 'event = Event(event); var callee = arguments.callee; for(var i = 0; i < callee.listeners.length; i++){ var listener =  _IEListeners_[callee.listeners[i]]; if(listener){ listeners.call(this, event);}}');
                emitter.listeners = [];
                target[type] = emitter;
                emitter.global = this;
                if(oldListener){
                    emitter.listeners.push(_IEListeners_.push(oldListener) - 1);
                }
            }
            var handle;
            emitter.listeners.push(handle = (emitter.global._IEListeners_.push(listener) - 1));
            return IESignal(handle);
        }
        return aspect.after(target, type, listener);
    }

    var proxy = {
        add : function(target, type, listener){
            if(!kernel.isFunction(type) && kernel.isFunction(target.on) && !target.nodeType){
                return target.on(type, listener);
            }
            //if addEventListener is available
            if(target.addEventListener){
                //check for capture conversions
                var capture = type in captures,
                    adjustedType = capture ? captures[type] : type;

                target.addEventListener(adjustedType, listener, capture);
                //create and return the remove handler
                return {
                    remove : function(){
                        target.removeEventListener(adjustedType, listener, capture);
                    }
                };
            }
            //otherwise
            type = "on" + type;
            if(fixAttach && target.attachEvent){
                return fixAttach(target, type, listener);
            }
            throw new Error("Target must be an event emitter");
        }
    };
    /**
     *
     * @param target
     * @param type
     * @param listener
     */
    var _add = function(target, type, listener){
        var events = false;


        if(kernel.isArray(type)){
            //allow an array of event names
            events = type;
        }else if(kernel.isString(type) && type.indexOf(",") > -1){
            //allow "|" delimited event names, so you can register for multiple events
            events = type.split(/\s*\|\s*/);
        }
        if(events){
            var handlers = [], i = 0, eventName;
            while(eventName = events[i++]){
                handlers.push(on.add(target, eventName, listener));
            }
            handlers.remove = function(){
                for(var i = 0; i < handlers.length; i++){
                    handlers[i].remove();
                }
            };

            return handlers;
        }
        return proxy.add(target, type, listener);
    };

    /**
     * Add event(s) to a target
     * @param target
     * @param type
     * @param listener
     */
    on.add = function(target, type, listener){
        return _add(target, type, function(evt){
            evt = Event(evt || ve.global.event);
            listener(evt);
        });
    };

    /**
     * only trigger once
     * @param target
     * @param type
     * @param listener
     * @returns {*}
     */
    on.once = function(target, type, listener){
        var handle = on.add(target, type, function(){
            handle.remove();
            return listener.apply(this, arguments);
        });
        return handle;
    };
    /**
     * Fires an event on the target object.
     * @param target
     *          The target object to fire the event on. This can be a DOM element or a plain object
     * @param type
     *          The event type name
     * @param eventprops
     *          An object that provides the properties for the event.
     *          See https://developer.mozilla.org/en/DOM/event.initEvent
     */
    on.trigger = on. emit = function(target, type, eventprops){
        if(target.dispatchEvent && $.doc.createEvent){
            var ownerDocument = target.ownerDocument || $.doc;
            var nativeEvent = ownerDocument.createEvent("HTMLEvents");
            nativeEvent.initEvent(type, !!eventprops.bubbles, !!eventprops.cancelable);
            // and copy all our properties over
            for(var i in eventprops){
                if(!(i in nativeEvent)){
                    nativeEvent[i] = eventprops[i];
                }
            }
            return nativeEvent && target.dispatchEvent(nativeEvent);
        }
        var event = "on" + type;
        if("parentNode" in target){
            var newEventProps = {};
            kernel.extend(newEventProps, eventprops);
            newEventProps.preventDefault = function(){
                this.cancelable = false;
                this.defaultPrevented = true;
            };
            newEventProps.stopPropagation = function(){
                this.bubbles = false;
            };
            newEventProps.target = target;
            newEventProps.type = type;
            eventprops = newEventProps;
        }
        do{
            target[event] && target[event].call(target);
        }while(eventprops && eventprops.bubbles && (target = target.parentNode));
        // if it is still true (was cancelable and was cancelled), return the event to indicate default action should happen
        return eventprops && eventprops.cancelable;
    };

    /**
     * This function acts the same as on(), but with pausable functionality.
     * @param target
     * @param type
     * @param listener
     */
    on.pausable = function(target, type, listener){

    };
    return on;
});