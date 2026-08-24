# MQTT COMMUNICATION & MOCK SIMULATOR - IOT PTIT 2026

## 1. Khởi Chạy MQTT Broker Local
```bash
cd broker-config
docker compose up -d
```
Hoặc sử dụng HiveMQ Cloud / EMQX Free broker.

## 2. Khởi Chạy Trình Giả Lập ESP32 (Không cần phần cứng thật)
```bash
cd mock-simulator
npm install
# Chạy cả phát telemetry và phản hồi ACK
npm run all
```
Giúp nhóm phát triển, chạy thử giao diện và nộp bài báo cáo hoàn chỉnh ngay cả khi chưa mua linh kiện!
