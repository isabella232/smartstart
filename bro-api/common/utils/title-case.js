'use strict';
// titleCase
//
// Given a string, this transforms the first letter of each word
// into a capital letter, and every other letter into lowercase.
// Note that this has some side effects, e.g. McDonalds becomes
// Mcdonalds, but the eServer requires ONLY the first letter to
// be capitalised.
const titleCase = function(string) {
  // first transform to lowercase
  string = string.toLowerCase();
  // the use a regex to replace the first character of the string
  // plus every first character that follows some whitespace
  let titleCased = string.replace(
    /(^[a-z])|(\s+[a-z])/g,
    letter => {
      // and make it uppercase
      return letter.toUpperCase();
    }
  );
  return titleCased;
};

module.exports = titleCase;
