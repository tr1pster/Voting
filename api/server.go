package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

type Vote struct {
	VoterID string `json:"voterId"`
	Choice  string `json:"choice"`
}

var VoteCount = struct {
	sync.RWMutex
	m map[string]int
}{m: make(map[string]int)}

var VoterCheck = struct {
	sync.RWMutex
	m map[string]bool
}{m: make(map[string]bool)}

func voteHandler(w http.ResponseWriter, r *http.Request) {
	var vote Vote
	if err := json.NewDecoder(r.Body).Decode(&vote); err != nil {
		http.Error(w, "Error decoding vote", http.StatusBadRequest)
		return
	}

	VoterCheck.RLock()
	if _, voted := VoterCheck.m[vote.VoterID]; voted {
		VoterCheck.RUnlock()
		http.Error(w, "Voter has already voted", http.StatusForbidden)
		return
	}
	VoterCheck.RUnlock()

	VoterCheck.Lock()
	VoterCheck.m[vote.VoterID] = true
	VoterCheck.Unlock()

	VoteCount.Lock()
	VoteCount.m[vote.Choice]++
	VoteCount.Unlock()

	w.WriteHeader(http.StatusOK)
}

func resultsHandler(w http.ResponseWriter, r *http.Request) {
	VoteCount.RLock()
	defer VoteCount.RUnlock()

	err := json.NewEncoder(w).Encode(VoteCount.m)
	if err != nil {
		http.Error(w, "Error encoding results", http.StatusInternalServerError)
	}
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	r := mux.NewRouter()
	r.HandleFunc("/vote", voteHandler).Methods("POST")
	r.HandleFunc("/results", resultsHandler).Methods("GET")

	srv := &http.Server{
		Handler:      r,
		Addr:         "127.0.0.1:" + os.Getenv("PORT"),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Fatal(srv.ListenAndServe())
}