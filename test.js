var Structs = require("./structor").extend();

Structs.defineProperty("string", function(schema, $key) {
    var $string = $(/* this.value(schema.from || schema.key) */);
    
    if(typeof $string !== "string") {
        $string = "" + $string;
        $(/* this.required(schema) */);
    }
    
    this.$key = $string;
});

Structs.defineProperty("number", function(schema, $key) {
    var $number = $(/* this.value(schema.from || schema.key) */);
    
    if(typeof $number !== "number") {
        $number = $number|0;
        
        $(/* this.required(schema) */);
    }
    
    this.$key = $number;
});

Structs.defineProperty("date", function($key, $value) {
    var $date = $(/* this.value(schema.from || schema.key) */),
        $date = Date.parse($date);

    if(isNaN($date)) {
        $(/* this.required(schema) */);
    }

    this.$key = new Date($date);
});

var Thing = Structs.defineStruct("Thing", {
    greeting : { type : "string" },
    id       : { type : "number" },
    guid     : { type : "string", required : true },
    created  : { type : "date", required : true },
    sup      : { type : "string", from : "sub.sup" }
});

var thing = Structs.create("Thing", {
    greeting : "hello",
    id       : "123",
    created  : "01-012014",
    sub : {
        sup : "heyo"
    }
});

console.log(Thing);
console.log(thing);
console.log(thing.invalid);