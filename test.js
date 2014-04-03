var structor = require("./structor");

structor.defineField("string", function(info, $key) {
    var $string = $[ structor.value(info.from || info.key) ];
    
    if(typeof $string !== "string") {
        $string = "" + $string;
        $[ structor.required(info) ]
    }
    
    this.$key = $string;
});

structor.defineField("number", function(info, $key) {
    var $number = $[ structor.value(info.from || info.key) ];
    
    if(typeof $number !== "number") {
        $number = $number|0;
        
        $[ structor.required(info) ]
    }
    
    this.$key = $number;
});

structor.defineField("date", function($key, $value) {
    var d = $value, d = d && d.split("-");
    
    if(d) {
        this.$key = new Date(d[2], d[0], d[1]);
    }
});

var Thing = structor.create("Thing", {
    greeting : { type : "string" },
    id       : { type : "number" },
    guid     : { type : "string", required : true },
    created  : { type : "date" },
    sup      : { type : "string", from : "sub.sup" }
});

var thing = new Thing({
    greeting : "hello",
    id       : "123",
    created  : "01-01-2014",
    sub : {
        sup : "heyo"
    }
});

console.log(Thing);
console.log(thing);
console.log(Object.keys(thing));