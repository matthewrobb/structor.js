(function(structor) {

    // Setup constants
    var undefined,
        IDENT   = "IDENT",
        EXPR    = "EXPR",
        BLOCK   = "BLOCK",
        COMPILE = "COMPILE_",
        RETURN  = "return ",
        DATA    = "data",
        META    = "schema",
        EMPTY   = "";

    // Local shortcuts
    var slice = Function.prototype.call.bind(Array.prototype.slice);

    // Utilities (at bottom)
    structor.mixin = mixin

    // Parser functions
    structor.mixin({
        PARSE_REGEX : /\$([\d\w_]*)(?:\s*(:)\s*(?={))?/,

        // Parses the buffer for so long as it contains anything that matches
        // Calls the proc function with any matches
        PARSE : function(raw, proc, ctx) {
            var buffer = raw,
                result = EMPTY,
                cursor;

            for(;;) {
                // Search the buffer for a meta-label
                buffer.replace(structor.PARSE_REGEX, function(raw) {
                    var args = slice(arguments, 1),
                        full = args.pop(),
                        pos = args.pop();
                    
                    // Add everything that came before the meta-label to the output
                    result += full.substr(0, pos);

                    // Adjust the buffer to be everything after the meta-label
                    buffer = full.substr(pos + raw.length);

                    // Set the cursor to the matches from this replace
                    cursor = args;
                });
                
                if(cursor) {
                    // Add the buffer and result to the cursor
                    cursor.push(buffer, result);

                    // Process the cursor and set the buffer from the result
                    // NOTE: processor is exected to return the entire new buffer
                    buffer = proc.apply(ctx || this, cursor);

                    // Unset the cursor
                    cursor = undefined;
                } else {
                    // Since no matches were found add the remaining buffer to the result
                    // and break out of the loop
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
                result = EMPTY;
            
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
            
            return result || EMPTY;
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
            var result = this.template(partial, options),
                helper = options.helpers[label];

            return helper ? helper(result, data, options) : result(data);
        },

        // Compiles expression meta-syntax
        COMPILE_EXPR : function(options, data, label, partial) {
            var result = (new Function(options.params, RETURN + partial)),
                helper = options.helpers[label];

            return helper ? helper(result, data, options) : result(data);
        },

        // Bound-function factory for creating template functions
        COMPILE : function(source, options, data) {
            data || (data = {});

            // Aggressively parse the source for meta-labels 
            return this.PARSE(source, function proc(label, isBlock, buffer, result) {
                var type = isBlock ? BLOCK : IDENT,
                    partial;

                // Check to see if we've found a meta-expression or a meta-identifier
                if(type == IDENT && buffer[0] == "(" && !/function\s*$/.test(result)) {
                    type = EXPR;
                }

                if(type == BLOCK || type == EXPR) {
                    // Parse out the subsequence
                    partial = this.PARSE_BETWEEN(buffer, isBlock ? "{" : "(", isBlock ? "}" : ")");

                    // Remove the partial from the remaining buffer
                    buffer = buffer.slice(partial.length);

                    // Recursively parse the subsequence
                    partial = partial.slice(1, partial.length - 1);
                }

                // Pass the label and partial through the syntax-type compiler
                partial = this[COMPILE + type](options, data, label, partial);
                
                // Return the new buffer
                return partial + buffer;
            });
        },

        // Takes in a string and options and returns a callable template function
        template : function(source, options) {
            options            || (options = {});
            options.helpers    || (options.helpers = this.HELPER_REGISTRY || {});
            options.params     || (options.params = this.STRUCT_PARAMS || [ DATA ]);

            return bind(this.COMPILE, this, source || EMPTY, options);
        },

        // Takes in a function containing meta-syntax and compiles it into a template
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

        // Creates a new structor sandbox and mixes in any extensions
        extend : function(exts) {
            var ns = Object.create(this);

            exts || (exts = {});

            exts.STRUCT_TYPES    = Object.create(this.STRUCT_TYPES);
            exts.PROPERTY_TYPES  = Object.create(this.PROPERTY_TYPES);
            exts.HELPER_REGISTRY = Object.create(this.HELPER_REGISTRY);

            return ns.mixin(exts);
        },

        // Registers a named type with a type-schema
        // Returns a constructor for creation of type
        defineStruct : function(name, schema) {
            var props = [],
                propTpl,
                keyName,
                src;
            
            // Iterates over all the schema fields and adds them to the body
            for(keyName in schema) {
                if(typeof schema[keyName] === "string") {
                    schema[keyName] = { type: schema[keyName] };
                }
                
                propTpl = this.PROPERTY_TYPES[schema[keyName].type];
                
                if(propTpl) {
                    props.push(propTpl(keyName, schema));
                }
            }

            // Wraps constructor
            src = this.FACTORY_TEMPLATE({
                name       : name,
                params     : this.STRUCT_PARAMS.join(),
                properties : props.join(EMPTY)
            });

            // Compiles script and executes to extract the new constructor
            return this.STRUCT_TYPES[name] = (new Function(src))();
        },

        // Takes in a struct name and data
        // Returns an instance of that struct from the data
        create : function(type, data) {
            var struct = this.STRUCT_TYPES[type];
            return (struct && new struct(data)) || undefined;
        }
    });


    // Typed-Properties
    structor.mixin({
        // Registers a named meta-helper
        registerHelper : function(label, fn) {
            this.HELPER_REGISTRY[label] = fn;
        },
        
        // Takes in a type name and a meta-function
        // Returns a template for including this type on struct properties
        defineProperty : function(name, fn) {
            var tpl = this.compile(fn, {
                params : this.META_PARAMS.join()
            });

            this.PROPERTY_TYPES[name] = function(key, def) {
                var schema = def[key];
                
                schema.key      = schema.key || key;
                schema[name]    = "_" + schema.key;

                return tpl(schema);
            };

            return this.PROPERTY_TYPES[name];
        },

        setFactoryTemplate : function(fn, options) {
            this.FACTORY_TEMPLATE = this.compile(fn, options);
        },

        setStructParams : function() {
            this.STRUCT_PARAMS = slice(arguments);
        },

        setMetaParams : function() {
            this.META_PARAMS = slice(arguments);
        }

    });

    // Set up template defaults
    structor.setStructParams(DATA);
    structor.setMetaParams(META);
    structor.setFactoryTemplate(function() {
        function $name($params) {
            $properties;
        }
        
        return $name;
    });

    /*
     * Utils
     */

    // Function bind with left side arguments
    function bind(f, c) {
        var xargs = arguments.length > 2 ? slice(arguments, 2) : null;

        return function() {
            var fn = typeof f === "string" ? c[f] : f,
                args = (xargs) ? xargs.concat(slice(arguments, 0)) : arguments;

            return fn.apply(c || fn, args);
        };
    }

    // Function bind with right side arguments
    function rbind(f, c) {
        var xargs = arguments.length > 2 ? slice(arguments, 2) : null;

        return function() {
            var fn = typeof f === "string" ? c[f] : f,
                args = (xargs) ? slice(arguments, 0).concat(xargs) : arguments;

            return fn.apply(c || fn, args);
        };
    };

    // Define own properties from r onto s
    function mixin(r, s) {
        var source = s,
            target = arguments.length === 1 ? (source = r) && this : r,
            name, desc;

        if(source) for(name in source) {
            desc = Object.getOwnPropertyDescriptor(source, name);
            desc && Object.defineProperty(target, name, desc);
        }

        return target;
    };

}( (module && module.exports) || (window.structor = {}) ));