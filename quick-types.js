(function(global) {

    function Struct(name, def) {
        var lines = [], field, src;
        
        for(var key in def) {
            field = Struct.fields[def[key].type];
            if(field) {
                lines.push(field(key, def));
            }
            field = null;
        }
        
        src = Struct.wrap({
            name  : name,
            args  : Struct.dataIdent,
            valid : "$valid",
            body  : lines.join("")
        });
        
        return (new Function(src))();
    }

    Struct.template = function(_$fn) {
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
    
    Struct.wrap = Struct.template(function($name, $args, $body) {
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
    
    Struct.dataIdent = "data";
    Struct.value = function(raw) {
        var value = [];
        
        raw.split(".").reduce(function(prev, next) {
            prev.push(next);
            value.push(prev.join("."));
            return prev;
        }, [ Struct.dataIdent ]);
        
        return "((" + value.join(" && ") + ") || undefined)";
    };
    
    Struct.required = function(info) {
        return !info.required ? "" : Struct.template(function() {
            this.$invalid.push("$key");
        })(info);
    };
    
    Struct.fields = {};
    Struct.defineField = function(name, fn) {
        var tpl = Struct.template(fn);
        
        Struct.fields[name] = function(key, def) {
            var info = def[key];
            
            info.key      = info.key || key;
            info[name]    = "$" + info.key;
            info.value    = Struct.value(info.from || key);
            info.required = !!info.required;
            
            return tpl(info);
        };
    };

    if(module && module.exports) {
        module.exports = Struct;
    } else {
        global.Struct = Struct;
    }

}(this));