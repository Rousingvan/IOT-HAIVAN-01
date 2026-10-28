# SƠ ĐỒ NGUYÊN LÝ & ĐẤU NỐI CHÂN GPIO ESP32 - IOT PTIT 2026

## 1. Bảng Phân Phối Chân GPIO (ESP32 NodeMCU 30 Pins)

| Chân ESP32 | Linh Kiện Phần Cứng | Loại Chân | Tình Trạng Lắp Đặt Thực Tế | Ghi Chú Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| **`GPIO 4`** | Cảm biến **DHT22** | Digital I/O | ✅ **Đã lắp đặt** | Đo Nhiệt độ (-40~80°C) & Độ ẩm (0~100%). Kèm điện trở kéo lên 10kΩ vào 3.3V. |
| **`GPIO 34`** | Cảm biến **LDR** | Analog Input (ADC1) | ✅ **Đã lắp đặt** | Mạch cầu phân áp với điện trở 10kΩ nối đất (GND) để đọc điện áp ánh sáng. |
| **`GPIO 26`** | **Đèn 1 (`LAMP_01`)** | Digital Output | ✅ **Đèn LED 1 (Đỏ)** | Nối Anode vào GPIO 26 qua điện trở 220Ω, Cathode xuống GND (Active High). |
| **`GPIO 27`** | **Đèn 2 (`LAMP_02`)** | Digital Output | ✅ **Đèn LED 2 (Xanh)** | Nối Anode vào GPIO 27 qua điện trở 220Ω, Cathode xuống GND (Active High). |
| **`GPIO 2`** | **LED Onboard (`LED_ONBOARD`)** | Digital Output | ✅ **Tích hợp sẵn trên bo** | Dùng test bật/tắt thiết bị khi chưa cắm 2 LED ngoài. |
| **`VIN` / `5V`** | Nguồn cấp | Power Input | ✅ **Cấp từ USB/Adapter** | 5V - 2A ổn định. |
| **`GND`** | Nối đất chung | Common Ground | ✅ **Nối đất** | Nối đất chung cho toàn bộ cảm biến, đèn LED và ESP32. |

---

## 2. Sơ Đồ Đấu Nối Chi Tiết (ESP32 + DHT22 + LDR + 2 LED)

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
         | [GPIO 26] ---> [220Ω] ---> [LED 1: ĐỎ]  |
         |                                         |
         | [GPIO 27] ---> [220Ω] ---> [LED 2: XANH]|
         |                                         |
         | [GND] --------+--------+--------+-------+ (Common Ground)
         +-----------------------------------------+
```

---

## 3. Quy Trình Cắm Dây Khi Có 2 Đèn LED Rời:
1. Cắm chân Dương (Anode - Chân dài) của LED 1 vào **GPIO 26** qua điện trở 220Ω; Chân Âm (Cathode - Chân ngắn) nối **GND**.
2. Cắm chân Dương (Anode - Chân dài) của LED 2 vào **GPIO 27** qua điện trở 220Ω; Chân Âm (Cathode - Chân ngắn) nối **GND**.
3. Cả 2 đèn sẽ hoạt động ở chế độ Active High (`activeLow: false` trong `config.h`).
