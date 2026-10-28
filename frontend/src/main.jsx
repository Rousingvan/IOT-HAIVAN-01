import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

/**
 * ==============================================================================
 * FILE: main.jsx
 * CHỨC NĂNG:
 * - Điểm khởi động (Entry Point) của ứng dụng React Vite.
 * - Render Component gốc <App /> vào thẻ DOM <div id="root"> trong index.html.
 * - Nạp toàn bộ file CSS toàn cục (index.css).
 * - React.StrictMode: Kích hoạt chế độ kiểm tra nghiêm ngặt của React giúp phát hiện
 *   các cảnh báo, hàm deprecated và side-effect trong quá trình phát triển (Development).
 * ==============================================================================
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
