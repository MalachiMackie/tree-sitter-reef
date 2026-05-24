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
    source_file: ($) => repeat(choice($._definition, $._statement)),

    _definition: ($) => choice($.function_declaration),
    // $._functionDef,
    // $._unionDef,
    // $._classDef

    modifier: ($) => choice("extern", "pub", "static"),

    function_declaration: ($) =>
      seq(
        field("attributes", repeat($.attribute)),
        field("modifiers", repeat($.modifier)),
        "fn",
        field("name", $.identifier),
        field("parameter_list", $.parameter_list),
        field("return_type", optional(seq(":", $.type_identifier))),
        field("body", $.block),
      ),

    attribute: ($) => seq("#", "[", $.identifier, "]"),

    block: ($) => seq("{", repeat($._statement), "}"),

    parameter_list: ($) =>
      seq(
        // this is more loose than reef actually allows, but this is just for syntax highlighting, so that's fine.
        // eg: both these would be parsed but are not actually valid rf
        // (, a: int)
        // (,)
        "(",
        optional($.parameter),
        repeat(seq(",", $.parameter)),
        optional(","),
        ")",
      ),

    parameter: ($) => seq($.identifier, ":", $.type_identifier),

    _statement: ($) => seq($._expression, ";"),

    _expression: ($) => choice($.string, $.int, $.variable_declaration),

    type_identifier: ($) => $.identifier, // todo: other type identifiers

    variable_declaration: ($) =>
      seq(
        "var",
        field("name", $.identifier),
        field("type", optional(seq(":", $.type_identifier))),
        field("value", optional(seq("=", $._expression))),
      ),

    identifier: ($) => new RustRegex("[a-zA-Z_][a-zA-Z_0-9]*"),

    string: ($) => new RustRegex('"[^"]*"'),

    int: ($) => new RustRegex("[0-9]+"),
  },
});
