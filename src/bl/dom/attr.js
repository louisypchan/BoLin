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

$.add(["bl/core/kernel", "bl/dom/selector/q", "bl/extensions/array"], function(kernel, query) {

    var propFix = {
        "for": "htmlFor",
        "class": "className"
        },
        rfocusable = /^(?:input|select|textarea|button|object)$/i,
        rclickable = /^(?:a|area)$/i,
        ruseDefault = /^(?:checked|selected)$/i,
        valHooks = {
            option: {
                get: function( elem ) {
                    var val = query.qsa.attr( elem, "value" );
                    return val != null ? val :
                    // Support: IE10-11+
                    // option.text throws exceptions
                    kernel.trim(query.qsa.getText(elem));
                }
            },
            select: {
                get: function( elem ){
                    var value, option, options = elem.options,index = elem.selectedIndex,
                        one = elem.type === "select-one" || index < 0,
                        values = one ? null : [],
                        max = one ? index + 1 : options.length,
                        i = index < 0 ? max : one ? index : 0;
                    // Loop through all the selected options
                    for ( ; i < max; i++ ) {
                        option = options[ i ];
                        // oldIE doesn't update selected after form reset
                        if ( ( option.selected || i === index ) &&
                        // Don't return options that are disabled or in a disabled optgroup
                            ( $.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
                            ( !option.parentNode.disabled || !kernel.nodeName( option.parentNode, "optgroup" ) ) ) {
                            // Get the specific value for the option
                            value = valHooks.option.get(option)||option.value;
                            // We don't need an array for one selects
                            if ( one ) {
                                return value;
                            }
                            // Multi-Selects return an array
                            values.push( value );
                        }
                    }
                    return values;
                },
                set: function( elem, value ){
                    var optionSet, option, options = elem.options,values = kernel.makeArray( value ),i = options.length;
                    while( i-- ){
                        option = options[ i ];
                        if(values.contains(valHooks.option.get(option))){
                            // Support: IE6
                            // When new option element is added to select box we need to
                            // force reflow of newly added node in order to workaround delay
                            // of initialization properties
                            try {
                                option.selected = optionSet = true;
                            }catch ( _ ) {
                                // Will be executed only in IE6
                                option.scrollHeight;
                            }
                        }else {
                            option.selected = false;
                        }
                    }
                    // Force browsers to behave consistently when non-matching value is set
                    if ( !optionSet ){
                        elem.selectedIndex = -1;
                    }
                    return options;
                }
            }
        },
        rnotwhite = (/\S+/g),

        boolHook = {
            set: function( elem, value, name ) {
                if ( value === false ) {
                    // Remove boolean attributes when set to false
                    obj.removeAttr( elem, name );
                }else if ($.support.input && $.support.getSetAttribute || !ruseDefault.test( name ) ) {
                    // IE<8 needs the *property* name
                    elem.setAttribute( !$.support.getSetAttribute && propFix[ name ] || name, name );
                }else{
                    // Use defaultChecked and defaultSelected for oldIE
                    elem[ kernel.camelCase( "default-" + name ) ] = elem[ name ] = true;
                }
                return name;
            }
        },
        nodeHook = !$.support.getSetAttribute ? {
            // Use this for any attribute in IE6/7
            // This fixes almost every IE6/7 issue
            set: function( elem, value, name ) {
                // Set the existing or create a new attribute node
                var ret = elem.getAttributeNode( name );
                if ( !ret ) {
                    elem.setAttributeNode((ret = elem.ownerDocument.createAttribute( name )));
                }
                ret.value = value += "";
                // Break association with cloned elements by also using setAttribute
                if ( name === "value" || value === elem.getAttribute( name ) ) {
                    return value;
                }
            }
        } : false,
        obj = {
            prop : function( elem, name, value ) {
                var ret, hooks, notxml,
                    nType = elem.nodeType;
                // don't get/set properties on text, comment and attribute nodes
                if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
                    return;
                }
                notxml = nType !== 1 || !kernel.isXMLDoc( elem );
                if ( notxml ) {
                    // Fix name and attach hooks
                    name = propFix[ name ] || name;
                    hooks = obj.propHooks[ name ];
                }
                if ( value !== undefined ) {
                    return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ? ret : ( elem[ name ] = value );
                }else {
                    return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ? ret : elem[ name ];
                }
            },

            propHooks : {
                tabIndex : {
                    get: function( elem ) {
                        // elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
                        // http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
                        var tabindex = query.qsa.attr( elem, "tabindex" );
                        return tabindex ? parseInt( tabindex, 10 ) : rfocusable.test(elem.nodeName) || rclickable.test( elem.nodeName ) && elem.href ?
                            0 :
                            -1;
                    }
                }
            },

            attr : function(elem, name, value){
                var hooks, ret, nType = elem.nodeType;
                // don't get/set attributes on text, comment and attribute nodes
                if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
                    return;
                }
                // Fallback to prop when attributes are not supported
                if ( typeof elem.getAttribute === "undefined" ) {
                    return obj.prop( elem, name, value );
                }
                // All attributes are lowercase
                // Grab necessary hook if one is defined
                if ( nType !== 1 || !kernel.isXMLDoc( elem ) ) {
                    name = name.toLowerCase();
                    hooks = obj.attrHooks[ name ] || ( query.qsa.selectors.match.bool.test( name ) ? boolHook : nodeHook );
                }
                if ( value !== undefined ) {
                    if ( value === null ) {
                        obj.removeAttr( elem, name );
                    }else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
                        return ret;
                    }else {
                        elem.setAttribute( name, value + "" );
                        return value;
                    }
                }else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
                    return ret;
                }else {
                    ret = query.qsa.attr( elem, name );
                    // Non-existent attributes return null, we normalize to undefined
                    return ret == null ?
                        undefined :
                        ret;
                }
            },
            removeAttr : function(elem, value){
                var name, propName, i = 0, attrNames = value && value.match(rnotwhite);
                if ( attrNames && elem.nodeType === 1 ) {
                    while ( (name = attrNames[i++]) ) {
                        propName = propFix[ name ] || name;
                        // Boolean attributes get special treatment
                        if ( query.qsa.selectors.match.bool.test( name ) ) {
                            // Set corresponding property to false
                            if ($.support.input && $.support.getSetAttribute || !ruseDefault.test( name ) ) {
                                elem[ propName ] = false;
                                // Support: IE<9
                                // Also clear defaultChecked/defaultSelected (if appropriate)
                            }else {
                                elem[ kernel.camelCase( "default-" + name ) ] = elem[ propName ] = false;
                            }
                        }else{
                            // See #9699 for explanation of this approach (setting first, then removal)
                            obj.attr( elem, name, "" );
                        }
                        elem.removeAttribute( $.support.getSetAttribute ? name : propName );
                    }
                }
            },
            attrHooks: {
                type: {
                    set: function( elem, value ) {
                        if ( !$.support.radioValue && value === "radio" && kernel.nodeName(elem, "input") ) {
                            // Setting the type on a radio button after the value resets the value in IE6-9
                            // Reset value to default in case type is set after value during creation
                            var val = elem.value;
                            elem.setAttribute( "type", value );
                            if ( val ) {
                                elem.value = val;
                            }
                            return value;
                        }
                    }
                }
            }
    };
    // fix oldIE attroperties
    if ( !$.support.input || !$.support.getSetAttribute ) {
        obj.attrHooks.value = {
            set: function( elem, value, name ) {
                if ( kernel.nodeName( elem, "input" ) ) {
                    // Does not return so that setAttribute is also used
                    elem.defaultValue = value;
                }else {
                    // Use nodeHook if defined; otherwise setAttribute is fine
                    return nodeHook && nodeHook.set( elem, value, name );
                }
            }
        }
    }
    if(!$.support.getSetAttribute){
        // Fixing value retrieval on a button requires this module
        valHooks.button = {
            get: function( elem, name ) {
                var ret = elem.getAttributeNode( name );
                if ( ret && ret.specified ) {
                    return ret.value;
                }
            },
            set: nodeHook.set
        };
        // Set contenteditable to false on removals
        // Setting to empty string throws an error as an invalid value
        obj.attrHooks.contenteditable = {
            set: function( elem, value, name ) {
                nodeHook.set( elem, value === "" ? false : value, name );
            }
        };
        obj.attrHooks.width = obj.attrHooks.height = {
            set: function( elem, value ) {
                if ( value === "" ) {
                    elem.setAttribute( name, "auto" );
                    return value;
                }
            }
        };
    }
    if ( !$.support.style ) {
        obj.attrHooks.style = {
            get: function( elem ) {
                // Return undefined in the case of empty string
                // Note: IE uppercases css property names, but if we were to .toLowerCase()
                // .cssText, that would destroy case senstitivity in URL's, like in "background"
                return elem.style.cssText || undefined;
            },
            set: function( elem, value ) {
                return ( elem.style.cssText = value + "" );
            }
        };
    }

    return {
        prop : obj.prop,
        attr : obj.attr,
        removeAttr : obj.removeAttr,
        valHooks : valHooks
    };
});