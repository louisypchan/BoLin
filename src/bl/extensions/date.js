/****************************************************************************
 Copyright (c) 2014 Louis Y P Chen .

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
 * Created by Louis Y P Chen on 2014/10/23.
 */
$.add("bl/extensions/date", ["bl/core/kernel"], function(kernel){
    var dp = Date.prototype,
        days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    kernel.extend(dp, {
        /**
         * Format the date
         * @param pattern
         */
        format : dp.format ||function(pattern){

        },
        /**
         *
         */
        parse : dp.parse || function(){

        },
        /**
         * Compare two date objects by date, time, or both.
         * section :
         *      A string indicating the "date" or "time" section of a Date object.
         *      Compares both "date" and "time" by default.  One of the following:
         *      "date", "time"
         *      @Return
         *      1  - longer
         *      0  - same
         *      -1 - shorter
         */
        compare : dp.compare || function(date, section){
            var date1 = new Date(+this); //convert to time
            var date2 = new Date(+(date || new Date()));
            if(section == "date"){
                date1.setHours(0,0,0,0);
                date2.setHours(0,0,0,0);
            }
            if(section == "time"){
                date1.setFullYear(0,0,0);
                date2.setFullYear(0,0,0);
            }
            return date1 > date2 ? 1 : date1 < date2 ? -1 : 0;
        },
        /**
         * Add to a Date in intervals of different size, from milliseconds to years
         */
        add : dp.add || function(interval, amount){

        },
        /**
         *  Get the difference in a specific unit of time (e.g., number of
         *  months, weeks, days, etc.) between two dates, rounded to the
         *  nearest integer.
         */
        diff : dp.diff || function(interval){

        },
        /**
         * Get the user's time zone as provided by the browser
         */
        timeZoneName : dp.getTimezoneName || function(){
            var str = this.toString(), tz = "", match;
            var pos = str.indexOf("(");
            if(pos > -1){
                tz = str.substring(++pos, str.indexOf(")"));
            }else{
                // If at first you don't succeed ...
                // If IE knows about the TZ, it appears before the year
                // Capital letters or slash before a 4-digit year
                // at the end of string
                var pat = /([A-Z\/]+) \d{4}$/;
                if((match = str.match(pat))){
                    tz = match[1];
                }else{
                    // Some browsers (e.g. Safari) glue the TZ on the end
                    // of toLocaleString instead of putting it in toString
                    str = this.toLocaleString();
                    // Capital letters or slash -- end of string,
                    // after space
                    pat = / ([A-Z\/]+)$/;
                    if((match = str.match(pat))){
                        tz = match[1];
                    }
                }
            }
            // Make sure it doesn't somehow end up return AM or PM
            return (tz == 'AM' || tz == 'PM') ? '' : tz;
        },
        /**
         * Returns the number of days in the month
         */
        getDaysInMonth : dp.getDaysInMonth || function(){
            var month = this.getMonth();
            if(month == 1 && this.isLeapYear()){
                //Feb
                return 29;
            }
            return days[month];
        },
        /**
         * Determines if the year of the dateObject is a leap year
         */
        isLeapYear : dp.isLeapYear || function(){
            var year = this.getFullYear();
            return !(year % 400) || (!(year%4) && !!(year%100));
        },

        // ES5 15.9.4.4 Date.now ( )
        // From https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Date/now
        now : dp.now || function(){
            return +(new Date());
        },
        // ES5 15.9.4.43 Date.prototype.toISOString ( )
        // Inspired by http://www.json.org/json2.js
        toISOString : dp.toISOString || function(){
            return this.getUTCFullYear() + '-' +
                kernel.pad(this.getUTCMonth() + 1, 2) + '-' +
                kernel.pad(this.getUTCDate(), 2) + 'T' +
                kernel.pad(this.getUTCHours(), 2) + ':' +
                kernel.pad(this.getUTCMinutes(), 2) + ':' +
                kernel.pad(this.getUTCSeconds(), 2) + '.' +
                kernel.pad(this.getUTCMilliseconds(), 3) + 'Z';
        }
    });
});