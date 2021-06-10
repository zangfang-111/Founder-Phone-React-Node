import mapO from "map-o";
import iterateObject from "iterate-object";
//import emoji from "emojilib";

var emoji = require("emojilib");

var nameMap = {};

nameMap.emoji = mapO(
  emoji.lib,
  function (value, name) {
    return value.char;
  },
  true
);

iterateObject(nameMap.emoji, function (value, name, obj) {
  return (!value && delete obj[name]) || true;
});

/**
 * get
 * Gets the emoji character (unicode) by providing the name.
 *
 * @name get
 * @function
 * @param {String} name The emoji name.
 * @return {String} The emoji character (unicode).
 */
nameMap.get = function (name) {
  if (name.charAt(0) === ":") {
    name = name.slice(1, -1);
  }
  return this.emoji[name];
};

emoji = null;
export default nameMap;
