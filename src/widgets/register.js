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
 * Created by Louis Y P Chen on 2014/12/22.
 */

$.add("bl/widgets/register", [], function(){
    var widgets = {}, id = 0;

    return {

        length : 0, //Number of registered widgets

        /**
         * Add a widget into storage
         * @param widget
         */
        add : function(widget){
            if(!widgets[widget.id]){
                widgets[widget.id] = widget;
                this.length++;
            }
        },

        /**
         * remove a widget
         * @param widget
         */
        remove : function(widget){
            if(widgets[widget.id]){
                delete widgets[widget.id];
                this.length--;
            }
        },

        getWidget : function(id){
            return typeof id == "string" ? widgets[id] : id;
        },

        removeAll : function(){
            this.length = 0;
            widgets.length = 0;
        },

        getUniqueId : function(widgetName){
            return widgetName + "_" + (id++);
        }
    };
});