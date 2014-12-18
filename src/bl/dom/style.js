/****************************************************************************
 Copyright (c) 2014 chenchangwen
 http://www.bl.cn
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

$.add("bl/dom/style",["bl/core/kernel","bl/extensions/array"], function(kernel) {
    var curCSS, getStyles, rposition = /^(top|right|bottom|left)$/,
        rmargin = (/^margin/),
        pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source,
        rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i"),
        rrelNum = new RegExp( "^([+-])=(" + pnum + ")", "i" ),
        cssNormalTransform = {
            letterSpacing: "0",
            fontWeight: "400"
        },
        rdisplayswap = /^(none|table(?!-c[ea]).+)/,
        rnumsplit = new RegExp( "^(" + pnum + ")(.*)$", "i" ),
        cssShow = { position: "absolute", visibility: "hidden", display: "block" },
        ropacity = /opacity\s*=\s*([^)]*)/,
        cssExpand = [ "Top", "Right", "Bottom", "Left" ],
        ralpha = /alpha\([^)]*\)/i,
        cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];
    // return a css property mapped to a potentially vendor prefixed property
    function vendorPropName( style, name ) {
        // shortcut for names that are not vendor prefixed
        if ( name in style ) {
            return name;
        }
        // check for vendor prefixed names
        var capName = name.charAt(0).toUpperCase() + name.slice(1),
            origName = name,
            i = cssPrefixes.length;

        while ( i-- ) {
            name = cssPrefixes[ i ] + capName;
            if ( name in style ) {
                return name;
            }
        }
        return origName;
    }
    // A method for quickly swapping in/out CSS properties to get correct calculations.
    function swap( elem, options, callback, args ) {
        var ret, name,old = {};
        // Remember the old values, and insert the new ones
        for ( name in options ) {
            old[ name ] = elem.style[ name ];
            elem.style[ name ] = options[ name ];
        }
        ret = callback.apply( elem, args || [] );
        // Revert the old values
        for ( name in options ) {
            elem.style[ name ] = old[ name ];
        }
        return ret;
    }
    function getWidthOrHeight( elem, name, extra ) {
        // Start with offset property, which is equivalent to the border-box value
        var valueIsBorderBox = true,
            val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
            styles = getStyles( elem ),
            isBorderBox = $.support.boxSizing && css.get( elem, "boxSizing", false, styles ) === "border-box";
        // some non-html elements return undefined for offsetWidth, so check for null/undefined
        // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
        // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
        if ( val <= 0 || val == null ) {
            // Fall back to computed then uncomputed css if necessary
            val = curCSS( elem, name, styles );
            if ( val < 0 || val == null ) {
                val = elem.style[ name ];
            }
            // Computed unit is not pixels. Stop here and return.
            if ( rnumnonpx.test(val) ) {
                return val;
            }
            // we need the check for style in case a browser which returns unreliable values
            // for getComputedStyle silently falls back to the reliable elem.style
            valueIsBorderBox = isBorderBox && ( $.support.boxSizingReliable() || val === elem.style[ name ] );
            // Normalize "", auto, and prepare for extra
            val = parseFloat( val ) || 0;
        }
        // use the active box-sizing model to add/subtract irrelevant styles
        return ( val +
            augmentWidthOrHeight(
                elem,
                name,
                    extra || ( isBorderBox ? "border" : "content" ),
                valueIsBorderBox,
                styles
            )
            ) + "px";
    }

    function augmentWidthOrHeight(elem, name, extra, isBorderBox, styles){
        var i = extra === ( isBorderBox ? "border" : "content" ) ?
            // If we already have the right measurement, avoid augmentation
            4 :
            // Otherwise initialize for horizontal or vertical properties
            name === "width" ? 1 : 0, val = 0;
        for ( ; i < 4; i += 2 ) {
            // both box models exclude margin, so add it if we want it
            if ( extra === "margin" ) {
                val += css.get( elem, extra + cssExpand[ i ], true, styles );
            }
            if ( isBorderBox ) {
                // border-box includes padding, so remove it if we want content
                if ( extra === "content" ) {
                    val -= css.get( elem, "padding" + cssExpand[ i ], true, styles );
                }
                // at this point, extra isn't border nor margin, so remove border
                if ( extra !== "margin" ) {
                    val -= css.get( elem, "border" + cssExpand[ i ] + "Width", true, styles );
                }
            } else {
                // at this point, extra isn't content, so add padding
                val += css.get( elem, "padding" + cssExpand[ i ], true, styles );
                // at this point, extra isn't content nor padding, so add border
                if ( extra !== "padding" ) {
                    val += css.get( elem, "border" + cssExpand[ i ] + "Width", true, styles );
                }
            }
        }
        return val;
    }
    function setPositiveNumber(elem, value, subtract ) {
        var matches = rnumsplit.exec( value );
        return matches ?
            // Guard against undefined "subtract", e.g., when used as in cssHooks
            Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
            value;
    }
    function addGetHookIf( conditionFn, hookFn ) {
        // Define the hook, we'll check on the first run if it's really needed.
        return {
            get: function() {
                var condition = conditionFn();
                if ( condition == null ) {
                    // The test was not ready at this point; screw the hook this time
                    // but check again when needed next time.
                    return;
                }
                if ( condition ) {
                    // Hook not needed (or it's not possible to use it due to missing dependency),
                    // remove it.
                    // Since there are no other hooks for marginRight, remove the whole object.
                    delete this.get;
                    return;
                }
                // Hook needed; redefine it so that the support test is not executed again.
                return (this.get = hookFn).apply( this, arguments );
            }
        };
    }

    var css = {
        // Add in style property hooks for overriding the default
        // behavior of getting and setting a style property
        // Don't automatically add "px" to these possibly-unitless properties
        cssNumber: {
            "columnCount": true,
            "fillOpacity": true,
            "flexGrow": true,
            "flexShrink": true,
            "fontWeight": true,
            "lineHeight": true,
            "opacity": true,
            "order": true,
            "orphans": true,
            "widows": true,
            "zIndex": true,
            "zoom": true
        },
        // Add in properties whose names you wish to fix before
        // setting or getting the value
        cssHooks : {
            opacity: {
                get: function( elem, computed ) {
                    if ( computed ) {
                        // We should always get a number back from opacity
                        var ret = curCSS( elem, "opacity" );
                        return ret === "" ? "1" : ret;
                    }
                }
            }
        },
        cssProps: {
            // normalize float css property
            "float": $.support.cssFloat ? "cssFloat" : "styleFloat"
        },
        // Get and set the style property on a DOM Node
        style: function( elem, name, value, extra ) {
            // Don't set styles on text and comment nodes
            if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
                return;
            }
            // Make sure that we're working with the right name
            var ret, type, hooks, origName = kernel.camelCase( name ),style = elem.style;
            name = css.cssProps[ origName ] || ( css.cssProps[ origName ] = vendorPropName( style, origName ) );
            // gets hook for the prefixed version
            // followed by the unprefixed version
            hooks = css.cssHooks[ name ] || css.cssHooks[ origName ];
            // Check if we're setting a value
            if ( value !== undefined ) {
                type = typeof value;
                // convert relative number strings (+= or -=) to relative numbers.
                if ( type === "string" && (ret = rrelNum.exec( value )) ) {
                    value = ( ret[1] + 1 ) * ret[2] + parseFloat( css.get( elem, name ) );
                    type = "number";
                }
                // Make sure that null and NaN values aren't set.
                if ( value == null || value !== value ) {
                    return;
                }
                // If a number was passed in, add 'px' to the (except for certain CSS properties)
                if ( type === "number" && !css.cssNumber[ origName ] ) {
                    value += "px";
                }
                //it can be done more correctly by specifing setters in cssHooks,
                // but it would mean to define eight (for every problematic property) identical functions
                if ( !$.support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
                    style[ name ] = "inherit";
                }
                // If a hook was provided, use that value, otherwise just set the specified value
                if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
                    // Support: IE
                    // Swallow errors from 'invalid' CSS values
                    try {
                        style[ name ] = value;
                    } catch(e) {}
                }
            }else{
                // If a hook was provided get the non-computed value from there
                if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
                    return ret;
                }
                // Otherwise just get the value from the style object
                return style[ name ];
            }
        },
        get : function(elem, name, extra, styles){
            var num, val, hooks, origName = kernel.camelCase( name );
            // Make sure that we're working with the right name
            name = css.cssProps[ origName ] || ( css.cssProps[ origName ] = vendorPropName( elem.style, origName ) );
            // gets hook for the prefixed version
            // followed by the unprefixed version
            hooks = css.cssHooks[ name ] || css.cssHooks[ origName ];
            // If a hook was provided get the computed value from there
            if ( hooks && "get" in hooks ) {
                val = hooks.get( elem, true, extra );
            }
            // Otherwise, if a way to get the computed value exists, use that
            if ( val === undefined ) {
                val = curCSS( elem, name, styles );
            }
            //convert "normal" to computed value
            if ( val === "normal" && name in cssNormalTransform ) {
                val = cssNormalTransform[ name ];
            }
            // Return, converting to number if forced or a qualifier was provided and val looks numeric
            if ( extra === "" || extra ) {
                num = parseFloat( val );
                return extra === true || kernel.isNumber( num ) ? num || 0 : val;
            }
            return val;
        },
        css : function(hook, elem, name, extra, styles){
            var num, val, hooks, origName = kernel.camelCase( name );
            // Make sure that we're working with the right name
            name = css.cssProps[ origName ] || ( css.cssProps[ origName ] = vendorPropName( elem.style, origName ) );
            // gets hook for the prefixed version
            // followed by the unprefixed version
            hooks = hook || css.cssHooks[ name ] || css.cssHooks[ origName ];
            // If a hook was provided get the computed value from there
            if ( hooks && "get" in hooks ) {
                val = hooks.get( elem, true, extra );
            }
            // Otherwise, if a way to get the computed value exists, use that
            if ( val === undefined ) {
                val = curCSS( elem, name, styles );
            }
            //convert "normal" to computed value
            if ( val === "normal" && name in cssNormalTransform ) {
                val = cssNormalTransform[ name ];
            }
            // Return, converting to number if forced or a qualifier was provided and val looks numeric
            if ( extra === "" || extra ) {
                num = parseFloat( val );
                return extra === true || kernel.isNumeric( num ) ? num || 0 : val;
            }
            return val;
        }
    };

    ["width", "height"].forEach(function(name){
        css.cssHooks[name] = {
            get: function( elem, computed, extra ) {
                if ( computed ) {
                    // certain elements can have dimension info if we invisibly show them
                    // however, it must have a current display style that would benefit from this
                    return rdisplayswap.test( css.get( elem, "display" ) ) && elem.offsetWidth === 0 ?
                        swap(elem, cssShow, function() {
                            return getWidthOrHeight( elem, name, extra );
                        }) : getWidthOrHeight( elem, name, extra );
                }
            },
            set: function( elem, value, extra ) {
                var styles = extra && getStyles( elem );
                return setPositiveNumber( elem, value, extra ?
                    augmentWidthOrHeight(elem, name, extra, $.support.boxSizing && css.get( elem, "boxSizing", false, styles ) === "border-box", styles)
                    : 0);
            }
        };
    });

    if ($.global.getComputedStyle ) {
        getStyles = function( elem ) {
            return elem.ownerDocument.defaultView.getComputedStyle( elem, null );
        };
        curCSS = function( elem, name, computed ) {
            var width, minWidth, maxWidth, ret, style = elem.style;
            computed = computed || getStyles( elem );

            // getPropertyValue is only needed for .css('filter')
            ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined;
            if ( computed ) {
                if ( ret === "" && !kernel.contains( elem.ownerDocument, elem ) ) {
                    ret = css.style( elem, name );
                }
                // A tribute to the "awesome hack by Dean Edwards"
                // Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
                // Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
                // this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
                if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {
                    // Remember the original values
                    width = style.width;
                    minWidth = style.minWidth;
                    maxWidth = style.maxWidth;
                    // Put in the new values to get a computed value out
                    style.minWidth = style.maxWidth = style.width = ret;
                    ret = computed.width;
                    // Revert the changed values
                    style.width = width;
                    style.minWidth = minWidth;
                    style.maxWidth = maxWidth;
                }

            }
            // Support: IE
            // IE returns zIndex value as an integer.
            return ret === undefined ? ret : ret + "";
        };
    }else if($.doc.documentElement.currentStyle){
        getStyles = function( elem ) {
            return elem.currentStyle;
        };

        curCSS = function( elem, name, computed ) {
            var left, rs, rsLeft, ret,
                style = elem.style;
            computed = computed || getStyles( elem );
            ret = computed ? computed[ name ] : undefined;
            // Avoid setting ret to empty string here
            // so we don't default to auto
            if ( ret == null && style && style[ name ] ) {
                ret = style[ name ];
            }
            // From the awesome hack by Dean Edwards
            // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

            // If we're not dealing with a regular pixel number
            // but a number that has a weird ending, we need to convert it to pixels
            // but not position css attributes, as those are proportional to the parent element instead
            // and we can't measure the parent instead because it might trigger a "stacking dolls" problem
            if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {
                // Remember the original values
                left = style.left;
                rs = elem.runtimeStyle;
                rsLeft = rs && rs.left;
                // Put in the new values to get a computed value out
                if ( rsLeft ) {
                    rs.left = elem.currentStyle.left;
                }
                style.left = name === "fontSize" ? "1em" : ret;
                ret = style.pixelLeft + "px";
                // Revert the changed values
                style.left = left;
                if ( rsLeft ) {
                    rs.left = rsLeft;
                }
            }
            // Support: IE
            // IE returns zIndex value as an integer.
            return ret === undefined ? ret : ret + "" || "auto";
        };
    }
    if(!$.support.opacity){
        css.cssHooks.opacity = {
            get: function( elem, computed ) {
                // IE uses filters for opacity
                return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
                    ( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
                    computed ? "1" : "";
            },
            set: function( elem, value ) {
                var style = elem.style,
                    currentStyle = elem.currentStyle,
                    opacity = kernel.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
                    filter = currentStyle && currentStyle.filter || style.filter || "";
                // IE has trouble with opacity if it does not have layout
                // Force it by setting the zoom level
                style.zoom = 1;
                // if setting opacity to 1, and no other filters exist - attempt to remove filter attribute
                // if value === "", then remove inline opacity
                if ( ( value >= 1 || value === "" ) &&
                    kernel.trim( filter.replace( ralpha, "" ) ) === "" &&
                    style.removeAttribute ) {

                    // Setting style.filter to null, "" & " " still leave "filter:" in the cssText
                    // if "filter:" is present at all, clearType is disabled, we want to avoid this
                    // style.removeAttribute is IE Only, but so apparently is this code path...
                    style.removeAttribute( "filter" );

                    // if there is no filter style applied in a css rule or unset inline opacity, we are done
                    if ( value === "" || currentStyle && !currentStyle.filter ) {
                        return;
                    }
                }
                // otherwise, set new filter values
                style.filter = ralpha.test( filter ) ? filter.replace( ralpha, opacity ) : filter + " " + opacity;
            }
        };
    }

    css.cssHooks.marginRight = addGetHookIf($.support.reliableMarginRight,
        function( elem, computed ) {
            if ( computed ) {
                // WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
                // Work around by temporarily setting element display to inline-block
                return swap( elem, { "display": "inline-block" },
                    curCSS, [ elem, "marginRight" ] );
            }
        });

    return {
        style : css.style,
        get : css.get,
        curCSS : curCSS,
        css : css.css,
        addGetHookIf : addGetHookIf
    };
});