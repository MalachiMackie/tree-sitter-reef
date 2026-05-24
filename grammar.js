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
    source_file: ($) => repeat(choice($.definition, $._statement)),

    definition: ($) => choice(),
    // $._functionDef,
    // $._unionDef,
    // $._classDef

    _statement: ($) => seq($._expression, ";"),

    _expression: ($) => choice($.string, $.int),

    string: ($) => new RustRegex('"[^"]*"'),

    int: ($) => new RustRegex("[0-9]+"),
  },
});
