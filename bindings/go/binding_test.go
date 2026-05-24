package tree_sitter_reef_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_reef "github.com/malachimackie/tree-sitter-reef/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_reef.Language())
	if language == nil {
		t.Errorf("Error loading reef grammar")
	}
}
