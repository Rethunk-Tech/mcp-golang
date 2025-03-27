package main

import (
	"fmt"
)

// unusedFunction is never called and contains unreachable code
func unusedFunction() {
	fmt.Println("This function is never called")
	return
	fmt.Println("This code is unreachable")
}

func main() {
	fmt.Println("Hello, World!")
}
