var Structs = require("./structor").extend({

});

Structs.registerHelper("required", function(schema, block) {
    return "required" in schema && schema.required ? block(schema) : "";
});

Structs.registerHelper("value", function(evaluate) {
    var raw   = evaluate(),
        value = [];
    
    raw.split(".").reduce(function(prev, next) {
        prev.push(next);
        value.push(prev.join("."));
        return prev;
    }, [ this.options.data_ident ]);
    
    return "((" + value.join(" && ") + ") || undefined)";
});

/*Structs.defineProperty("string", function(data) {
    var $string = $value(data.from || data.key);
    
    if(typeof $string !== "string") {
        $string = "" + $string;

        $required : {
            this.invalid.push("$key");
        }
    }
    
    this.$key = $string;
});

Structs.defineProperty("number", function(data) {
    var $number = $(this.value(data.from || data.key));
    
    if(typeof $number !== "number") {
        $number = $number|0;
        
        $required : {
            this.invalid.push("$key");
        }
    }
    
    this.$key = $number;
});

Structs.defineProperty("date", function(data) {
    var $date = $(this.value(data.from || data.key)),
        $date = Date.parse($date);

    if(isNaN($date)) {
        $required : {
            this.invalid.push("$key");
        }
    }

    this.$key = new Date($date);
});*/

var Thing = Structs.defineStruct("Thing", {
    greeting : { type : "string" },
    id       : { type : "number" },
    guid     : { type : "string", required : true },
    created  : { type : "date", required : true },
    sup      : { type : "string", from : "sub.sup" }
});

/*var thing = Structs.create("Thing", {
    greeting : "hello",
    id       : "123",
    created  : "01-012014",
    sub : {
        sup : "heyo"
    }
});

console.log(Thing);
console.log(thing);
console.log(thing.invalid);*/