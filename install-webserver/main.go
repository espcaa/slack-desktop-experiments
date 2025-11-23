package main

import (
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

func main() {
	// chi server to serve installer binary + inject.js file

	r := chi.NewRouter()

	r.Use(middleware.Logger)

	r.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		file := r.URL.Path[1:]
		if file == "" {
			file = "index.html"
		}
		http.ServeFile(w, r, "./assets/"+file)
	})

	log.Println("Starting web server on :8080")
	err := http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatal(err)
	}
}
