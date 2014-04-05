(function(structor) {

    // Utilities (at bottom)
    structor.mixin = mixin

    // Parser functions
    structor.mixin({

        // Parses contents between two delineating chars
        PARSE_BETWEEN : function(src, openChar, closeChar, compile) {
            var pattern = new RegExp("(?=[" + openChar[0] + closeChar[0] + "])"),
                open = close = 0,
                result = extra = "",
                done = false;
            
            src.split(pattern).forEach(function(chunk) {
                if(done) {
                    extra += chunk;
                } else if(chunk[0] === openChar) {
                    open += 1;
                    result += chunk;
                } else if(chunk[0] === closeChar) {
                    close += 1;
                    
                    if(open === close){
                        done = true;
                        result += closeChar;
                        extra += chunk.slice(1);
                    } else {
                        result += chunk;   
                    }
                }
            });
            
            return (compile ? compile.call(this, result) : result || "") + extra;
        },

        // Parses out identifier syntax
        PARSE_IDENT : function() {
            var ctx   = this,
                regex = new RegExp([
                    /((?:function(?=\s+))?\s*)/.source,
                    /(\$([\d\w_]+)(?!\s*:\s*))/.source
                ].join(""), "g");

            ctx.result = ctx.result.replace(/((^[^]*)\$([\d\w_]+)([^]*$))/g, function(_, full, before, ident, after, pos, raw) {
                console.log(full.length + ":" + raw.length + ":" + _.length + ":" + (before.length + ident.length + after.length));



                //followed by a :
                    // BLOCK

                // followed by a (
                    // NOT preceded by a function
                        // EXPR

                // IDENT

                return (before + ident + after) + "$hi";


                /*if(!/^function/.test(fn) && raw.substr(pos+_.length).trim()[0] === "(") {
                    return _;
                }*/

                //return ctx.COMPILE_IDENT(ident) || full;
            });

            return ctx;
        },

        // Parses out block syntax
        PARSE_BLOCK : function() {
            var ctx = this;

            ctx.result = ctx.result.replace(/(\$([\d\w_]+)\s*:\s*(\{[^]*\}))/g, function(_, match, label, raw) {
                return ctx.PARSE_BETWEEN(raw, "{", "}", function(block) {
                    return ctx.COMPILE_BLOCK(label, block.replace(/^\{|\}$/g, "")) || match;
                });
            });

            return ctx;
        },

        // Parses out expression syntax
        PARSE_EXPR : function() {
            var ctx = this;

            ctx.result = ctx.result.replace(/(\$([\d\w_]+)?(\([^]*\)))/g, function(_, match, label, expr, pos, raw) {
                /*if(!/^function/.test(fn) && raw.substr(pos+_.length).trim()[0] === "(") {
                    return _;
                }*/
                if(/function\s*[\d\w_]*\s*$/.test(raw.substr(0, pos))) {
                    console.log(_)
                    return match;
                }
                return ctx.PARSE_BETWEEN(expr, "(", ")", function(expr) {
                    return ctx.COMPILE_EXPR(label, expr.replace(/^\(|\)$/g, "")) || match;
                });
            });

            return ctx;
        }
    });


    // Compiler functions
    structor.mixin({

        // Compiles identifier meta-syntax
        COMPILE_IDENT : function(ident) {
            return this.data[ident];
        },

        // Compiles block meta-syntax
        COMPILE_BLOCK : function(label, block) {
            var partial = bind(this.template(block, this.options), this, this.data),
                helper  = this.options.helpers[label];

            return helper ? helper(partial) : partial();
        },

        // Compiles expression meta-syntax
        COMPILE_EXPR : function(label, expr) {
            var evaluate = bind(new Function([ this.options.data_ident ], "return " + expr), this, this.data),
                helper   = this.options.helpers[label];

            return helper ? helper.call(this, evaluate) : evaluate();
        },

        // Bound-function factory for creating template functions
        COMPILE : function(data) {
            var ctx = this,
                result;

            ctx.data   = data;
            ctx.result = ctx.source;

            //result = ctx//.PARSE_BLOCK()
                        //.PARSE_EXPR()
                        //.PARSE_IDENT()
                        //.result;

            function parse(raw, regex, proc) {
                var result = raw,
                    match;

                while(match = result.search())

            }

            var pat = /\$([\d\w_]+)/g;

            parse(ctx.source, pat, function() {
                console.log(arguments);
            })

            ctx.result = ctx.data = undefined;

            return result;
        },

        // Takes in a string and options and returns a callable template function
        template : function(tpl, options) {
            var ctx = Object.create(this);

            options || (options = {});

            options.helpers || (options.helpers = this.HELPER_REGISTRY || {});
            options.data_ident || (options.data_ident = this.DATA_IDENT || "data");

            ctx.mixin({
                options  : options,
                source   : tpl,
                result   : undefined,
                data     : undefined
            });

            return bind(this.COMPILE, ctx);
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
        DATA_IDENTIFIER : "data",

        //
        CTOR_TEMPLATE : structor.compile(function(data) {
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
        extend : function(extension) {
            var ns = Object.create(this);

            ns.STRUCT_TYPES    = Object.create(this.STRUCT_TYPES);
            ns.PROPERTY_TYPES  = Object.create(this.PROPERTY_TYPES);
            ns.HELPER_REGISTRY = Object.create(this.HELPER_REGISTRY);

            return extension ? ns.mixin(extension) : ns;
        },

        //
        create : function(type, data) {
            var struct = this.STRUCT_TYPES[type];
            return (struct && new struct(data)) || undefined;
        },

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
            src = this.CTOR_TEMPLATE({
                name  : name,
                args  : this.DATA_IDENTIFIER,
                body  : lines.join("")
            });
//console.log(src)
            //
            return this.STRUCT_TYPES[name] = (new Function(src))();
        }
    });


    // Typed-Property helpers
    structor.mixin({
        //
        registerHelper : function(label, fn) {
            this.HELPER_REGISTRY[label] = fn;
        },

        //
        value : function(raw) {

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