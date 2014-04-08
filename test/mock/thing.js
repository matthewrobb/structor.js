var Structs = require("../../structor").extend();

Structs.setFactoryTemplate(function() {

    return function $name(data) {
        var undefined;

        Object.defineProperty(this, "invalid", {
            value    : [],
            writable : true
        });
        
        $properties;
    }

});

Structs.registerHelper("required", function(partial, schema, options) {
    return "required" in schema && schema.required ? partial : "";
});

Structs.registerHelper("value", function(partial, schema, options) {
    var value = [];
    
    partial.split(".").reduce(function(prev, next) {
        prev.push(next);
        value.push(prev.join("."));
        return prev;
    }, [ "data" ]);
    
    return "((" + value.join(" && ") + ") || undefined)";
});

Structs.defineProperty("string", function(schema) {
    var $string = $value(schema.from || schema.key);
    
    if(typeof $string !== "string") {
        $string = "" + $string;

        $required : {
            this.invalid.push("$key");
        }
    }
    
    this.$key = $string;
});

Structs.defineProperty("number", function(schema) {
    var $number = $value(schema.from || schema.key);
    
    if(typeof $number !== "number") {
        $number = $number|0;
        
        $required : {
            this.invalid.push("$key");
        }
    }
    
    this.$key = $number;
});

Structs.defineProperty("date", function(schema) {
    var $date = $value(schema.from || schema.key),
        $date = Date.parse($date);

    if(isNaN($date)) {
        $required : {
            this.invalid.push("$key");
        }
    }

    this.$key = new Date($date);
});

var Thing = module.exports = Structs.defineStruct("Thing", {
    greeting : { type : "string" },
    id       : { type : "number" },
    guid     : { type : "string", required : true },
    created  : { type : "date", required : true },
    sup      : { type : "string", from : "sub.sup" }
});