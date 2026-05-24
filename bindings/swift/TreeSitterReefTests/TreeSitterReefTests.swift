import XCTest
import SwiftTreeSitter
import TreeSitterReef

final class TreeSitterReefTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_reef())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading reef grammar")
    }
}
