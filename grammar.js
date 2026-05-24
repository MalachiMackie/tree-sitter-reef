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

    _expression: ($) => choice($.string, $.int, $.variable_declaration),

    variable_declaration: ($) =>
      seq(
        "var",
        field("name", $.identifier),
        field("type", optional(seq(":", $.identifier))),
        field("value", optional(seq("=", $._expression))),
      ),

    identifier: ($) => new RustRegex("[a-zA-Z_][a-zA-Z_0-9]*"),

    string: ($) => new RustRegex('"[^"]*"'),

    int: ($) => new RustRegex("[0-9]+"),
  },
});
