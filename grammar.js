/**
 * @file Tree sitter grammer for the reef language
 * @author Malachi Mackie
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "reef",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
