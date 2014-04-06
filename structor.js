(function(structor) {

    // Utilities (at bottom)
    structor.mixin = mixin

    // Parser functions
    structor.mixin({
        PARSE_REGEX : /\$([\d\w_]*)(?:\s*(:)\s*(?={))?/,

        // Parses the buffer for so long as it contains anything that matches
        // Calls the proc function with any matches
        PARSE : function(raw, proc, ctx) {
            var buffer = raw,
                result = "",
                cursor;

            for(;;) {
                buffer.replace(structor.PARSE_REGEX, function(raw) {
                    var args = Array.prototype.slice.call(arguments, 1),
                        full = args.pop(),
                        pos = args.pop();
                    
                    result += full.substr(0, pos);
                    buffer = full.substr(pos + raw.length);
                    cursor = args;
                });
                
                if(cursor) {
                    cursor.push(buffer, result);
                    buffer = proc.apply(ctx || this, cursor);
                    cursor = null;
                } else {
                    result += buffer;
                    break;
                }
            }
            
            return result;
        },

        // Parses contents between two delineating chars
        PARSE_BETWEEN : function(src, openChar, closeChar) {
            var pattern = new RegExp("(?=[" + openChar[0] + closeChar[0] + "])"),
                chunks = src.split(pattern),
                open = close = 0,
                result = "";
            
            chunks.some(function(chunk, idx) {
                if(chunk[0] === openChar) {
                    open += 1;
                    result += chunk;
                } else if(chunk[0] === closeChar) {
                    close += 1;
                    
                    if(open === close){
                        result += closeChar;
                        src = chunk.slice(1) + chunks.slice(idx);
                        return true;
                    } else {
                        result += chunk;   
                    }
                }
            });
            
            return result || "";
        }
    });


    // Compiler functions
    structor.mixin({

        // Compiles identifier meta-syntax
        COMPILE_IDENT : function(options, data, label) {
            return data[label] || label;
        },

        // Compiles block meta-syntax
        COMPILE_BLOCK : function(options, data, label, partial) {
            var helper = options.helpers[label];

            return helper ? helper(partial, data, options) : partial;
        },

        // Compiles expression meta-syntax
        COMPILE_EXPR : function(options, data, label, partial) {
            var evaluate = new Function([ options.data_ident ], "return " + partial),
                helper   = options.helpers[label];

            return helper ? helper(evaluate(data), data, options) : evaluate();
        },

        // Bound-function factory for creating template functions
        COMPILE : function(source, options, data) {
            data || (data = {});

            return this.PARSE(source, function proc(label, isBlock, buffer, result) {
                var type = isBlock ? "BLOCK" : "IDENT",
                    partial;

                if(!isBlock && buffer[0] === "(" && !/function\s*$/.test(result)) {
                    type = "EXPR";
                }

                if(type === "BLOCK" || type === "EXPR") {
                    partial = this.PARSE_BETWEEN(buffer, isBlock ? "{" : "(", isBlock ? "}" : ")");
                    buffer = buffer.slice(partial.length);
                    partial = this.PARSE(partial.slice(1, partial.length - 1), proc);
                }

                partial = this["COMPILE_" + type](options, data, label, partial);
                
                return partial + buffer;
            });
        },

        // Takes in a string and options and returns a callable template function
        template : function(source, options) {
            options            || (options = {});
            options.helpers    || (options.helpers = this.HELPER_REGISTRY || {});
            options.data_ident || (options.data_ident = this.DATA_IDENT || "data");

            return bind(this.COMPILE, this, source || "", options);
        },

        //
        compile : function(fn, options) {
            var raw = fn.toString(),
                raw = raw.slice(raw.indexOf("{") + 1, -1);

            return this.template(raw, options);
        }
    });


    // Typed Structures
    structor.mixin({
        STRUCT_TYPES    : {},
        PROPERTY_TYPES  : {},
        HELPER_REGISTRY : {},
        DATA_IDENT      : "data",

        // Creates a new structor sandbox and mixes in any extensions
        extend : function(extension) {
            var ns = Object.create(this);

            extension || (extension = {});

            extension.STRUCT_TYPES    = Object.create(this.STRUCT_TYPES);
            extension.PROPERTY_TYPES  = Object.create(this.PROPERTY_TYPES);
            extension.HELPER_REGISTRY = Object.create(this.HELPER_REGISTRY);

            return ns.mixin(extension);
        },

        // Template used to wrap new Struct types
        CONSTRUCT_TEMPLATE : structor.compile(function(data) {
            function $name($args) {
                var undefined;

                Object.defineProperty(this, "invalid", {
                    value    : [],
                    writable : true
                });
                
                $body
            }
            
            return $name;
        }),

        //
        defineStruct : function(name, schema) {
            var lines = [],
                fieldTpl,
                keyName,
                src;
            
            //
            for(keyName in schema) {
                fieldTpl = this.PROPERTY_TYPES[schema[keyName].type];

                if(fieldTpl) {
                    lines.push(fieldTpl(keyName, schema));
                }
            }

            //
            src = this.CONSTRUCT_TEMPLATE({
                name  : name,
                args  : this.DATA_IDENT,
                body  : lines.join("")
            });

            //
            return this.STRUCT_TYPES[name] = (new Function(src))();
        },

        //
        create : function(type, data) {
            var struct = this.STRUCT_TYPES[type];
            return (struct && new struct(data)) || undefined;
        }
    });


    // Typed-Properties
    structor.mixin({
        //
        registerHelper : function(label, fn) {
            this.HELPER_REGISTRY[label] = fn;
        },
        
        //
        defineProperty : function(name, fn) {
            var tpl = this.compile(fn);

            this.PROPERTY_TYPES[name] = function(key, def) {
                var schema = def[key];
                
                schema.key      = schema.key || key;
                schema[name]    = "_" + schema.key;

                return tpl(schema);
            };

            return this.PROPERTY_TYPES[name];
        }

    });

    /*
     * Utils
     */
    var undefined;

    // Function bind with left side arguments
    function bind(f, c) {
        var xargs = arguments.length > 2 ?
                Array.prototype.slice.call(arguments, 2) : null;
        return function() {
            var fn = typeof f === "string" ? c[f] : f,
                args = (xargs) ?
                    xargs.concat(Array.prototype.slice.call(arguments, 0)) : arguments;
            return fn.apply(c || fn, args);
        };
    }

    // Function bind with right side arguments
    function rbind(f, c) {
        var xargs = arguments.length > 2 ?
            Array.prototype.slice.call(arguments, 2) : null;
        return function() {
            var fn = typeof f === "string" ? c[f] : f,
                args = (xargs) ?
                    Array.prototype.slice.call(arguments, 0).concat(xargs) : arguments;
            return fn.apply(c || fn, args);
        };
    };

    // Define own properties from r onto s
    function mixin(r, s) {
        var target = arguments.length === 2 ? r : this,
            source = arguments.length === 2 ? s : r,
            name, desc;

        if(source) for(name in source) {
            desc = Object.getOwnPropertyDescriptor(source, name);
            desc && Object.defineProperty(target, name, desc);
        }

        return target;
    };

}( (module && module.exports) || (window.structor = {}) ));