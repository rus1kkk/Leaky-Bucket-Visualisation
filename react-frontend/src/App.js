import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, 
  ResponsiveContainer, CartesianGrid 
} from 'recharts';
import './App.css';

// Use the base API URL from environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function App() {
  const [metrics, setMetrics] = useState({
    total: 0,
    allowed: 0,
    rejected: 0,
    current_level: 0,
    capacity: 10
  });
  
  const [history, setHistory] = useState([]);
  const [requestCount, setRequestCount] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [config, setConfig] = useState({
    capacity: 10,
    rate: '1s'
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Append /metrics to the base URL
        const response = await axios.get(`${API_BASE_URL}/metrics`);
        
        const newMetrics = response.data;
        
        setMetrics(newMetrics);
        
        // Сохраняем исторические данные (последние 30 точек)
        setHistory(prev => [
          ...prev.slice(-29), 
          {
            time: new Date(newMetrics.timestamp * 1000).toLocaleTimeString(),
            ...newMetrics
          }
        ]);
        
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [API_BASE_URL]); // Add API_BASE_URL to dependency array

  const sendRequests = async () => {
    setIsSending(true);
    
    for (let i = 0; i < requestCount; i++) {
      try {
        // Append /api to the base URL
        await fetch(`${API_BASE_URL}/api`);
      } catch (error) {
        console.error('Error sending request:', error);
      }
    }
    
    setIsSending(false);
  };

  const updateConfig = async () => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append('capacity', config.capacity);
      formData.append('rate', config.rate);

      // Append /config to the base URL
      const response = await fetch(`${API_BASE_URL}/config`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      // Сбрасываем историю при изменении конфигурации
      setHistory([]);
    } catch (error) {
      console.error('Error updating config:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const resetStats = async () => {
    setIsResetting(true);
    try {
      // Append /reset to the base URL
      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to reset statistics');
      }

      // Сбрасываем локальное состояние
      setHistory([]);
      setMetrics(prev => ({
        ...prev,
        total: 0,
        allowed: 0,
        rejected: 0
      }));
    } catch (error) {
      console.error('Error resetting statistics:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="app">
      <div className="background-animation">
        {[...Array(20)].map((_, index) => (
          <div key={index} className="drop" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 2 + 2}s`
          }}></div>
        ))}
      </div>
      <h1>Leaky Bucket Visualizer</h1>
      
      <div className="dashboard">
        <div className="chart-container main-chart">
          <h2>Bucket Level Over Time</h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <Area 
                type="monotone" 
                dataKey="current_level" 
                stroke="#007bff" 
                fill="#007bff22" 
                name="Current Level" 
                isAnimationActive={false}
              />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, metrics.capacity + 2]} 
                tickCount={metrics.capacity + 1}
                allowDecimals={false}
              />
              <Tooltip 
                formatter={(value) => [`${value} requests`, 'Current Level']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="middle-section">
        <div className="bucket-visualization">
          <div className="bucket">
            <div 
              className="water-level" 
              style={{ 
                height: `${(metrics.current_level / metrics.capacity) * 100}%` 
              }}
            ></div>
          </div>
          <div className="stats">
            <p>Current: {metrics.current_level}/{metrics.capacity}</p>
            <p>Rejected: {metrics.rejected} ({Math.round(metrics.rejected / metrics.total * 100 || 0)}%)</p>
          </div>
        </div>

        <div className="config-panel">
          <h2>Bucket Configuration</h2>
          <div className="config-form">
            <div className="form-group">
              <label>Capacity:</label>
              <input
                type="number"
                min="1"
                value={config.capacity}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  capacity: Math.max(1, parseInt(e.target.value) || 1)
                }))}
                disabled={isUpdating}
              />
            </div>
            <div className="form-group">
              <label>Rate (e.g., "1s", "500ms"):</label>
              <input
                type="text"
                value={config.rate}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  rate: e.target.value
                }))}
                disabled={isUpdating}
                placeholder="1s"
              />
            </div>
            <button 
              onClick={updateConfig}
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Configuration'}
            </button>
            <button 
              onClick={resetStats}
              disabled={isResetting}
              className="reset-button"
            >
              {isResetting ? 'Resetting...' : 'Reset Statistics'}
            </button>
          </div>
          <div className="request-controls">
            <div className="form-group">
              <label>Number of Requests:</label>
              <input
                type="number"
                min="1"
                value={requestCount}
                onChange={(e) => setRequestCount(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isSending}
              />
            </div>
            <button 
              onClick={sendRequests}
              disabled={isSending}
              className="send-button"
            >
              {isSending ? 'Sending...' : `Send ${requestCount} Request${requestCount > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <h2>Request Statistics</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[metrics]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#8884d8" name="Total Requests" />
            <Bar dataKey="allowed" fill="#82ca9d" name="Allowed" />
            <Bar dataKey="rejected" fill="#ff7300" name="Rejected" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <footer className="footer">
        <p>Made during the internship at <a href="https://itpelag.com" target="_blank" rel="noopener noreferrer">ITpelag</a></p>
        <a href="https://github.com/rus1kkk" target="_blank" rel="noopener noreferrer" className="github-link">
          <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
          </svg>
          GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;