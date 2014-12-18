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
 * Created by Louis Y P Chen on 2014/12/17.
 */
(function(win){

    var boot  = ["../bl.js"],

        standardBoot = boot,

        testCases = ["tests/cases"],

        useDebugger = false,

        async = true;

    //This is a temporary function to  handler the diff event across the browsers
    //The event control will be moved to be an individual module
    var domOn = function (node, eventName, ieEventName, handler){
        // Add an event listener to a DOM node using the API appropriate for the current browser;
        // return a function that will disconnect the listener.
        if(win.addEventListener){
            node.addEventListener(eventName, handler, false);
            return function(){
                node.removeEventListener(eventName, handler, false);
            }

        }else{
            node.attachEvent(ieEventName, handler);
            return function(){
                node.detachEvent(ieEventName, handler);
            }
        }
    };


    var config = {

        pkgs : [
            {
                name : "bn",
                path : "bn"
            }
        ],

        async : async,

        debug : true
    };


    function injectOnLoad(event, a1, a2, a3){
        event = event||window.event;
        var node = event.target||event.srcElement;
        if(event.type === "load" || /complete|loaded/.test(node.readyState)){
            a1 && a1();
            a2 && a2();
            a3 && a3();
        }
    }

    function inject(url, cb, parentNode){
        if(!url) return;
        var node = document.createElement("script");
        var loadHandler = domOn(node, "load", "onreadystatechange", function(e){
            injectOnLoad(e, loadHandler, errorHandler, cb);
        });
        var errorHandler = domOn(node, "error", "onerror", function(e){
            injectOnLoad(e, loadHandler, errorHandler, function(){
                throw new Error("Inject script error from : " + url);
            });
        });
        node.type = "text/javascript";
        node.charset = "utf-8";
        node.src = url;
        parentNode.appendChild(node);
    }

    win.BLCfg = config;

    var recursiveGuard = 0, end = boot.length;


    /**
     *
     * @param doh
     */
    function runTestCases(doh){
        doh.breakOnError= useDebugger;
        $.use(testCases, function(){
            doh.run();
        });
    }

    function callback(){
        ++recursiveGuard;
        if(recursiveGuard == end){
            $.use(["bl/dom/ready", "bn"], function(ready, doh){
                ready(function(){
                    runTestCases(doh);
                });
            });
            recursiveGuard = 0;
        }
    }
    var head = document.getElementsByTagName("head")[0];
    // now script inject any boots
    for(var i = 0; i < end; i++) {
        inject(boot[i], callback, head);
    }
})(window);