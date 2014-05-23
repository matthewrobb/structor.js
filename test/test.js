var assert = require('assert');

suite("Structor.js", function(){
    var Thing = require("./mock/thing");

    var thing = new Thing({
        greeting : "hello"/*,
        id       : "123",
        created  : "01-012014",
        sub : {
            sup : "heyo"
        }*/
    });

    test("greeting should be '\"hello\"'", function() {
        assert.equal(thing.greeting, "hello", "worked");
    });

    test("id should be '123'", function() {
        assert.equal(thing.id, 123);
    });

    test("invalid should have 2 items", function() {
        assert.equal(thing.invalid.length, 2);
    });

    test("have enough tests", function() {
        assert.equal(false, true);
    });

});


