# Structor.js

Generate super fast type constructors from a schema definition

## Getting started

Install structor.js with npm:

```sh
$ npm install structor.js
```
Quick Example:
```javascript
// Create a new structor namespace
var Structs = require("structor.js").extend();

//Define a property type
Structs.defineProperty("number", function(data) {
    var $number = data.$key;
    
    if(typeof $number !== "number") {
        $number = 1 * $number;
    }
    
    this.$key = $number;
});

//Define a struct type
var Thing = Structs.defineStruct("Thing", {
    id : { type : "number" }
});

// Create instances!
var things = [ new Thing({ id : "1" }), new Thing({ id : 1 }) ];
```

## Meta-syntax

Structor.js recycles some rarely used (but still valid) javascript syntax. Meta-functions are functions that contain this syntax and are passed in to `structor.compile(fn)`. There are three supported meta-syntax styles supported for replacement, all of them require a preceeding `$`.

The simple style looks like this: `$prop`. When this is encountered it will be replaced by the value of the same named property on the data object provided to the meta-function.
```javascript
var metaTpl = Structs.compile(function(data){
  return data.$foo;
});

var metaFn = new Function(["data"], metaTpl({ foo : "bar" }));

console.log(metaFn({ bar : "baz" })); // logs baz
```
