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

Structor.js recycles some rarely used (but still valid) javascript syntax. Meta-functions are functions that contain this syntax and are passed in to `structor.compile(fn)`. There are three meta-syntax forms supported for substitutions, all of them require a preceeding `$`.

The simple form looks like this: `$prop` and gets replaced by the value of the same named property on the data object provided to the meta-function template.
### Simple Replacements
```javascript
var metaTpl = Structs.compile(function(){
    return this.$foo;
});

var metaFn = new Function(metaTpl({ foo : "bar" }));

console.log(metaFn.call({ bar : "baz" })); // logs baz
```
Beyond the simple case are meta-expressions which look like this: `$(...)` and will evaluate the expression within to produce the value to use as the replacement.
### Expression Replacements
```javascript
var metaTpl = Structs.compile(function(){
    return this.$(data.foo);
});

var metaFn = new Function(metaTpl({ foo : "bar" }));

console.log(metaFn.call({ bar : "baz" })); // logs baz
```
## Helpers
You can also register normal function helpers to be used within meta-functions. The syntax is similar to meta-expressions only also included a helper label `$helper(...)`.

### Expression Helpers
```javascript
Structs.registerHelper("required", function(partial, schema) {
    if("required" in schema && schema.required == true) {
        return "throw new Error('invalid data');";
    }
});

var metaTpl = Structs.compile(function(){
    if(!this.foo) {
        $required();
    }
    
    return this.$(data.foo);
});

var metaFn = new Function(metaTpl({ foo : { required: true } }));

console.log(metaFn.call({ bar : "baz" })); // error thrown
```
### Block Helpers
While very useful for certain types of replacements, expressions can be limiting for others. The above will produce a condition that get's checked regardless of it being needed or not. The final meta-syntax form offers a solution for these cases through block helpers(`$helper: {}`).
```javascript
Structs.registerHelper("required", function(partial, schema) {
    return Object.keys(schema).map(function(key){
        return schema[key].required ? partial : "";
    }).join("");
});

var metaTpl = Structs.compile(function(){
    $required : {
        if(!this.foo) {
            throw new Error('invalid data');
        }
    }
    
    return this.$(data.foo);
});

var metaFn = new Function(metaTpl({ foo : { required: true } }));

console.log(metaFn.call({ bar : "baz" })); // error thrown
```
