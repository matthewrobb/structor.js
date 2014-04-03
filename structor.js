(function(structor) {

    var undefined;

    structor.mixin = function(r, s) {
        var target = arguments.length === 2 ? r : this,
            source = arguments.length === 2 ? s : r,
            name, desc;

        if(source) for(name in source) {
            desc = Object.getOwnPropertyDescriptor(source, name);
            desc && Object.defineProperty(target, name, desc);
        }

        return target;
    };

    structor.extend = function(extension) {
        var ns = Object.create(this);

        ns.STRUCT_TYPES   = Object.create(this.STRUCT_TYPES);
        ns.PROPERTY_TYPES = Object.create(this.PROPERTY_TYPES);

        return extension ? ns.mixin(extension) : ns;
    };

    structor.mixin({
        STRUCT_TYPES    : {},
        PROPERTY_TYPES  : {},
        DATA_IDENTIFIER : "data",

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
            src = this.wrap({
                name  : name,
                args  : this.DATA_IDENTIFIER,
                valid : "$valid",
                body  : lines.join("")
            });

            //
            return this.STRUCT_TYPES[name] = (new Function(src))();
        },
    
        //
        template : function(_$fn) {
            var _$self = this,
                _$tpl  = _$fn.toString(),
                _$tpl  = _$tpl.slice(_$tpl.indexOf("{") + 1, -1);
            
            return function(schema) {
                return _$tpl
                    .replace(/(\$\(\/\*)([^]*?)(\*\/\))/g, function(_$1, _$2, _$3) {
                        return (new Function(["schema"], "return (" + _$3 + ")")).call(_$self, schema)
                    })
                    .replace(/(\$)([\d\w]*)/g, function(match, tpl, key) {
                        return schema && key in schema ? schema[key] : key;
                    });
            };
        }
    });

    structor.mixin({

        //
        wrap : structor.template(function($name, $args, $body) {
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
        value : function(raw) {
            var value = [];
            
            raw.split(".").reduce(function(prev, next) {
                prev.push(next);
                value.push(prev.join("."));
                return prev;
            }, [ this.DATA_IDENTIFIER ]);
            
            return "((" + value.join(" && ") + ") || undefined)";
        },
        
        //
        required : function(schema) {
            return !schema.required ? "" : this.template(function() {
                this.$invalid.push("$key");
            })(schema);
        },
        
        //
        defineProperty : function(name, fn) {
            var tpl = this.template(fn);
            
            this.PROPERTY_TYPES[name] = function(key, def) {
                var schema = def[key];
                
                schema.key      = schema.key || key;
                schema[name]    = "$" + schema.key;
                
                return tpl(schema);
            };
        }

    });

}( (module && module.exports) || (window.structor = {}) ));