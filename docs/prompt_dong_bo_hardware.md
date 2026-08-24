# BỘ PROMPT ĐỒNG BỘ CẤU HÌNH & KỊCH BẢN VẤN ĐÁP THIẾT BỊ MỚI

Tài liệu này cung cấp các đoạn hướng dẫn nhanh và kịch bản thuyết minh đồ án IoT PTIT 2026.

---

## 1. HƯỚNG DẪN ĐỒNG BỘ ĐỊA CHỈ IP BROKER KHI LÊN PHÒNG LAB
Khi mang laptop và mạch ESP32 lên phòng Lab chấm điểm:
1. Mở PowerShell trên laptop gõ: `ipconfig` $\rightarrow$ Lấy địa chỉ `IPv4 Address` (VD: `192.168.1.150`).
2. Mở file `hardware/firmware/iot_ptit_firmware/config.h` $\rightarrow$ Sửa `#define MQTT_SERVER "192.168.1.150"`.
3. Nạp lại code vào ESP32 qua Arduino IDE.
4. Trên Laptop, khởi động Mosquitto Broker và Backend Server. ESP32 sẽ tự động kết nối và đẩy dữ liệu tức thì!

---

## 2. KỊCH BẢN VẤN ĐÁP: "NẾU MUỐN THÊM 1 THIẾT BỊ MỚI (VÍ DỤ: MÁY BƠM NƯỚC) THÌ LÀM THẾ NÀO?"

**Sinh viên trả lời tự tin theo 4 bước module hóa:**

> *"Thưa thầy, hệ thống của nhóm em được thiết kế theo kiến trúc Module Cắm và Chạy (Plug-and-Play). Để thêm 1 thiết bị mới, ví dụ Máy Bơm Nước (`PUMP_01`), nhóm em chỉ cần thực hiện 4 bước:"*
>
> 1. **Bước 1 (Phần cứng ESP32):** Cắm chân Relay của máy bơm vào chân `GPIO 25` còn trống trên ESP32. Khai báo thêm 1 dòng `{ "PUMP_01", 25, true, true }` vào mảng `DEVICES` trong file `config.h`.
> 2. **Bước 2 (Cơ sở dữ liệu):** Thêm 1 bản ghi vào bảng `devices` trong MongoDB:
>    ```json
>    {
>      "device_code": "PUMP_01",
>      "device_name": "Máy Bơm Nước",
>      "device_type": "PUMP",
>      "pin_relay": 25,
>      "is_connected": true,
>      "current_state": "OFF"
>    }
>    ```
> 3. **Bước 3 (Backend & MQTT):** Backend API và MQTT Client hoạt động hoàn toàn hướng dữ liệu (Data-Driven), tự động routing topic `esp32/device/command` với `deviceCode: PUMP_01` mà không cần viết lại mã nguồn backend.
> 4. **Bước 4 (Frontend UI):** Bảng `DevicePanel` trên Dashboard tự động gọi API `/api/devices` và render ra Card công tắc mới của Máy Bơm, sẵn sàng bật tắt và ghi nhận nhật ký vào trang Lịch sử.

---

## 3. GIẢI THÍCH TRẠNG THÁI "QUẠT CHƯA KẾT NỐI" TRÊN GIAO DIỆN
> *"Trên giao diện Dashboard hiện tại, nhóm em có sẵn Card Quạt Làm Mát (`FAN_01`) ở trạng thái **Chưa kết nối** và Switch bị vô hiệu hóa. Điều này nhằm thể hiện rõ ràng khả năng dự phòng và sẵn sàng mở rộng module của hệ thống khi cần tích hợp thêm phần cứng thực tế."*
