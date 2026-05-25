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

    _definition: ($) =>
      choice($.function_definition, $.class_definition, $.union_definition),

    modifier: ($) => choice("extern", "pub", "mut", "static"),

    function_definition: ($) =>
      seq(
        field("attributes", repeat($.attribute)),
        field("modifiers", optional($.modifier_list)),
        "fn",
        field("name", $.identifier),
        field("type_parameters", optional($.type_parameter_list)),
        field("parameters", $.parameter_list),
        field("return_type", optional($.return_type)),
        field("type_constraints", optional($.type_constraint_list)),
        field("body", optional($.block)),
      ),

    union_definition: ($) =>
      seq(
        field("modifiers", optional($.modifier_list)),
        field("boxing_specifier", optional($.boxing_specifier)),
        "union",
        field("name", $.identifier),
        field("type_parameters", optional($.type_parameter_list)),
        field("type_constraints", optional($.type_constraint_list)),
        field("body", $.member_list),
      ),

    class_definition: ($) =>
      seq(
        field("modifiers", optional($.modifier_list)),
        field("boxing_specifier", optional($.boxing_specifier)),
        "class",
        field("name", $.identifier),
        field("type_parameters", optional($.type_parameter_list)),
        field("type_constraints", optional($.type_constraint_list)),
        field("body", $.member_list),
      ),

    member_list: ($) => seq("{", comma_separated_list($._member), "}"),

    _member: ($) => choice($.field, $.function_definition, $.variant),

    variant: ($) => choice($._unitVariant, $._tupleVariant, $._classVariant),

    _unitVariant: ($) => field("name", $.identifier),

    _tupleVariant: ($) =>
      seq(
        field("name", $.identifier),
        field(
          "tuple_members",
          seq("(", comma_separated_list($.type_identifier), ")"),
        ),
      ),

    _classVariant: ($) =>
      seq(
        field("name", $.identifier),
        field("fields", seq("{", comma_separated_list($.field), "}")),
      ),

    field: ($) =>
      seq(
        field("modifiers", optional($.modifier_list)),
        "field",
        field("name", $.identifier),
        ":",
        field("type", $.type_identifier),
        field("value", optional(seq("=", $._expression))),
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

    return_type: ($) => seq(":", optional($.modifier), $.type_identifier),

    attribute: ($) => seq("#", "[", $.identifier, "]"),

    modifier_list: ($) => repeat1($.modifier),

    block: ($) => seq("{", repeat(choice($._statement, $._definition)), "}"),

    type_parameter_list: ($) =>
      seq("<", comma_separated_list($.identifier), ">"),

    parameter_list: ($) => seq("(", comma_separated_list($.parameter), ")"),

    parameter: ($) => seq($.identifier, ":", $.type_identifier),

    _statement: ($) => seq(choice($._expression, $.use_statement), ";"),

    use_statement: ($) => seq("use", optional(":::"), $.use_segment),

    use_segment: ($) =>
      seq(
        $.identifier,
        optional(
          seq(
            ":::",
            choice(
              $.use_segment,
              seq("{", comma_separated_list($.use_segment), "}"),
              "*",
            ),
          ),
        ),
      ),

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
