package testutil

// Ptr returns a pointer to the value passed in.
// Supports any type (string, int, bool, structs, etc.)
func Ptr[T any](v T) *T {
	return &v
}
