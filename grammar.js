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

  reserved: {
    global: ($) => [
      "attribute",
      "todo!",
      "use",
      "extern",
      "where",
      "union",
      "unboxed",
      "boxed",
      "grab",
      "mut",
      "while",
      "break",
      "continue",
      "match",
      "matches",
      "new",
      "static",
      "class",
      "pub",
      "fn",
      "field",
      "var",
      "if",
      "else",
      "return",
      "true",
      "false",
    ],
  },

  word: ($) => $.identifier,

  extras: ($) => [/\s/, $.comment],

  rules: {
    source_file: ($) => repeat(choice($._definition, $._statement)),

    comment: ($) =>
      token(
        choice(seq("//", /.*/), seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),
      ),

    _definition: ($) =>
      choice(
        $.function_definition,
        $.class_definition,
        $.union_definition,
        $.attribute_definition,
      ),

    modifier: ($) => choice("extern", "pub", "mut", "static"),

    function_definition: ($) =>
      // prec.right so that function_declaration will consume a block instead of allowing it to become it's own statement
      prec.right(
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

    member_list: ($) => seq("{", repeat(seq($._member, optional(","))), "}"),

    _member: ($) => choice($.field, $.function_definition, $._variant),

    _variant: ($) => choice($.unit_variant, $.tuple_variant, $.class_variant),

    unit_variant: ($) => field("name", $.identifier),

    tuple_variant: ($) =>
      seq(
        field("name", $.identifier),
        field(
          "tuple_members",
          seq("(", comma_separated_list($._type_identifier), ")"),
        ),
      ),

    class_variant: ($) =>
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
        field("type", $._type_identifier),
        field("value", optional(seq("=", $._expression))),
      ),

    type_constraint_list: ($) => repeat1($.type_constraint),

    type_constraint: ($) =>
      seq(
        "where",
        $.identifier,
        ":",
        choice($._type_identifier, $.boxing_specifier),
      ),

    boxing_specifier: ($) => choice("boxed", "unboxed"),

    return_type: ($) => seq(":", optional($.modifier), $._type_identifier),

    attribute: ($) =>
      seq(
        "#",
        "[",
        choice(
          field("name", $.identifier),
          seq(
            optional(":::"),
            field(
              "module_path",
              seq($.identifier, repeat(seq(":::", $.identifier))),
            ),
            ":::",
            field("name", $.identifier),
          ),
        ),
        "]",
      ),

    attribute_definition: ($) =>
      seq(
        optional($.modifier),
        "attribute",
        field("name", $.identifier),
        "{",
        "}",
      ),

    modifier_list: ($) => repeat1($.modifier),

    block: ($) => seq("{", repeat(choice($._statement, $._definition)), "}"),

    type_parameter_list: ($) =>
      seq("<", comma_separated_list($.identifier), ">"),

    parameter_list: ($) => seq("(", comma_separated_list($.parameter), ")"),

    parameter: ($) =>
      seq(
        optional($.modifier),
        field("name", $.identifier),
        ":",
        $._type_identifier,
      ),

    _statement: ($) =>
      prec(
        -1,
        choice(
          // no semicolon needed
          $._block_expression,
          // semicolons needed
          seq(optional(choice($._non_block_expression, $.use_statement)), ";"),
        ),
      ),

    // expressions that don't need a semicolon to be a statement
    _block_expression: ($) => choice($.block, $.match, $.if, $.while),

    // expressions that need a semicolon to be a statement
    _non_block_expression: ($) =>
      choice(
        $.string,
        $.todo,
        $.grab,
        $.prefix_unary_operator,
        $.postfix_unary_operator,
        $.type_identifier_expression,
        $.index,
        $.break,
        $.collection,
        $.collection_fill,
        $.continue,
        $.int,
        $.bool,
        $.tuple,
        $.matches,
        $.variable_declaration,
        $.variable_access,
        $.member_access,
        $.static_member_access,
        $.return,
        $.method_call,
        $.binary_operator,
        $.object_initializer,
      ),

    grab: ($) => prec(-1, seq("grab", $._expression)),

    prefix_unary_operator: ($) =>
      prec(-1, seq(choice("-", "!"), $._expression)),

    postfix_unary_operator: ($) => prec(-2, seq($._expression, "?")),

    collection: ($) =>
      seq(
        "[",
        optional(seq($.boxing_specifier, ";")),
        comma_separated_list($._expression),
        "]",
      ),

    collection_fill: ($) =>
      seq(
        "[",
        optional(seq($.boxing_specifier, ";")),
        field("value", $._expression),
        ";",
        field("length", $._expression),
        "]",
      ),

    if: ($) =>
      prec.right(
        0,
        seq(
          "if",
          "(",
          field("check", $._expression),
          ")",
          field("body", $._expression),
          field("else_ifs", repeat($.else_if)),
          optional(seq("else", field("else", $._expression))),
        ),
      ),

    else_if: ($) =>
      prec.right(
        1,
        seq(
          "else",
          "if",
          "(",
          field("check", $._expression),
          ")",
          field("body", $._expression),
        ),
      ),

    binary_operator: ($) =>
      prec.left(
        seq(
          $._expression,
          choice(
            "+",
            "-",
            "*",
            "/",
            ">",
            "<",
            "<=",
            ">=",
            "&&",
            "||",
            "=",
            "==",
            "!=",
          ),
          $._expression,
        ),
      ),

    return: ($) =>
      prec.left(seq("return", field("value", optional($._expression)))),

    use_statement: ($) => seq("use", optional(":::"), $.use_segment),

    star: ($) => "*",

    use_segment: ($) =>
      seq(
        $.identifier,
        optional(
          seq(
            ":::",
            choice(
              $.use_segment,
              seq("{", comma_separated_list($.use_segment), "}"),
              $.star,
            ),
          ),
        ),
      ),

    _expression: ($) => choice($._block_expression, $._non_block_expression),

    index: ($) =>
      seq(
        field("owner", $._expression),
        "[",
        field("index", $._expression),
        "]",
      ),

    variable_access: ($) =>
      prec.right(
        2,
        seq(
          choice(
            field("name", $.identifier),
            seq(
              optional(":::"),
              field(
                "module_path",
                seq($.identifier, repeat(seq(":::", $.identifier))),
              ),
              ":::",
              field("name", $.identifier),
            ),
          ),
          field("type_arguments", optional($._type_argument_list)),
        ),
      ),

    static_member_access: ($) =>
      seq(
        field("owner_type", $._type_identifier),
        "::",
        field("member_name", $.identifier),
        field("type_arguments", optional($._type_argument_list)),
      ),

    _type_argument_list: ($) =>
      seq("::<", comma_separated_list($._type_identifier), ">"),

    member_access: ($) =>
      seq(
        field("owner", $._expression),
        ".",
        field("member_name", $.identifier),
        field("type_arguments", optional($._type_argument_list)),
      ),

    method_call: ($) =>
      prec(
        4,
        seq(
          field("method", $._expression),
          "(",
          field("arguments", comma_separated_list($._expression)),
          ")",
        ),
      ),

    matches: ($) =>
      seq(
        field("check", $._expression),
        "matches",
        field("pattern", $._pattern),
      ),

    match: ($) =>
      seq(
        "match",
        "(",
        field("check", $._expression),
        ")",
        "{",
        comma_separated_list($.match_arm),
        "}",
      ),

    match_arm: ($) => seq($._pattern, "=>", $._expression),

    _pattern: ($) =>
      choice(
        $.discard_pattern,
        $.variable_declaration_pattern,
        $.type_pattern,
        $.class_pattern,
        $.union_variant_pattern,
        $.union_tuple_variant_pattern,
        $.union_class_variant_pattern,
      ),

    discard_pattern: ($) => "_",

    variable_declaration_pattern: ($) =>
      seq("var", optional($.modifier), field("variable_name", $.identifier)),

    type_identifier_expression: ($) => prec(-1, $._type_identifier),

    type_pattern: ($) =>
      prec.right(
        0,
        seq(
          field("type", $._type_identifier),
          optional(
            seq(
              "var",
              optional($.modifier),
              field("variable_name", $.identifier),
            ),
          ),
        ),
      ),

    class_pattern: ($) =>
      prec.right(
        1,
        seq(
          field("type", $._type_identifier),
          "{",
          field(
            "field_patterns",
            comma_separated_list(choice("_", $.field_pattern)),
          ),
          "}",
          optional(
            seq(
              "var",
              optional($.modifier),
              field("variable_name", $.identifier),
            ),
          ),
        ),
      ),

    union_class_variant_pattern: ($) =>
      prec.right(
        3,
        seq(
          field("type", $._type_identifier),
          "::",
          field("variant", $.identifier),
          "{",
          field(
            "field_patterns",
            comma_separated_list(choice("_", $.field_pattern)),
          ),
          "}",
          optional(
            seq(
              "var",
              optional($.modifier),
              field("variable_name", $.identifier),
            ),
          ),
        ),
      ),

    union_variant_pattern: ($) =>
      prec.right(
        2,
        seq(
          field("type", $._type_identifier),
          "::",
          field("variant", $.identifier),
          optional(
            seq(
              "var",
              optional($.modifier),
              field("variable_name", $.identifier),
            ),
          ),
        ),
      ),

    union_tuple_variant_pattern: ($) =>
      prec.right(
        3,
        seq(
          field("type", $._type_identifier),
          "::",
          field("variant", $.identifier),
          "(",
          field("element_patterns", comma_separated_list($._pattern)),
          ")",
          optional(
            seq(
              "var",
              optional($.modifier),
              field("variable_name", $.identifier),
            ),
          ),
        ),
      ),

    field_pattern: ($) =>
      seq(
        field("field_name", $.identifier),
        optional(seq(":", field("pattern", $._pattern))),
      ),

    _type_identifier: ($) =>
      choice(
        $.builtin_type_identifier,
        $.named_type_identifier,
        $.array_type_identifier,
        $.tuple_type_identifier,
        $.fn_type_identifier,
      ),

    builtin_type_identifier_name: ($) =>
      choice(
        "u64",
        "u32",
        "u16",
        "u8",
        "i64",
        "i32",
        "i16",
        "i8",
        "result",
        "option",
        "string",
        "()",
      ),

    builtin_type_identifier: ($) =>
      prec.right(
        1,
        seq(
          optional($.boxing_specifier),
          choice(
            $.builtin_type_identifier_name,
            seq(
              optional(":::"),
              field(
                "module_path",
                seq($.identifier, repeat(seq(":::", $.identifier))),
              ),
              ":::",
              $.builtin_type_identifier_name,
            ),
          ),
          field("type_arguments", optional($._type_argument_list)),
        ),
      ),
    array_type_identifier: ($) =>
      prec(
        1,
        seq(
          optional($.boxing_specifier),
          "[",
          $._type_identifier,
          optional(seq(";", $.int)),
          "]",
        ),
      ),

    tuple: ($) =>
      prec.right(
        5,
        choice(
          "()",
          seq("(", optional(comma_separated_list($._expression)), ")"),
        ),
      ),

    tuple_type_identifier: ($) =>
      prec(
        3,
        seq(
          optional($.boxing_specifier),
          seq("(", comma_separated_list($._type_identifier), ")"),
        ),
      ),

    fn_type_identifier: ($) =>
      prec(
        1,
        seq(
          optional($.boxing_specifier),
          seq("Fn", $.fn_type_parameter_list, optional($.return_type)),
        ),
      ),

    fn_type_parameter_list: ($) =>
      seq("(", comma_separated_list($.fn_type_parameter), ")"),

    fn_type_parameter: ($) => seq(optional($.modifier), $._type_identifier),

    named_type_identifier: ($) =>
      prec.right(
        1,
        seq(
          optional($.boxing_specifier),
          choice(
            field("name", $.identifier),
            seq(
              optional(":::"),
              field(
                "module_path",
                seq($.identifier, repeat(seq(":::", $.identifier))),
              ),
              ":::",
              field("name", $.identifier),
            ),
          ),
          field("type_arguments", optional($._type_argument_list)),
        ),
      ),

    object_initializer: ($) =>
      seq(
        "new",
        field("type", $._type_identifier),
        field("variant", optional(seq("::", $.identifier))),
        "{",
        field("field_initializers", comma_separated_list($.field_initializer)),
        "}",
      ),

    field_initializer: ($) =>
      seq(
        field("field_name", $.identifier),
        "=",
        field("value", $._expression),
      ),

    variable_declaration: ($) =>
      prec.right(
        seq(
          "var",
          optional($.modifier),
          field("name", $.identifier),
          field("type", optional(seq(":", $._type_identifier))),
          field("value", optional(seq("=", $._expression))),
        ),
      ),

    break: ($) => "break",

    continue: ($) => "continue",

    while: ($) =>
      seq(
        "while",
        "(",
        field("check", $._expression),
        ")",
        field("body", $.block),
      ),

    identifier: ($) => /[a-zA-Z_][a-zA-Z_0-9]*/,

    string: ($) =>
      seq('"', repeat(choice($.string_fragment, $.escape_sequence)), '"'),

    string_fragment: ($) => /[^"\\]+/,

    escape_sequence: ($) => /\\./,

    int: ($) => /[0-9]+/,

    bool: ($) => choice("true", "false"),

    todo: ($) => "todo!",
  },
});
