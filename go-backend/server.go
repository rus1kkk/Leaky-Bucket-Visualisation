package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync/atomic"
	"time"
)

var (
	bucket *LeakyBucket

	// Статистика
	totalRequests uint64
	allowed       uint64
	rejected      uint64
)

func main() {
	// Get port from environment variable or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Инициализация с параметрами: 10 запросов, утечка 1/сек
	bucket = NewLeakyBucket(10, time.Second)

	// Configure CORS
	http.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
		handleCORS(w, r)
		if r.Method == http.MethodGet {
			metricsHandler(w, r)
		}
	})

	http.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
		handleCORS(w, r)
		if r.Method == http.MethodGet {
			apiHandler(w, r)
		}
	})

	http.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
		handleCORS(w, r)
		if r.Method == http.MethodPost {
			configHandler(w, r)
		}
	})

	http.HandleFunc("/reset", func(w http.ResponseWriter, r *http.Request) {
		handleCORS(w, r)
		if r.Method == http.MethodPost {
			resetHandler(w, r)
		}
	})

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handleCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
}

func apiHandler(w http.ResponseWriter, r *http.Request) {
	atomic.AddUint64(&totalRequests, 1)

	if bucket.Allow() {
		atomic.AddUint64(&allowed, 1)
		w.Write([]byte("Request processed"))
	} else {
		atomic.AddUint64(&rejected, 1)
		http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
	}
}

func metricsHandler(w http.ResponseWriter, r *http.Request) {
	current, capacity := bucket.Status()

	response := map[string]interface{}{
		"timestamp":     time.Now().Unix(),
		"total":         atomic.LoadUint64(&totalRequests),
		"allowed":       atomic.LoadUint64(&allowed),
		"rejected":      atomic.LoadUint64(&rejected),
		"current_level": current,
		"capacity":      capacity,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func configHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	capacity := r.FormValue("capacity")
	rate := r.FormValue("rate")

	// Преобразование строковых значений в нужные типы
	newCapacity, err := strconv.Atoi(capacity)
	if err != nil {
		http.Error(w, "Invalid capacity value", http.StatusBadRequest)
		return
	}

	newRate, err := time.ParseDuration(rate)
	if err != nil {
		http.Error(w, "Invalid rate value", http.StatusBadRequest)
		return
	}

	// Обновляем конфигурацию bucket
	bucket = NewLeakyBucket(newCapacity, newRate)

	w.Write([]byte("Configuration updated"))
}

func resetHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	atomic.StoreUint64(&totalRequests, 0)
	atomic.StoreUint64(&allowed, 0)
	atomic.StoreUint64(&rejected, 0)

	w.Write([]byte("Statistics reset"))
}
