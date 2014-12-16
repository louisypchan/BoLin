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
 * Created by Louis Y P Chen on 2014/11/6.
 */
$.add("ve/core/deferred", ["ve/core/declare", "ve/core/base", "ve/core/kernel"], function(declare, base, kernel){

    return declare({
        "~name" : "$.core.Deferred",
        "~superclass" : base,
        "~synthesize" : ["canceler", "listener", "waiting"],
        "+STATE" : {
            PROGRESS : "progress",
            RESOLVED : "resolved",
            REJECTED : "rejected"
        },

        ctor : function(canceler){
            this._super();
            this.promise = this;
            this.canceler = canceler;
            //To be removed if IE7 and IE8 are not in the supportive list
            kernel.watcher.notify("canceler", this);
            this.fulfilled = false;
            this.promise.then = this.then;
            this.canceled = false;
            this._waiting = [];
        },

        isResolved : function(){
            return this.fulfilled === $.core.Deferred.STATE.RESOLVED;
        },
        isRejected : function(){
            return this.fulfilled === $.core.Deferred.STATE.REJECTED;
        },
        isFulfilled : function(){
            return !!this.fulfilled;
        },
        isCanceled : function(){
            return this.canceled;
        },
        /**
         * Resolve the deferred, putting it in a success state.
         * @param value
         *      The result of the deferred. Passed to resvoledCallBack.
         * @returns {promise}
         *      Returns the original promise for the deferred.
         */
        resolve : function(value){
            if(!this.fulfilled){
                this.fulfilled = $.core.Deferred.STATE.RESOLVED;
                this.waiting = [this._waiting, this.fulfilled, value];
                //To be removed if IE7 and IE8 are not in the supportive list
                kernel.watcher.notify("waiting", this);
                this._waiting = null;
            }
            return this.promise;
        },
        /**
         * Reject the deferred, putting it in an error state.
         * @returns {promise}
         */
        reject : function(){
            if(!this.fulfilled){
                this.fulfilled = $.core.Deferred.STATE.REJECTED;
                this.waiting = [this._waiting, this.fulfilled, value];
                //To be removed if IE7 and IE8 are not in the supportive list
                kernel.watcher.notify("waiting", this);
                this._waiting = null;
            }
            return this.promise;
        },
        /**
         * Add new callbacks to the deferred. Callbacks can be added
         * before or after the deferred is fulfilled.
         */
        then : function(resolvedCallback, rejectedCallback, progressCallback){
            var promise = {};
            promise[$.core.Deferred.STATE.PROGRESS] = progressCallback;
            promise[$.core.Deferred.STATE.RESOLVED] = resolvedCallback;
            promise[$.core.Deferred.STATE.REJECTED] = rejectedCallback;

            promise.cancel = this.promise.cancel;
            promise.deferred = new $.core.Deferred(function(reason){
                return promise.canel && promise.cancel(reason);
            });
            if(this.fulfilled && !this.waiting){
                this.listener = [promise, this.fulfilled, result];
                //To be removed if IE7 and IE8 are not in the supportive list
                kernel.watcher.notify("listener", this);
            }else{
                this._waiting.push(promise);
            }
            return promise.deferred.promise;
        },
        /**
         * Emit a progress update on the deferred.
         * @param update
         */
        progress : function(update){
            if(!this.fulfilled){
                this.fulfilled = $.core.Deferred.STATE.PROGRESS;
                this.waiting = [this._waiting, this.fulfilled, update];
                //To be removed if IE7 and IE8 are not in the supportive list
                kernel.watcher.notify("waiting", this);
            }
            return this.promise;
        },

        "-setCanceler" : function(canceler){
            this._canceler = canceler;
            this.promise.cancel = this.cancel = function(reason){
                if(!this.fulfilled){
                    if(!this._canceler){
                        var returnedReason = this._canceler(reason);
                        reason = returnedReason || reason;
                    }
                    this.canceled = true;
                }
                return reason;
            };
        },
        "-getCanceler" : function(){
            return this._canceler;
        },

        "-mkHandler" : function(deferred, type){
            return (function(context){
                return function(value){
                    context.handle(deferred, type, value);
                }
            })(this);
        },

        "-setListener" : function(args){
            var promise = args[0], type = args[1], result = args[2],
                func = promise[type], deferred = promise.deferred;
            if(func){
                try{
                    var newResult = func(result);
                    if(type == $.core.Deferred.STATE.PROGRESS){
                        if(typeof newResult!== "undefined"){
                            promise.cancel = newResult.cancel;
                            newResult.then(this.mkHandler(deferred,$.core.Deferred.STATE.RESOLVED),
                            this.mkHandler(deferred, $.core.Deferred.STATE.REJECTED),
                            this.mkHandler(deferred, $.core.Deferred.STATE.PROGRESS));
                            return;
                        }
                    }else{
                        if(newResult && kernel.isFunction(newResult.then)){

                        }
                        this.handle(deferred, $.core.Deferred.STATE.RESOLVED, newResult);
                    }
                }catch(e){
                    this.handle(deferred, $.core.Deferred.STATE.REJECTED, e);
                }
            }else{
                this.handle(deferred, type, result);
            }
        },
        "-setWaiting" : function(args){
            var waiting = args[0], type = args[1], result = args[2];
            for(var i = 0; i < waiting.length; i++){
                this.listener = [waiting[i], type, result];
                //To be removed if IE7 and IE8 are not in the supportive list
                kernel.watcher.notify("listener", this);
            }
        },

        "-handle" : function(deferred, type, result){
            if(!deferred.isCanceled()){
                switch (type){
                    case $.core.Deferred.STATE.PROGRESS :
                        deferred.progress(result);
                        break;
                    case $.core.Deferred.STATE.RESOLVED :
                        deferred.resolve(result);
                        break;
                    case $.core.Deferred.STATE.REJECTED :
                        deferred.reject(result);
                        break;
                }
            }
        },

        "-toString" : function(){
            return "[object Deferred]";
        }
    });
});