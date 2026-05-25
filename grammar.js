/**
 * @file Tree sitter grammer for the reef language
 * @author Malachi Mackie
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * Creates a comma-separated list of a given rule.
 * @param {RuleOrLiteral} rule - The Tree-sitter rule to repeat.
 * @returns {RuleOrLiteral} The combined sequence rule.
 */
function comma_separated_list(rule) {
  return seq(optional(rule), repeat(seq(",", rule)), optional(","));
}

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
        field("modifiers", optional($.modifier_list)),
        "fn",
        field("name", $.identifier),
        field("type_parameter_list", optional($.type_parameter_list)),
        field("parameter_list", $.parameter_list),
        field("return_type", optional($.return_type)),
        field("type_constraints", optional($.type_constraint_list)),
        field("body", optional($.block)),
      ),

    type_constraint_list: ($) => repeat1($.type_constraint),

    type_constraint: ($) =>
      seq(
        "where",
        $.identifier,
        ":",
        $.boxing_specifier,
        optional($.type_identifier),
      ),

    boxing_specifier: ($) => choice("boxed", "unboxed"),

    return_type: ($) => seq(":", optional($.mut_specifier), $.type_identifier),

    mut_specifier: ($) => "mut",

    attribute: ($) => seq("#", "[", $.identifier, "]"),

    modifier_list: ($) => repeat1($.modifier),

    block: ($) => seq("{", repeat($._statement), "}"),

    type_parameter_list: ($) =>
      seq("<", comma_separated_list($.identifier), ">"),

    parameter_list: ($) => seq("(", comma_separated_list($.parameter), ")"),

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
