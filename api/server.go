package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "sync"
    "time"

    "github.com/gorilla/mux"
    "github.com/gorilla/websocket"
    "github.com/joho/godotenv"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        // Implement your own CORS policy here or leave as true for testing
        return true
    },
}

var clients = make(map[*websocket.Conn]bool) // connected clients
var broadcast = make(chan Vote)              // broadcast channel

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

    // Send vote to the broadcast channel
    broadcast <- vote

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

func votingStatusHandler(w http.ResponseWriter, r *http.Request) {
    VoterCheck.RLock()
    totalVoters := len(VoterCheck.m)
    VoterCheck.RUnlock()

    VoteCount.RLock()
    totalVotes := 0
    for _, count := range VoteCount.m {
        totalVotes += count
    }
    VoteCount.RUnlock()

    status := struct {
        TotalVoters int `json:"totalVoters"`
        TotalVotes  int `json:"totalVotes"`
    }{
        TotalVoters: totalVoters,
        TotalVotes:  totalVotes,
    }

    err := json.NewEncoder(w).Encode(status)
    if err != nil {
        http.Error(w, "Error encoding voting status", http.StatusInternalServerError)
    }
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
    // Upgrade initial GET request to a WebSocket
    ws, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Fatal(err)
    }
    defer ws.Close()

    // Register our new client
    clients[ws] = true

    for {
        var vote Vote
        // Read in a new vote and ignore it
        // just keep the connection alive
        err := ws.ReadJSON(&vote)
        if err != nil {
            log.Printf("error: %v", err)
            delete(clients, ws)
            break
        }
    }
}

func handleMessages() {
    for {
        // Grab the next vote from the broadcast channel
        vote := <-broadcast
        // Send it out to every client that is currently connected
        for client := range clients {
            err := client.WriteJSON(vote)
            if err != nil {
                log.Printf("error: %v", err)
                client.Close()
                delete(clients, client)
            }
        }
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
    r.HandleFunc("/status", votingStatusHandler).Methods("GET")

    r.HandleFunc("/ws", handleConnections) // WebSocket route

    go handleMessages()

    srv := &http.Server{
        Handler:      r,
        Addr:         "127.0.0.1:" + os.Getenv("PORT"),
        WriteTimeout: 15 * time.Second,
        ReadTimeout:  15 * time.Second,
    }

    log.Fatal(srv.ListenAndServe())
}