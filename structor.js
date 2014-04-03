(function(structor) {
    structor.fields = {};

    structor.create = function(name, def) {
        var lines = [], field, src;
        
        for(var key in def) {
            field = structor.fields[def[key].type];
            if(field) {
                lines.push(field(key, def));
            }
            field = null;
        }
        
        src = structor.wrap({
            name  : name,
            args  : structor.dataIdent,
            valid : "$valid",
            body  : lines.join("")
        });
        
        return (new Function(src))();
    }

    structor.template = function(_$fn) {
        var _$tpl = _$fn.toString(),
            _$tpl = _$tpl.slice(_$tpl.indexOf("{") + 1, -1);
        
        return function(info) {
            return _$tpl.replace(/(\$\[)([^]*?)(\])/g, function(_$1, _$2, _$3) {
                return eval(_$3);
            }).replace(/(\$)([\d\w]*)/g, function(match, tpl, key) {
                return info && key in info ? info[key] : key;
            });
        };
    };
    
    structor.wrap = structor.template(function($name, $args, $body) {
        function $name($args) {
            var undefined;

            Object.defineProperty(this, "invalid", {
                value    : [],
                writable : true
            });
            
            $body
        }
        
        return $name;
    });
    
    structor.dataIdent = "data";
    structor.value = function(raw) {
        var value = [];
        
        raw.split(".").reduce(function(prev, next) {
            prev.push(next);
            value.push(prev.join("."));
            return prev;
        }, [ structor.dataIdent ]);
        
        return "((" + value.join(" && ") + ") || undefined)";
    };
    
    structor.required = function(info) {
        return !info.required ? "" : structor.template(function() {
            this.$invalid.push("$key");
        })(info);
    };
    
    
    structor.defineField = function(name, fn) {
        var tpl = structor.template(fn);
        
        structor.fields[name] = function(key, def) {
            var info = def[key];
            
            info.key      = info.key || key;
            info[name]    = "$" + info.key;
            info.value    = structor.value(info.from || key);
            info.required = !!info.required;
            
            return tpl(info);
        };
    };

}( (module && module.exports) || (window.structor = {}) ));