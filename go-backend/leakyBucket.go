package main

import (
	"sync"
	"time"
)

type LeakyBucket struct {
	capacity     int
	leakRate     time.Duration
	lastLeakTime time.Time
	drops        int
	mu           sync.Mutex
	stopChan     chan struct{}
}

func NewLeakyBucket(capacity int, leakRate time.Duration) *LeakyBucket {
	bucket := &LeakyBucket{
		capacity:     capacity,
		leakRate:     leakRate,
		lastLeakTime: time.Now(),
		drops:        0,
		stopChan:     make(chan struct{}),
	}
	
	// Запускаем фоновую обработку
	go bucket.processRequests()
	
	return bucket
}

func (b *LeakyBucket) processRequests() {
	ticker := time.NewTicker(b.leakRate)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			b.mu.Lock()
			if b.drops > 0 {
				b.drops--
			}
			b.mu.Unlock()
		case <-b.stopChan:
			return
		}
	}
}

func (b *LeakyBucket) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.drops >= b.capacity {
		return false
	}

	b.drops++
	return true
}

func (b *LeakyBucket) Status() (int, int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.drops, b.capacity
}

func (b *LeakyBucket) Stop() {
	close(b.stopChan)
}
