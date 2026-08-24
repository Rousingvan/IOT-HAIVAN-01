# SƠ ĐỒ NGUYÊN LÝ & ĐẤU NỐI CHÂN GPIO ESP32 - IOT PTIT 2026

## 1. Bảng Phân Phối Chân GPIO (ESP32 NodeMCU 30 Pins)

| Chân ESP32 | Linh Kiện Phần Cứng | Loại Chân | Tình Trạng Lắp Đặt Thực Tế | Ghi Chú Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| **`GPIO 4`** | Cảm biến **DHT22** | Digital I/O | ✅ **Đã lắp đặt** | Đo Nhiệt độ (-40~80°C) & Độ ẩm (0~100%). Kèm điện trở kéo lên 10kΩ vào 3.3V. |
| **`GPIO 34`** | Cảm biến **LDR** | Analog Input (ADC1) | ✅ **Đã lắp đặt** | Mạch cầu phân áp với điện trở 10kΩ nối đất (GND) để đọc điện áp ánh sáng. |
| **`GPIO 26`** | **Relay 1 - Đèn (`LAMP_01`)** | Digital Output | ✅ **Đã lắp đặt thực tế** | Kích mức Thấp/Cao để đóng mở tiếp điểm nguồn bóng đèn 220V/12V. |
| **`GPIO 27`** | **Relay 2 - Quạt (`FAN_01`)** | Digital Output | ⏳ **Chân dự phòng mở rộng (Reserved)** | Sẵn sàng đấu nối thêm Relay quạt làm mát khi nâng cấp hệ thống. |
| **`GPIO 2`** | **LED Onboard** | Digital Output | ✅ **Tích hợp sẵn** | Nhấp nháy khi đang kết nối WiFi/MQTT, sáng liên tục khi đã sẵn sàng. |
| **`VIN` / `5V`** | Nguồn cấp | Power Input | ✅ **Cấp từ USB/Adapter** | 5V - 2A ổn định. |
| **`GND`** | Nối đất chung | Common Ground | ✅ **Nối đất** | Nối đất chung cho toàn bộ cảm biến, relay và vi điều khiển. |

---

## 2. Sơ Đồ Đấu Nối Chi Tiết

```
         +-----------------------------------------+
         |               ESP32 DevKit              |
         |                                         |
         | [3V3] --------+--------+                |
         |               |        |                |
         |             [10k]    [10k]              |
         |               |        |                |
         | [GPIO 4] -----+        |  (DHT22 DATA)  |
         |                        |                |
         | [GPIO 34] -------------+  (LDR DIVIDER) |
         |                                         |
         | [GPIO 26] ----------------------------> [Relay 1: ĐÈN (Đã Lắp)]
         |                                         |
         | [GPIO 27] ----------------------------> [Relay 2: QUẠT (Dự Phòng)]
         |                                         |
         | [GND] --------+--------+----------------+ (Common Ground)
         +-----------------------------------------+
```

---

## 3. Quy Trình Nâng Cấp Khi Lắp Thêm Quạt (Hoặc Thiết Bị Mới):
1. Nối chân IN của Relay 2 vào chân **`GPIO 27`** của ESP32.
2. Cấp nguồn VCC (5V) và GND từ mạch nguồn chung.
3. Trong database hoặc trang Admin, bật trường `is_connected: true` cho thiết bị `FAN_01`.
4. Giao diện Web lập tức mở khóa (enable) công tắc Quạt và sẵn sàng điều khiển!
