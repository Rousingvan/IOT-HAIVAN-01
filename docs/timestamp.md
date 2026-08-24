# Time Range Filter – Frontend Specification

## 1. Mục đích

Xây dựng bộ lọc thời gian cho phép người dùng tìm kiếm và thống kê dữ liệu theo một khoảng thời gian.

Bộ lọc phải hỗ trợ **nhiều mức độ chính xác về thời gian**:

* Chính xác đến **giây**.
* Chính xác đến **phút**.
* Chính xác đến **giờ**.
* Chính xác đến **ngày**.

Độ chính xác được xác định dựa trên thành phần thời gian mà người dùng nhập.

Người dùng **không bắt buộc phải nhập đầy đủ giờ, phút và giây**.

Ví dụ:

```text
17/08/2026 11:35:42
```

→ Tìm kiếm chính xác đến giây.

```text
17/08/2026 11:35
```

→ Tìm kiếm chính xác đến phút.

```text
17/08/2026 11
```

→ Tìm kiếm chính xác đến giờ.

```text
17/08/2026
```

→ Tìm kiếm chính xác đến ngày.

---

# 2. Cấu trúc bộ lọc

Bộ lọc gồm hai mốc thời gian:

```text
Start Time
End Time
```

Mỗi mốc thời gian được cấu thành từ:

```text
Date
Hour
Minute
Second
```

Ví dụ giao diện đầy đủ:

```text
Start Time
[ 17/08/2026 ] [ 11 ] : [ 35 ] : [ 42 ]

End Time
[ 17/08/2026 ] [ 11 ] : [ 50 ] : [ 15 ]

                         [ Update ]
```

Tuy nhiên, `Hour`, `Minute` và `Second` là các thành phần **có thể để trống**.

Ví dụ:

```text
[ 17/08/2026 ] [ 11 ] : [ 35 ] : [ 42 ]
```

hoặc:

```text
[ 17/08/2026 ] [ 11 ] : [ 35 ] : [    ]
```

hoặc:

```text
[ 17/08/2026 ] [ 11 ] : [    ] : [    ]
```

hoặc:

```text
[ 17/08/2026 ] [    ] : [    ] : [    ]
```

---

# 3. Quy tắc xác định độ chính xác

Frontend phải xác định **granularity** dựa trên thành phần thời gian cuối cùng mà người dùng nhập.

Thứ tự độ chính xác:

```text
Second
  ↓
Minute
  ↓
Hour
  ↓
Day
```

### Trường hợp 1 – Chính xác đến giây

Người dùng nhập đầy đủ:

```text
Date + Hour + Minute + Second
```

Ví dụ:

```text
17/08/2026 11:35:42
```

Granularity:

```text
SECOND
```

Hệ thống tìm kiếm dữ liệu chính xác trong khoảng thời gian được xác định đến giây.

---

### Trường hợp 2 – Chính xác đến phút

Người dùng nhập:

```text
Date + Hour + Minute
```

và bỏ trống `Second`.

Ví dụ:

```text
17/08/2026 11:35
```

Granularity:

```text
MINUTE
```

Điều này có nghĩa là hệ thống phải tìm toàn bộ dữ liệu thuộc phút:

```text
11:35:00
      ↓
11:35:59
```

Không được hiểu đơn giản là:

```text
11:35:00
```

vì như vậy sẽ bỏ sót các event xảy ra ở:

```text
11:35:10
11:35:27
11:35:48
```

---

### Trường hợp 3 – Chính xác đến giờ

Người dùng nhập:

```text
Date + Hour
```

và bỏ trống:

```text
Minute
Second
```

Ví dụ:

```text
17/08/2026 11
```

Granularity:

```text
HOUR
```

Hệ thống tìm toàn bộ dữ liệu trong:

```text
11:00:00
      ↓
11:59:59
```

---

### Trường hợp 4 – Chính xác đến ngày

Người dùng chỉ nhập:

```text
Date
```

và bỏ trống:

```text
Hour
Minute
Second
```

Ví dụ:

```text
17/08/2026
```

Granularity:

```text
DAY
```

Hệ thống tìm toàn bộ dữ liệu trong ngày:

```text
17/08/2026 00:00:00
      ↓
17/08/2026 23:59:59
```

---

# 4. Bảng quy tắc cho Frontend

Frontend nên implement quy tắc như sau:

| Date | Hour | Minute | Second | Granularity |
| ---- | ---- | ------ | ------ | ----------- |
| ✓    | ✓    | ✓      | ✓      | `SECOND`    |
| ✓    | ✓    | ✓      | ✗      | `MINUTE`    |
| ✓    | ✓    | ✗      | ✗      | `HOUR`      |
| ✓    | ✗    | ✗      | ✗      | `DAY`       |

Không cho phép các trạng thái không liên tục như:

```text
Date + Hour + Second
```

nhưng bỏ `Minute`.

Tức là nếu `Second` được nhập thì `Minute` và `Hour` cũng phải tồn tại.

Tương tự:

```text
Minute
```

chỉ được nhập khi đã có:

```text
Hour
```

---

# 5. Data Model

Không nên lưu thời gian dưới dạng một string duy nhất ngay từ đầu.

Frontend nên quản lý từng thành phần:

```javascript
{
  date: "2026-08-17",
  hour: "11",
  minute: "35",
  second: "42"
}
```

Đối với Start Time:

```javascript
{
  date: "2026-08-17",
  hour: "11",
  minute: "35",
  second: "42"
}
```

Đối với End Time:

```javascript
{
  date: "2026-08-17",
  hour: "11",
  minute: "50",
  second: "15"
}
```

Sau đó frontend xác định:

```javascript
granularity = "SECOND"
```

---

# 6. Xác định Granularity

Có thể sử dụng logic:

```javascript
if (second !== null && second !== "") {
    granularity = "SECOND";
}
else if (minute !== null && minute !== "") {
    granularity = "MINUTE";
}
else if (hour !== null && hour !== "") {
    granularity = "HOUR";
}
else {
    granularity = "DAY";
}
```

Đây là quy tắc quan trọng nhất mà agent frontend phải tuân thủ.

---

# 7. Chuyển đổi thành khoảng thời gian tìm kiếm

Vì database/log thường lưu timestamp đầy đủ đến milliseconds hoặc seconds, frontend/backend phải chuyển mức độ chính xác của người dùng thành **một khoảng thời gian**.

### SECOND

User:

```text
17/08/2026 11:35:42
```

Query range:

```text
Start:
2026-08-17 11:35:42

End:
2026-08-17 11:35:42
```

Hoặc tùy backend có thể biểu diễn bằng:

```text
[11:35:42, 11:35:43)
```

để tránh vấn đề với milliseconds.

---

### MINUTE

User:

```text
17/08/2026 11:35
```

Query range:

```text
Start:
2026-08-17 11:35:00

End:
2026-08-17 11:35:59
```

Hoặc theo interval:

```text
[11:35:00, 11:36:00)
```

---

### HOUR

User:

```text
17/08/2026 11
```

Query range:

```text
Start:
2026-08-17 11:00:00

End:
2026-08-17 11:59:59
```

Hoặc:

```text
[11:00:00, 12:00:00)
```

---

### DAY

User:

```text
17/08/2026
```

Query range:

```text
Start:
2026-08-17 00:00:00

End:
2026-08-17 23:59:59
```

Hoặc:

```text
[2026-08-17 00:00:00, 2026-08-18 00:00:00)
```

**Khuyến nghị:** sử dụng khoảng thời gian dạng `[start, end)` ở tầng API/query để tránh lỗi ở milliseconds.

---

# 8. Start Time và End Time

Khi sử dụng khoảng thời gian, cần áp dụng cùng một nguyên tắc cho cả `Start Time` và `End Time`.

Ví dụ:

```text
Start:
17/08/2026 11:35

End:
17/08/2026 11:50
```

Có nghĩa:

```text
11:35:00
        ↓
11:50:59
```

Nếu người dùng nhập:

```text
Start:
17/08/2026

End:
17/08/2026
```

thì hệ thống hiểu là:

```text
17/08/2026 00:00:00
        ↓
18/08/2026 00:00:00
```

theo interval `[start, end)`.

---

# 9. Validation

Frontend phải kiểm tra tính liên tục của các thành phần thời gian.

### Không hợp lệ

```text
Date = 17/08/2026
Hour = 11
Minute = empty
Second = 42
```

Hiển thị:

```text
Second requires Minute to be specified.
```

### Không hợp lệ

```text
Date = 17/08/2026
Hour = empty
Minute = 35
Second = empty
```

Hiển thị:

```text
Minute requires Hour to be specified.
```

### Hợp lệ

```text
17/08/2026
```

### Hợp lệ

```text
17/08/2026 11
```

### Hợp lệ

```text
17/08/2026 11:35
```

### Hợp lệ

```text
17/08/2026 11:35:42
```

---

# 10. API Request

API nên nhận cả timestamp và granularity.

Ví dụ tìm kiếm đến giây:

```json
{
  "startTime": "2026-08-17T11:35:42",
  "endTime": "2026-08-17T11:50:15",
  "granularity": "SECOND"
}
```

Tìm kiếm đến phút:

```json
{
  "startTime": "2026-08-17T11:35:00",
  "endTime": "2026-08-17T11:50:00",
  "granularity": "MINUTE"
}
```

Tìm kiếm đến giờ:

```json
{
  "startTime": "2026-08-17T11:00:00",
  "endTime": "2026-08-17T11:00:00",
  "granularity": "HOUR"
}
```

Tìm kiếm theo ngày:

```json
{
  "startTime": "2026-08-17T00:00:00",
  "endTime": "2026-08-17T00:00:00",
  "granularity": "DAY"
}
```

**Lưu ý:** backend nên là nơi cuối cùng quyết định cách mở rộng `startTime/endTime` thành khoảng query thực tế. Frontend có thể gửi `granularity` để backend biết chính xác ý định của người dùng.

---

# 11. UX của Time Picker

Thay vì bắt buộc người dùng phải chọn đầy đủ:

```text
HH : MM : SS
```

frontend phải cho phép bỏ trống các trường:

```text
HH : MM : SS
```

Ví dụ:

```text
[11] : [35] : [42]
```

```text
[11] : [35] : [  ]
```

```text
[11] : [  ] : [  ]
```

```text
[  ] : [  ] : [  ]
```

Tuy nhiên, Date luôn bắt buộc.

---

# 12. Flow xử lý

```text
User selects Date
        ↓
User optionally enters Hour
        ↓
User optionally enters Minute
        ↓
User optionally enters Second
        ↓
Frontend validates time components
        ↓
Determine Granularity
        ↓
Convert input → Search Time Range
        ↓
Validate Start <= End
        ↓
User clicks Update
        ↓
Send request to API
        ↓
Backend executes time-range query
        ↓
Return statistics
        ↓
Frontend updates results
```

---

# 13. Ví dụ thực tế

### Tìm kiếm theo giây

```text
Start: 17/08/2026 11:35:20
End:   17/08/2026 11:35:40
```

→ Lấy dữ liệu trong khoảng **20 giây**.

---

### Tìm kiếm theo phút

```text
Start: 17/08/2026 11:35
End:   17/08/2026 11:40
```

→ Lấy dữ liệu từ:

```text
11:35:00
đến
11:40:59
```

---

### Tìm kiếm theo giờ

```text
Start: 17/08/2026 11
End:   17/08/2026 14
```

→ Lấy dữ liệu từ:

```text
11:00:00
đến
14:59:59
```

---

### Tìm kiếm theo ngày

```text
Start: 17/08/2026
End:   19/08/2026
```

→ Lấy dữ liệu từ:

```text
17/08/2026 00:00:00
đến
19/08/2026 23:59:59
```

---

# 14. Acceptance Criteria

* [ ] Cho phép chọn ngày.
* [ ] Cho phép nhập/chọn giờ.
* [ ] Cho phép nhập/chọn phút.
* [ ] Cho phép nhập/chọn giây.
* [ ] Giờ, phút, giây có thể để trống.
* [ ] Nếu có giây thì bắt buộc phải có phút và giờ.
* [ ] Nếu có phút thì bắt buộc phải có giờ.
* [ ] Không bắt buộc phải nhập giờ.
* [ ] Xác định đúng `SECOND`, `MINUTE`, `HOUR`, `DAY`.
* [ ] Tìm kiếm đến giây phải giữ nguyên độ chính xác đến giây.
* [ ] Tìm kiếm đến phút phải bao phủ toàn bộ phút.
* [ ] Tìm kiếm đến giờ phải bao phủ toàn bộ giờ.
* [ ] Tìm kiếm theo ngày phải bao phủ toàn bộ ngày.
* [ ] Kiểm tra `Start Time <= End Time`.
* [ ] Không gọi API trước khi người dùng nhấn `Update`.
* [ ] Gửi `granularity` cùng với khoảng thời gian cho backend.
* [ ] Xử lý timezone thống nhất giữa frontend và backend.

# 15. Quy tắc cốt lõi cho Agent Code

Agent cần hiểu bộ lọc này không phải chỉ là một `DateTimePicker` thông thường.

**Đây là một Time Range Filter có variable time precision.**

Quy tắc:

```text
Date
  └── Hour
       └── Minute
            └── Second
```

Người dùng càng nhập sâu xuống bên phải thì kết quả càng chính xác:

```text
Date
 ↓
DAY

Date + Hour
 ↓
HOUR

Date + Hour + Minute
 ↓
MINUTE

Date + Hour + Minute + Second
 ↓
SECOND
```

**Không được tự động điền `00` vào các trường mà người dùng bỏ trống rồi coi đó là thời gian chính xác.**

Ví dụ:

```text
User nhập:

17/08/2026 11:35
```

Không được hiểu là:

```text
17/08/2026 11:35:00
```

mà phải hiểu là:

```text
17/08/2026 11:35:00
        ↓
17/08/2026 11:35:59
```

Tương tự:

```text
User nhập:

17/08/2026
```

phải được hiểu là:

```text
17/08/2026 00:00:00
        ↓
17/08/2026 23:59:59
```

Mục tiêu cuối cùng là đảm bảo **độ chính xác tìm kiếm phản ánh đúng mức độ thời gian mà người dùng đã nhập**, thay vì ép mọi input thành một timestamp đầy đủ.
