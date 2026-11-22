/**
 * Lộ trình 7 Chương — 20 Bài tập Thực hành ESP32 Cơ bản (Từ Số 0 đến Thành thạo)
 * & 6 Chuyên đề Kiến thức Nền tảng Cốt lõi.
 * Mỗi bài tập đều có mục "Luyện tập nhuần nhuyễn 3 cấp độ" (Practice Drills) kèm gợi ý/đáp án.
 */

const CORE_CONCEPTS = [
  {
    id: 'logic-3v3-5v',
    icon: '⚡',
    title: 'Mức logic 3.3V vs 5V & Cầu phân áp bảo vệ ESP32',
    badge: 'Sống còn',
    summary:
      'Vì sao Arduino Uno dùng 5V mà ESP32 lại chỉ dùng 3.3V, và làm sao đấu cảm biến 5V không làm cháy chip?',
    body: [
      'Chip ESP32 sử dụng tiến trình bán dẫn 40nm nên toàn bộ chân GPIO chỉ hoạt động ở dải điện áp 0V – 3.3V (Mức LOW ≈ 0V, Mức HIGH ≈ 3.3V). Khác với Arduino Uno chịu được 5V, ESP32 KHÔNG phải loại chịu áp 5V (not 5V-tolerant).',
      'Khi ESP32 GỬI tín hiệu sang thiết bị 5V (như chân Trig của HC-SR04 hoặc dây Signal của Servo SG90): Mức HIGH 3.3V của ESP32 lớn hơn ngưỡng nhận mức 1 của mạch TTL 5V (>2.0V), nên nối trực tiếp được!',
      'Ngược lại, khi thiết bị 5V TRẢ tín hiệu về ESP32 (như chân Echo của HC-SR04 hoặc TX của module 5V): Điện áp 5V đi thẳng vào GPIO vượt ngưỡng 3.6V có thể làm hỏng cổng vào. Hãy dùng cầu phân áp 1kΩ + 2kΩ để hạ từ 5V xuống 3.33V.',
    ],
    formula: 'Cầu phân áp: V_out = V_in × R2 / (R1 + R2)  |  R1 = 1kΩ, R2 = 2kΩ → 5V × 2 / 3 = 3.33V (An toàn!)',
    tip: 'Luôn kiểm tra bằng đồng hồ VOM nếu thấy chữ "VCC 5V" trên cảm biến — hoặc dùng mạch chuyển mức logic 3.3V↔5V.',
  },
  {
    id: 'pullup-debounce',
    icon: '🔘',
    title: 'Điện trở kéo (Pull-up / Pull-down) & Chống dội phím',
    badge: 'Digital Input',
    summary:
      'Tại sao không đấu công tắc mà `digitalRead()` lại tự nhảy 0-1 loạn xạ? Và tại sao bật `INPUT_PULLUP` thì bấm nút lại đọc ra `LOW`?',
    body: [
      'Trạng thái thả nổi (Floating): Một chân GPIO ở chế độ `INPUT` thuần túy có trở kháng cực lớn. Nếu dây nối để hở, nó thu nhiễu điện từ trong không khí như chiếc ăng-ten khiến giá trị đọc lúc 0 lúc 1 ngẫu nhiên.',
      'Kéo lên (Pull-up): Bật `pinMode(PIN, INPUT_PULLUP)` sẽ nối một điện trở ~45kΩ bên trong chip từ chân GPIO lên nguồn 3.3V. Lúc thả nút, chân giữ chắc mức HIGH (3.3V). Khi ấn nút nối chân xuống GND, áp tụt về 0V (LOW) — đó là lý do logic bị đảo ngược (Nhấn = LOW)!',
      'Dội phím cơ học (Switch Bounce): Lá đồng trong nút bấm nảy đàn hồi khi tiếp xúc, tạo 5–20 lần đóng-ngắt giả trong vài mili-giây đầu tiên. Dùng `millis()` khóa đọc lại trong 50ms để chỉ đếm đúng 1 lần bấm.',
    ],
    formula: 'Ngoại lệ: 4 chân GPIO 34, 35, 36 (VP), 39 (VN) trên ESP32 Classic KHÔNG CÓ pull-up/pull-down nội bộ!',
    tip: 'Với 4 chân Input-Only (34–39), nếu muốn đọc nút nhấn bạn phải tự hàn thêm 1 điện trở 10kΩ từ chân đó lên nguồn 3V3.',
  },
  {
    id: 'adc-12bit-wifi',
    icon: '📊',
    title: 'Bản chất ADC 12-bit (0–4095) & Xung đột ADC2 với Wi-Fi',
    badge: 'Analog',
    summary:
      'Cách ESP32 biến điện áp liên tục thành con số 0–4095 và cạm bẫy khiến người mới bị lỗi `analogRead()` khi bật Wi-Fi.',
    body: [
      'Trong khi Arduino Uno dùng ADC 10-bit (0–1023), ESP32 sở hữu bộ ADC 12-bit cho độ mịn gấp 4 lần: từ 0 (ứng với 0V) đến 4095 (ứng với ~3.3V).',
      'ESP32 có 2 bộ chuyển đổi độc lập là **ADC1** và **ADC2**. Tuy nhiên, bộ **ADC2** bị bộ thu phát **Wi-Fi** chiếm dụng tài nguyên phần cứng bên trong! Ngay khi bạn gọi `WiFi.begin()` hoặc `esp_now_init()`, mọi lệnh `analogRead()` trên các chân ADC2 sẽ trả về lỗi.',
      'Ngoài ra, ADC của ESP32 hơi bị phi tuyến (cong) ở 2 đầu rất gần 0V (<0.15V) và rất gần 3.3V (>3.1V). Khi cần đo chính xác điện áp pin, nên dùng hàm `analogReadMilliVolts(pin)` có sẵn hiệu chuẩn từ nhà máy Espressif!',
    ],
    formula: 'Điện áp thực ≈ (Giá_trị_ADC / 4095.0) × 3.3V  |  Hoặc dùng `analogReadMilliVolts(pin)` trả về mV chuẩn',
    tip: 'Quy tắc thép: Đọc biến trở, Joystick, đo áp pin có Wi-Fi/ESP-NOW → CHỈ cắm vào ADC1 (ESP32 cũ: 32, 33, 34, 35, 36, 39; ESP32-S3: 1–10; ESP32-C3: 0–4).',
  },
  {
    id: 'pwm-ledc',
    icon: '〰️',
    title: 'Bản chất xung PWM (Tần số & Duty Cycle) trên ESP32',
    badge: 'Điều khiển công suất',
    summary:
      'Chân GPIO chỉ xuất được 0V hoặc 3.3V — vậy làm sao ESP32 chỉnh được độ sáng LED êm ái và tốc độ động cơ?',
    body: [
      'PWM (Pulse Width Modulation — Điều chế độ rộng xung) là kỹ thuật BẬT/TẮT chân GPIO cực nhanh (hàng nghìn lần mỗi giây). Thiết bị bên ngoài (mắt người nhìn LED hay quán tính cuộn dây động cơ) chỉ cảm nhận được GIÁ TRỊ TRUNG BÌNH.',
      '**Tần số (Frequency - Hz):** Số chu kỳ BẬT/TẮT trong 1 giây. Đèn LED / Động cơ DC thường dùng `5000 Hz` (5kHz) để mượt không nháy mắt và không rít tai. Riêng Servo RC bắt buộc dùng `50 Hz` (chu kỳ 20ms).',
      '**Độ rộng xung (Duty Cycle - %):** Tỷ lệ thời gian ở mức HIGH trong 1 chu kỳ. Với độ phân giải 8-bit (`0–255`): giá trị `0` = 0% (tắt hẳn), `128` = 50% (áp TB ~1.65V), `255` = 100% (3.3V).',
    ],
    formula: 'Điện áp trung bình = 3.3V × (Giá_trị_PWM / 255)  |  Arduino Core v3 dùng `analogWrite()` hoặc `ledcAttach(pin, freq, res)`',
    tip: 'Hàm `analogWrite(pin, 0..255)` hoạt động đồng bộ trên cả Arduino-ESP32 Core v2 và Core v3 mới!',
  },
  {
    id: 'millis-nonblocking',
    icon: '⏱️',
    title: 'Lập trình không chặn (`millis()`) vs `delay()`',
    badge: 'Tư duy Nhúng',
    summary:
      'Tại sao dùng `delay(2000)` làm nút bấm không ăn, màn hình bị giật và xe robot mất lái?',
    body: [
      'Hàm `delay(2000)` bắt vi xử lý ESP32 "đứng hình" hoàn toàn trong 2 giây — trong lúc đó ESP32 KHÔNG đọc được nút bấm, KHÔNG nhận gói tin ESP-NOW/Wi-Fi, KHÔNG đo được vật cản phía trước xe!',
      'Giải pháp chuyên nghiệp là dùng đồng hồ bấm giờ `millis()`: ghi nhớ mốc thời gian lần cuối làm việc (`lastTime`), rồi ở mỗi vòng `loop()` kiểm tra `if (millis() - lastTime >= interval)`.',
      'Nhờ kỹ thuật Non-blocking này, ESP32 vừa chớp LED mỗi 500ms, vừa cập nhật LCD mỗi 500ms, vừa đọc Joystick 100 lần/giây cùng lúc!',
    ],
    formula: 'unsigned long now = millis(); if (now - prevTime >= 500) { prevTime = now; /* Làm việc */ }',
    tip: 'Phép trừ `millis() - prevTime >= interval` tự động an toàn ngay cả khi `millis()` tràn số sau 49.7 ngày chạy liên tục!',
  },
  {
    id: 'power-common-gnd',
    icon: '🔋',
    title: 'Cấp nguồn chuẩn & Quy tắc Nối chung Mass (Common Ground)',
    badge: 'An toàn phần cứng',
    summary:
      'Giải mã lỗi "Brownout detector was triggered" (ESP32 tự reset) và lý do động cơ/servo giật loạn khi dùng pin rời.',
    body: [
      'Động cơ DC, Servo, LED dây và cuộn hút Relay tiêu thụ dòng rất lớn (300mA tới vài Ampe). Trong khi mạch ổn áp 3.3V (AMS1117) trên board chỉ chịu tối đa ~500mA.',
      'Khi lấy nguồn 3V3 hoặc cổng USB yếu để nuôi động cơ/Servo, điện áp tụt đột ngột dưới 2.4V kích hoạt mạch bảo vệ **Brownout Detector** ép ESP32 Reset liên tục.',
      'Cách đấu chuẩn: Dùng nguồn/pin riêng (hoặc mạch Buck 5V 3A) cấp cho động cơ/Servo, còn ESP32 cấp từ USB hoặc 5V vào VIN. **Và BẮT BUỘC nối dây GND của nguồn động cơ vào GND của ESP32** để hai bên có cùng mốc 0V!',
    ],
    formula: 'Không nối chung GND = Không có mạch kín cho tín hiệu PWM/UART/I2C quay về → Tín hiệu bị nhiễu loạn!',
    tip: 'Gắn thêm 1 tụ điện hóa 470µF–1000µF song song vào đường nguồn 5V cấp cho Servo/động cơ giúp chống sụt áp cực hiệu quả.',
  },
];

const EXERCISE_CHAPTERS = [
  { id: 'ch1', title: 'Chương 1: Ngõ ra Số (Digital Output & LED)', badge: '3 bài' },
  { id: 'ch2', title: 'Chương 2: Ngõ vào Số (Digital Input & Nút nhấn)', badge: '3 bài' },
  { id: 'ch3', title: 'Chương 3: Tín hiệu Tương tự (ADC 12-bit)', badge: '3 bài' },
  { id: 'ch4', title: 'Chương 4: Xung PWM, Buzzer & Servo', badge: '3 bài' },
  { id: 'ch5', title: 'Chương 5: Đa nhiệm millis() & Cảm biến', badge: '3 bài' },
  { id: 'ch6', title: 'Chương 6: Giao tiếp I2C & Màn hình OLED', badge: '2 bài' },
  { id: 'ch7', title: 'Chương 7: Công suất, Động cơ & Không dây', badge: '3 bài' },
];

const ESP32_EXERCISES = [
  // =========================================================================
  // CHƯƠNG 1: DIGITAL OUTPUT & LED (BÀI 1.1 -> 1.3)
  // =========================================================================
  {
    id: 'ex1-1',
    chapterId: 'ch1',
    number: 'Bài 1.1',
    title: 'Làm quen GPIO: Nháy đèn LED tích hợp (LED_BUILTIN)',
    level: 'Chương 1 • Khởi đầu số 0',
    duration: '10 phút',
    summary: 'Bài tập "Hello World" của lập trình nhúng: điều khiển đèn LED gắn sẵn trên board ESP32 mà chưa cần cắm dây ngoài.',
    componentsUsed: ['led-resistor'],
    simulatorType: 'led-blink',
    learningGoals: [
      'Hiểu cấu trúc bắt buộc của mọi chương trình ESP32: `setup()` (chạy 1 lần) và `loop()` (lặp vô tận).',
      'Làm quen 2 hàm nền tảng nhất: `pinMode(pin, OUTPUT)` và `digitalWrite(pin, HIGH/LOW)`.',
      'Phân biệt chân LED tích hợp giữa ESP32 DevKit V1 (`GPIO2`) và ESP32-C3 SuperMini (`GPIO8` sáng mức `LOW`).',
    ],
    wiringSteps: [
      { from: 'ESP32 DevKit V1', to: 'LED xanh dương trên mạch (GPIO2)', detail: 'Đã hàn sẵn trên board, không cần cắm dây' },
      { from: 'ESP32-C3 SuperMini', to: 'LED xanh dương trên mạch (GPIO8)', detail: 'Lưu ý: C3 sáng ở mức LOW (Active LOW)!' },
      { from: 'Cáp USB', to: 'Máy tính (Serial 115200 baud)', detail: 'Mở Serial Monitor để xem trạng thái in ra' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao phải khai báo `pinMode(2, OUTPUT)` trong `setup()`?',
        content:
          'Khi mới bật nguồn, hầu hết các chân GPIO của ESP32 đều ở trạng thái Ngõ vào trở kháng cao (`INPUT`) để tránh chập cháy thiết bị bên ngoài. Lệnh `pinMode(2, OUTPUT)` kích hoạt 2 transistor đẩy-kéo (Push-Pull) bên trong chân GPIO2, cho phép nó bơm dòng ra mức `HIGH` (3.3V) hoặc hút dòng xuống mức `LOW` (0V).',
      },
      {
        title: 'Tại sao vừa thấy đèn LED sáng trên DevKit V1 thì code nạp lại báo lỗi?',
        content:
          'Trên ESP32 DevKit V1, chân `GPIO2` cũng là chân Strapping khi nạp code. Đèn LED gắn sẵn trên mạch đã được nhà sản xuất thiết kế nối đúng chiều xuống GND nên không cản trở nạp code. Tuy nhiên nếu bạn cắm thêm nút nhấn kéo `GPIO2` lên 3.3V thì sẽ bị lỗi nạp firmware ngay!',
      },
    ],
    code: `#include <Arduino.h>

#define LED_PIN 2  // Trên ESP32-C3 SuperMini hãy đổi thành 8

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Bắt đầu nháy LED tích hợp!");
}

void loop() {
  digitalWrite(LED_PIN, HIGH); // Xuất mức 3.3V -> Bật LED
  Serial.println("LED: SÁNG");
  delay(1000);                 // Chờ 1 giây (1000 ms)

  digitalWrite(LED_PIN, LOW);  // Xuất mức 0V -> Tắt LED
  Serial.println("LED: TẮT");
  delay(1000);
}`,
    codeBreakdown: [
      { line: 'Serial.begin(115200);', explain: 'Mở cổng giao tiếp USB về máy tính ở tốc độ 115200 bit/giây để xem thông báo debug.' },
      { line: 'pinMode(LED_PIN, OUTPUT);', explain: 'Cấu hình chân GPIO2 thành ngõ ra điện áp 3.3V / 0V.' },
      { line: 'digitalWrite(LED_PIN, HIGH);', explain: 'Xuất mức điện áp 3.3V ra chân GPIO2 làm đèn LED tích hợp phát sáng.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Chỉnh nhịp chớp',
        task: 'Thay đổi thời gian `delay()` để LED chớp thật nhanh (sáng 100ms, tắt 100ms) giống đèn báo kết nối Wi-Fi.',
        hint: 'Đổi cả 2 dòng `delay(1000)` thành `delay(100)`.',
        answerCode: `digitalWrite(LED_PIN, HIGH); delay(100);\ndigitalWrite(LED_PIN, LOW);  delay(100);`,
      },
      {
        level: 'Cấp 2 • Nhịp kép (Double Blink)',
        task: 'Lập trình LED chớp 2 cái liên tiếp thật nhanh (100ms), rồi nghỉ hẳn 1.5 giây giống đèn báo hiệu máy bay.',
        hint: 'Dùng 2 cặp Bật/Tắt 100ms liên tiếp trong `loop()`, sau đó `delay(1500);`.',
        answerCode: `for (int i = 0; i < 2; i++) {\n  digitalWrite(LED_PIN, HIGH); delay(100);\n  digitalWrite(LED_PIN, LOW);  delay(100);\n}\ndelay(1500);`,
      },
      {
        level: 'Cấp 3 • Bắt bệnh thực tế',
        task: 'Nếu bạn nạp code này lên board **ESP32-C3 SuperMini** (`LED_PIN = 8`), tại sao chữ trên Serial in `"LED: SÁNG"` mà đèn thực tế lại TẮT?',
        hint: 'Xem lại phần cảnh báo Active LOW của GPIO8 trên ESP32-C3!',
        answerCode: `// Trên ESP32-C3 SuperMini, LED nối từ 3V3 -> Trở -> GPIO8 nên bị đảo ngược:\ndigitalWrite(8, LOW);  // BẬT LED!\ndigitalWrite(8, HIGH); // TẮT LED!`,
      },
    ],
  },

  {
    id: 'ex1-2',
    chapterId: 'ch1',
    number: 'Bài 1.2',
    title: 'Đấu LED rời & Tính điện trở hạn dòng bảo vệ GPIO',
    level: 'Chương 1 • Thực hành Breadboard',
    duration: '15 phút',
    summary: 'Cắm mạch Breadboard đầu tiên với LED 5mm và điện trở 220Ω, nắm vững định luật Ôm để không bao giờ làm cháy chân ESP32.',
    componentsUsed: ['led-resistor'],
    simulatorType: 'led-blink',
    learningGoals: [
      'Nhận diện đúng cực Dương (`Anode` - chân dài) và cực Âm (`Cathode` - chân ngắn / gờ vát).',
      'Tính giá trị điện trở hạn dòng bằng công thức `R = (3.3V - Vf) / I`.',
      'Hiểu bản chất 2 kiểu đấu dây: **Active HIGH** và **Active LOW**.',
    ],
    wiringSteps: [
      { from: 'ESP32 GPIO16', to: 'Một đầu Điện trở 220Ω', detail: 'Chọn chân sạch an toàn (tránh GPIO6–11 & 34–39)' },
      { from: 'Đầu còn lại Điện trở 220Ω', to: 'Chân dài Anode (+) của LED', detail: 'Điện trở đặt trước hay sau LED đều có tác dụng hạn dòng như nhau' },
      { from: 'Chân ngắn Cathode (-) của LED', to: 'ESP32 GND', detail: 'Khép kín vòng dòng điện về Mass 0V' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao đặt điện trở ở chân (+) hay chân (-) của LED đều được?',
        content:
          'Trong một mạch nối tiếp chỉ có 1 đường đi duy nhất (GPIO → Trở → LED → GND), cường độ dòng điện tại mọi điểm trên vòng dây đều bằng nhau! Dù bạn lắp điện trở trước Anode hay sau Cathode thì dòng điện qua LED và GPIO vẫn bị hãm ở mức `(3.3 - 2.0) / 220 ≈ 5.9 mA`.',
      },
      {
        title: 'Tại sao KHÔNG chọn chân GPIO34, 35, 36, 39 để điều khiển đèn LED?',
        content:
          'Bốn chân này trên ESP32 Classic là **Input-Only** (chỉ có mạch đọc vào, không có transistor xuất dòng ra). Nếu bạn viết `pinMode(34, OUTPUT); digitalWrite(34, HIGH);`, đèn LED sẽ hoàn toàn tối thui!',
      },
    ],
    code: `#include <Arduino.h>

#define EXT_LED 16  // Chân GPIO16 hoàn toàn sạch và hỗ trợ xuất dòng

void setup() {
  pinMode(EXT_LED, OUTPUT);
}

void loop() {
  digitalWrite(EXT_LED, HIGH);
  delay(500);
  digitalWrite(EXT_LED, LOW);
  delay(500);
}`,
    codeBreakdown: [
      { line: '#define EXT_LED 16', explain: 'Đặt tên gợi nhớ cho chân GPIO16 (nếu cắm sang chân 17 chỉ cần sửa 1 chỗ duy nhất).' },
      { line: 'digitalWrite(EXT_LED, HIGH);', explain: 'Cho phép dòng ~6mA chạy qua trở 220Ω và LED xuống GND.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Đổi kiểu Active LOW',
        task: 'Thử rút dây Cathode (-) khỏi GND và cắm vào GPIO16, còn chân Anode (+) qua trở cắm thẳng lên `3V3`. Sửa code thế nào để LED chớp đúng như cũ?',
        hint: 'Lúc này xuất `LOW` (0V) dòng mới chảy từ 3V3 về GPIO16 làm đèn sáng.',
        answerCode: `digitalWrite(EXT_LED, LOW);  delay(500); // Sáng\ndigitalWrite(EXT_LED, HIGH); delay(500); // Tắt`,
      },
      {
        level: 'Cấp 2 • Mã Morse SOS',
        task: 'Viết hàm `blinkDot()` (sáng 150ms) và `blinkDash()` (sáng 500ms) để phát tín hiệu cầu cứu SOS (`... --- ...`).',
        hint: '3 ngắn (`...`), 3 dài (`---`), 3 ngắn (`...`), nghỉ 1.5s.',
        answerCode: `void pulse(int ms) { digitalWrite(EXT_LED, HIGH); delay(ms); digitalWrite(EXT_LED, LOW); delay(150); }\n// Trong loop(): 3 lần pulse(150); 3 lần pulse(500); 3 lần pulse(150); delay(1500);`,
      },
      {
        level: 'Cấp 3 • Thử nghiệm Bộ mô phỏng',
        task: 'Trong khung **Mô phỏng tương tác trực tiếp** phía trên, hãy chọn thử điện trở `0 Ω` và `1000 Ω` để quan sát sự thay đổi của dòng điện (mA) và cảnh báo phần cứng!',
        hint: 'Quan sát chỉ số "Dòng qua LED" và "Đánh giá" khi chọn từng mức điện trở.',
        answerCode: `// R = 220Ω -> ~5.9mA (Chuẩn sáng đẹp)\n// R = 1000Ω -> ~1.3mA (Hơi mờ nhưng siêu tiết kiệm pin)\n// R = 0Ω -> >80mA (Hỏng GPIO ESP32!)`,
      },
    ],
  },

  {
    id: 'ex1-3',
    chapterId: 'ch1',
    number: 'Bài 1.3',
    title: 'Điều khiển nhiều LED: Đèn Giao Thông & Hiệu ứng LED chạy',
    level: 'Chương 1 • Tổng hợp Output',
    duration: '20 phút',
    summary: 'Sử dụng mảng (`Array`) và vòng lặp `for` để điều khiển gọn gàng 3 đèn Đỏ - Vàng - Xanh theo chu kỳ giao thông thực tế.',
    componentsUsed: ['led-resistor'],
    simulatorType: 'led-traffic',
    learningGoals: [
      'Điều khiển nhiều chân GPIO độc lập cùng lúc trên Breadboard.',
      'Biết cách dùng mảng `const int leds[] = {16, 17, 18};` thay vì lặp lại code thủ công.',
      'Rèn tư duy thiết kế máy trạng thái (State Machine) đơn giản.',
    ],
    wiringSteps: [
      { from: 'ESP32 GPIO16 → Trở 220Ω', to: 'LED Đỏ (+) → GND', detail: 'Đèn Đỏ' },
      { from: 'ESP32 GPIO17 → Trở 220Ω', to: 'LED Vàng (+) → GND', detail: 'Đèn Vàng' },
      { from: 'ESP32 GPIO18 → Trở 220Ω', to: 'LED Xanh (+) → GND', detail: 'Đèn Xanh' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao mỗi đèn LED nên có 1 điện trở 220Ω riêng thay vì dùng chung 1 điện trở ở chân GND?',
        content:
          'Nếu 3 LED Đỏ (Vf ≈ 2.0V) và Xanh (Vf ≈ 3.0V) dùng chung 1 điện trở xuống GND, khi bật nhiều đèn cùng lúc dòng điện sẽ chia không đều: LED Đỏ có điện áp mở thấp hơn sẽ hút hết dòng điện làm LED Xanh tắt lịm hoặc tối hẳn đi! Luôn gắn mỗi LED 1 điện trở riêng.',
      },
    ],
    code: `#include <Arduino.h>

#define LED_RED    16
#define LED_YELLOW 17
#define LED_GREEN  18

void setLights(bool r, bool y, bool g) {
  digitalWrite(LED_RED, r);
  digitalWrite(LED_YELLOW, y);
  digitalWrite(LED_GREEN, g);
}

void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
}

void loop() {
  setLights(1, 0, 0); delay(4000); // Đỏ 4 giây
  setLights(0, 0, 1); delay(3500); // Xanh 3.5 giây
  setLights(0, 1, 0); delay(1500); // Vàng 1.5 giây
}`,
    codeBreakdown: [
      { line: 'void setLights(bool r, bool y, bool g)', explain: 'Hàm gom chung 3 lệnh digitalWrite giúp logic đèn giao thông cực kỳ sạch sẽ, không bao giờ quên tắt đèn cũ.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Chớp vàng ban đêm',
        task: 'Sửa `loop()` để đèn Vàng nhấp nháy cảnh báo mỗi 500ms, trong khi đèn Đỏ và Xanh luôn tắt.',
        hint: 'Chỉ gọi `setLights(0, 1, 0); delay(500); setLights(0, 0, 0); delay(500);`.',
        answerCode: `setLights(0, 1, 0); delay(500);\nsetLights(0, 0, 0); delay(500);`,
      },
      {
        level: 'Cấp 2 • Dùng mảng cho hiệu ứng chạy đuổi',
        task: 'Khai báo mảng `int pins[3] = {16, 17, 18};` và dùng vòng lặp `for` bật lần lượt từng đèn chạy qua lại (hiệu ứng Knight Rider).',
        hint: 'Dùng `for(int i=0; i<3; i++)` bật `pins[i]`, delay 150ms rồi tắt.',
        answerCode: `int pins[] = {16, 17, 18};\nfor (int i = 0; i < 3; i++) {\n  digitalWrite(pins[i], HIGH); delay(150);\n  digitalWrite(pins[i], LOW);\n}`,
      },
      {
        level: 'Cấp 3 • Đếm ngược nhấp nháy đèn Xanh',
        task: 'Trước khi đèn Xanh chuyển sang Vàng, làm đèn Xanh chớp 3 lần cuối chu kỳ để báo hiệu sắp hết giờ đi.',
        hint: 'Sau `delay(2500)` của đèn Xanh, chớp tắt 3 lần mỗi lần 200ms.',
        answerCode: `setLights(0, 0, 1); delay(2500);\nfor (int i = 0; i < 3; i++) { setLights(0,0,0); delay(200); setLights(0,0,1); delay(200); }`,
      },
    ],
  },

  // =========================================================================
  // CHƯƠNG 2: DIGITAL INPUT & NÚT NHẤN (BÀI 2.1 -> 2.3)
  // =========================================================================
  {
    id: 'ex2-1',
    chapterId: 'ch2',
    number: 'Bài 2.1',
    title: 'Đọc Nút nhấn cơ bản với INPUT_PULLUP (Nhấn sáng, thả tắt)',
    level: 'Chương 2 • Nhập liệu cơ bản',
    duration: '15 phút',
    summary: 'Học cách đấu nút nhấn 4 chân đúng cặp, bật điện trở kéo lên nội bộ `INPUT_PULLUP` để tránh nhiễu chân thả nổi.',
    componentsUsed: ['push-button', 'led-resistor'],
    simulatorType: 'button-debounce',
    learningGoals: [
      'Cắm đúng 2 chân đối xứng chéo trên nút nhấn 4 chân để không bị chập mạch.',
      'Hiểu vì sao dùng `INPUT_PULLUP` thì trạng thái bình thường là `HIGH` (1) và khi nhấn là `LOW` (0).',
      'Tránh lỗi dùng `INPUT_PULLUP` trên 4 chân Input-Only (`GPIO34–39`).',
    ],
    wiringSteps: [
      { from: 'Nút nhấn (Chân trên-trái)', to: 'ESP32 GPIO18 (INPUT_PULLUP)', detail: 'Kéo lên 3.3V nội bộ' },
      { from: 'Nút nhấn (Chân dưới-phải)', to: 'ESP32 GND', detail: 'Đấu chéo 2 góc chắc chắn đúng tiếp điểm' },
      { from: 'LED + Trở 220Ω', to: 'ESP32 GPIO16 → GND', detail: 'Đèn báo khi nhấn nút' },
    ],
    deepExplanations: [
      {
        title: 'Chuyện gì xảy ra nếu dùng `pinMode(18, INPUT)` mà không có điện trở kéo?',
        content:
          'Lúc chưa bấm, dây nối từ GPIO18 ra nút nhấn bị bỏ hở (Floating Pin). Chỉ cần bạn đưa ngón tay lại gần (chưa cần chạm!), điện trường 50Hz từ cơ thể làm chân GPIO18 nhảy 0-1-0-1 liên tục khiến đèn LED nhấp nháy ma quái!',
      },
    ],
    code: `#include <Arduino.h>

#define BTN_PIN 18
#define LED_PIN 16

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP); // Thả = HIGH (1), Nhấn = LOW (0)
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool isPressed = (digitalRead(BTN_PIN) == LOW);
  digitalWrite(LED_PIN, isPressed ? HIGH : LOW);
  delay(20);
}`,
    codeBreakdown: [
      { line: 'pinMode(BTN_PIN, INPUT_PULLUP);', explain: 'Bật điện trở ~45kΩ kéo lên 3.3V bên trong chip, không cần lắp điện trở ngoài.' },
      { line: 'bool isPressed = (digitalRead(BTN_PIN) == LOW);', explain: 'Chuyển đổi logic ngược thành biến `isPressed` dễ đọc: nhấn = true.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Tận dụng nút BOOT sẵn có',
        task: 'Không cần cắm nút ngoài, đổi `#define BTN_PIN 0` để dùng luôn nút **BOOT** có sẵn trên mạch DevKit V1 bật đèn **LED xanh** ở `GPIO2`!',
        hint: 'Nút BOOT trên DevKit V1 nối giữa GPIO0 và GND.',
        answerCode: `#define BTN_PIN 0\n#define LED_PIN 2`,
      },
      {
        level: 'Cấp 2 • Còi báo động kép (2 nút nhấn AND)',
        task: 'Gắn thêm Nút 2 vào GPIO19. Chỉ bật đèn LED khi **cả 2 nút cùng được giữ** đồng thời (giống nút an toàn máy dập công nghiệp).',
        hint: 'Kiểm tra `digitalRead(18) == LOW && digitalRead(19) == LOW`.',
        answerCode: `bool both = (digitalRead(18) == LOW && digitalRead(19) == LOW);\ndigitalWrite(LED_PIN, both ? HIGH : LOW);`,
      },
      {
        level: 'Cấp 3 • Bắt bệnh chân 34–39',
        task: 'Nếu bạn chuyển dây nút nhấn sang `GPIO34` mà vẫn giữ code `pinMode(34, INPUT_PULLUP)`, điều gì sẽ xảy ra?',
        hint: 'GPIO34–39 trên ESP32 Classic không có mạch Pull-up nội bộ.',
        answerCode: `// Phải tự nối thêm điện trở 10kΩ bên ngoài từ GPIO34 lên 3V3,\n// hoặc chuyển nút nhấn sang các chân có Pull-up như GPIO18, 19, 25, 26, 27, 32, 33.`,
      },
    ],
  },

  {
    id: 'ex2-2',
    chapterId: 'ch2',
    number: 'Bài 2.2',
    title: 'Nút nhấn Bật/Tắt (Toggle) & Chống dội phím (Debounce)',
    level: 'Chương 2 • Xử lý dội phím',
    duration: '20 phút',
    summary: 'Bấm 1 lần đèn giữ sáng, bấm lần nữa đèn tắt — và tại sao bắt buộc phải lọc nhiễu nảy tiếp điểm cơ học 50ms.',
    componentsUsed: ['push-button', 'led-resistor'],
    simulatorType: 'button-debounce',
    learningGoals: [
      'Phân biệt giữa đọc **mức (Level)** và bắt **sườn xung (Edge Detection)** chuyển từ Thả → Nhấn.',
      'Hiểu bản chất hiện tượng dội phím cơ học (Switch Bounce 5–20ms).',
      'Viết chuẩn thuật toán Debounce bằng `millis()` không chặn mạch.',
    ],
    wiringSteps: [
      { from: 'Nút nhấn (Chân trên-trái)', to: 'ESP32 GPIO18 (INPUT_PULLUP)', detail: 'Đầu đọc tín hiệu' },
      { from: 'Nút nhấn (Chân dưới-phải)', to: 'ESP32 GND', detail: 'Đầu Mass chung' },
      { from: 'LED + Trở 220Ω', to: 'ESP32 GPIO16 → GND', detail: 'Giữ trạng thái BẬT/TẮT sau mỗi lần bấm' },
    ],
    deepExplanations: [
      {
        title: 'Nếu viết `if (digitalRead(BTN) == LOW) ledState = !ledState;` thì sao?',
        content:
          'Vòng `loop()` của ESP32 chạy hàng trăm nghìn lần trong 1 giây! Trong khoảng 0.2 giây ngón tay bạn đang ấn nút, biến `ledState` bị đảo trạng thái liên tục hàng chục nghìn lần — kết quả lúc bạn thả tay ra đèn sẽ sáng hoặc tắt một cách hên xui hoàn toàn!',
      },
      {
        title: 'Cơ chế Debounce 50ms hoạt động ra sao?',
        content:
          'Mỗi khi phát hiện trạng thái nút vừa thay đổi (kể cả do rung nảy tiếp điểm), ta đặt lại đồng hồ `lastDebounceTime = millis()`. Chỉ khi trạng thái mới đứng yên liên tục hơn 50ms không còn rung nữa, ta mới công nhận đây là cú bấm thật và đảo trạng thái đèn đúng 1 lần!',
      },
    ],
    code: `#include <Arduino.h>

#define BTN_PIN 18
#define LED_PIN 16

bool ledOn = false;
bool lastReading = HIGH;
bool stableState = HIGH;
unsigned long lastDebounceTime = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool reading = digitalRead(BTN_PIN);
  if (reading != lastReading) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > 50) {
    if (reading != stableState) {
      stableState = reading;
      if (stableState == LOW) { // Chỉ kích hoạt lúc vừa nhấn xuống
        ledOn = !ledOn;
        digitalWrite(LED_PIN, ledOn);
        Serial.printf("Toggle -> %s\\n", ledOn ? "BẬT" : "TẮT");
      }
    }
  }
  lastReading = reading;
}`,
    codeBreakdown: [
      { line: 'if (reading != lastReading) lastDebounceTime = millis();', explain: 'Reset đồng hồ 50ms mỗi khi lá đồng nút nhấn còn rung nảy.' },
      { line: 'if (stableState == LOW)', explain: 'Chỉ đảo đèn tại thời điểm nhấn xuống, bỏ qua thời điểm thả tay ra (`HIGH`).' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Bộ đếm số lần bấm',
        task: 'Thêm biến `int pressCount = 0;` và in ra Serial Monitor số lần bấm chính xác từ 1, 2, 3... không bị nhảy cóc.',
        hint: 'Tăng `pressCount++` ngay bên trong khối `if (stableState == LOW)`.',
        answerCode: `if (stableState == LOW) {\n  pressCount++;\n  Serial.printf("Đã bấm chuẩn lần thứ: %d\\n", pressCount);\n}`,
      },
      {
        level: 'Cấp 2 • Nút chuyển chế độ (Mode 0 → 1 → 2 → 0)',
        task: 'Mỗi lần bấm nút chuyển qua 3 chế độ: Mode 0 (Tắt), Mode 1 (Sáng hẳn), Mode 2 (Nhấp nháy) giống tay cầm điều khiển ECO/SPORT.',
        hint: 'Dùng `mode = (mode + 1) % 3;`.',
        answerCode: `mode = (mode + 1) % 3;\n// Trong loop() xử lý theo switch(mode)`,
      },
      {
        level: 'Cấp 3 • Thử nghiệm Bộ mô phỏng',
        task: 'Bấm liên tiếp 5 lần vào nút giả lập trong khung **Mô phỏng tương tác** và so sánh cột *Đếm KHÔNG Debounce* với *Đếm CÓ Debounce*.',
        hint: 'Mỗi lần bấm thực tế sinh ra 2–4 xung dội phím giả.',
        answerCode: `// Với Debounce 50ms, 5 lần bấm luôn ra đúng số 5!`,
      },
    ],
  },

  {
    id: 'ex2-3',
    chapterId: 'ch2',
    number: 'Bài 2.3',
    title: 'Nâng cao Nút nhấn: Phân biệt Nhấn nhanh & Nhấn giữ 2 giây',
    level: 'Chương 2 • Kỹ thuật nâng cao',
    duration: '25 phút',
    summary: 'Chỉ với 1 nút nhấn duy nhất nhưng làm được 2 việc: Nhấn nhanh để Bật/Tắt, Nhấn giữ 2 giây để Reset Wi-Fi hoặc kích hoạt chế độ đặc biệt.',
    componentsUsed: ['push-button', 'led-resistor'],
    simulatorType: 'button-hold',
    learningGoals: [
      'Đo khoảng thời gian giữ nút bằng `millis() - pressStartTime`.',
      'Xử lý sự kiện **Short Press** (nhả ra trước 1.5s) và **Long Press** (giữ đủ 1.5s–2s).',
    ],
    wiringSteps: [
      { from: 'Nút nhấn', to: 'GPIO18 (INPUT_PULLUP) ↔ GND', detail: 'Hoặc dùng nút BOOT (GPIO0)' },
      { from: 'LED báo trạng thái', to: 'GPIO16 (qua trở 220Ω) → GND', detail: 'Chớp nhanh khi nhận Long Press' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao sự kiện Nhấn nhanh (Short Press) nên kích hoạt LÚC NHẢ TAY ra?',
        content:
          'Khi bạn mới bắt đầu ấn nút xuống, ESP32 chưa thể biết bạn định nhấn nhanh hay định giữ luôn 2 giây! Do đó: nếu bạn giữ quá 1500ms thì kích hoạt ngay **Long Press** (và đặt cờ `longPressTriggered = true`); còn nếu bạn nhả tay ra trước 1500ms thì lúc đó mới thực thi **Short Press**.',
      },
    ],
    code: `#include <Arduino.h>

#define BTN_PIN 18
#define LED_PIN 16

bool lastState = HIGH;
unsigned long pressStart = 0;
bool longHandled = false;
bool ledState = false;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  bool curr = digitalRead(BTN_PIN);

  if (lastState == HIGH && curr == LOW) { // Vừa bắt đầu nhấn xuống
    pressStart = millis();
    longHandled = false;
    delay(30); // Chống dội nhanh lúc chạm
  }
  else if (curr == LOW && !longHandled && (millis() - pressStart >= 1500)) {
    longHandled = true;
    Serial.println("🔥 NHẤN GIỮ (1.5s): Đang Reset cấu hình!");
    for (int i = 0; i < 6; i++) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      delay(80);
    }
  }
  else if (lastState == LOW && curr == HIGH) { // Vừa nhả tay ra
    if (!longHandled && (millis() - pressStart > 40)) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
      Serial.println("👆 NHẤN NHANH: Đảo trạng thái LED!");
    }
  }
  lastState = curr;
}`,
    codeBreakdown: [
      { line: 'if (lastState == HIGH && curr == LOW)', explain: 'Bắt khoảnh khắc bắt đầu bấm xuống để bấm giờ `pressStart = millis()`.' },
      { line: 'else if (curr == LOW && !longHandled && ... >= 1500)', explain: 'Kích hoạt ngay lập tức khi giữ đủ 1.5 giây mà không cần đợi người dùng nhả tay.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Đổi ngưỡng nhấn giữ',
        task: 'Đổi thời gian nhấn giữ từ 1.5 giây thành 3 giây (`3000ms`).',
        hint: 'Sửa số `1500` thành `3000`.',
        answerCode: `else if (curr == LOW && !longHandled && (millis() - pressStart >= 3000))`,
      },
      {
        level: 'Cấp 2 • Nút tăng/giảm tốc độ khi giữ',
        task: 'Làm nút bấm tăng giá trị `speed` (+10) mỗi lần nhấn, và nếu giữ nút thì cứ mỗi 200ms tự động tăng thêm +10 liên tục!',
        hint: 'Khi `curr == LOW` và quá 500ms, dùng thêm timer 200ms tăng dần.',
        answerCode: `if (curr == LOW && millis() - lastRepeat > 200) { lastRepeat = millis(); speed = min(255, speed + 10); }`,
      },
      {
        level: 'Cấp 3 • Thử nghiệm Bộ mô phỏng',
        task: 'Nhấn giữ chuột vào nút trong khung **Mô phỏng tương tác** phía trên quá 1.5 giây để xem bộ đếm tự chuyển sang trạng thái `LONG PRESS`.',
        hint: 'Nhấn thả nhanh (<1.5s) sẽ kích `SHORT PRESS`, giữ lâu (>=1.5s) sẽ kích `LONG PRESS`.',
        answerCode: `// Đây là mẫu UI nút nguồn thực tế trên hầu hết thiết bị IoT thông minh!`,
      },
    ],
  },

  // =========================================================================
  // CHƯƠNG 3: ANALOG ADC 12-BIT (BÀI 3.1 -> 3.3)
  // =========================================================================
  {
    id: 'ex3-1',
    chapterId: 'ch3',
    number: 'Bài 3.1',
    title: 'Đọc Biến trở xoay với ADC 12-bit (0–4095) & Quy đổi Điện áp',
    level: 'Chương 3 • Analog cơ bản',
    duration: '15 phút',
    summary: 'Làm quen bộ đọc tương tự ADC 12-bit trên ESP32, phân biệt ADC1/ADC2 và biến con số 0–4095 thành điện áp thực tế (0–3.30V).',
    componentsUsed: ['pot-joystick'],
    simulatorType: 'adc-joystick',
    learningGoals: [
      'Đấu đúng 3 chân biến trở (`3V3` — `ADC1` — `GND`).',
      'Hiểu độ phân giải 12-bit (`2¹² = 4096` mức) so với 10-bit của Arduino Uno.',
      'Luôn chọn nhóm **ADC1** (`GPIO32–39` trên ESP32 cũ; `GPIO1–10` trên ESP32-S3).',
    ],
    wiringSteps: [
      { from: 'Biến trở Chân ngoài 1', to: 'ESP32 3V3', detail: '⚠️ Cấp 3.3V (KHÔNG dùng 5V!)' },
      { from: 'Biến trở Chân giữa (Wiper)', to: 'ESP32 GPIO34 (ADC1_CH6)', detail: 'Chân xuất điện áp thay đổi 0–3.3V' },
      { from: 'Biến trở Chân ngoài 2', to: 'ESP32 GND', detail: 'Mốc 0V' },
    ],
    deepExplanations: [
      {
        title: 'Chuyện gì xảy ra nếu đấu nhầm 2 chân ngoài của biến trở sang 5V thay vì 3V3?',
        content:
          'Khi bạn vặn biến trở vượt quá 2/3 hành trình, điện áp chân giữa sẽ vượt 3.3V (lên tới 5V). Thứ nhất, giá trị đọc đã chạm kịch trần `4095` từ nửa vòng xoay gây mất dải điều khiển; thứ hai, áp 5V đưa thẳng vào chân ADC có thể làm hỏng mạch đọc Analog bên trong chip ESP32!',
      },
    ],
    code: `#include <Arduino.h>

#define POT_PIN 34  // ADC1_CH6 (Dùng tốt cả khi bật Wi-Fi)

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // Dải 0 -> 4095
}

void loop() {
  int raw = analogRead(POT_PIN);
  float volt = raw * (3.3f / 4095.0f);
  int percent = map(raw, 0, 4095, 0, 100);

  Serial.printf("ADC: %4d | Điện áp: %.2f V | Phần trăm: %3d%%\\n", raw, volt, percent);
  delay(120);
}`,
    codeBreakdown: [
      { line: 'analogRead(POT_PIN)', explain: 'Đọc mức điện áp tại chân GPIO34 và trả về số nguyên từ 0 đến 4095.' },
      { line: 'raw * (3.3f / 4095.0f)', explain: 'Quy đổi từ số đếm 12-bit sang đơn vị Volt.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Làm mượt nhiễu ADC (Trung bình cộng)',
        task: 'ADC thường dao động ±15 đơn vị. Viết vòng lặp đọc 10 lần liên tiếp rồi chia 10 để số hiển thị đứng im mượt mà.',
        hint: 'Cộng dồn `long sum = 0; for(int i=0; i<10; i++) sum += analogRead(POT_PIN);` rồi chia 10.',
        answerCode: `long sum = 0;\nfor (int i = 0; i < 10; i++) sum += analogRead(POT_PIN);\nint smoothRaw = sum / 10;`,
      },
      {
        level: 'Cấp 2 • Bật tắt LED theo ngưỡng 50%',
        task: 'Nếu vặn biến trở qua mức 50% (`raw > 2048`) thì bật sáng đèn LED ở GPIO16, ngược lại tắt LED.',
        hint: 'Thêm `digitalWrite(16, (raw > 2048) ? HIGH : LOW);`.',
        answerCode: `digitalWrite(16, (raw > 2048) ? HIGH : LOW);`,
      },
      {
        level: 'Cấp 3 • Dùng `analogReadMilliVolts()` chuẩn nhà máy',
        task: 'Thử thay phép nhân `raw * 3.3 / 4095` bằng hàm `analogReadMilliVolts(34)` có sẵn của Espressif để thấy độ chính xác cao hơn ở hai đầu 0V và 3.3V.',
        hint: 'Hàm trả về trực tiếp số mili-Volt (0–3300 mV) đã bù phi tuyến eFuse.',
        answerCode: `int mv = analogReadMilliVolts(POT_PIN);\nSerial.printf("Chính xác: %d mV (%.2f V)\\n", mv, mv / 1000.0f);`,
      },
    ],
  },

  {
    id: 'ex3-2',
    chapterId: 'ch3',
    number: 'Bài 3.2',
    title: 'Cầu phân áp đo Quang trở (LDR) & Điện áp Pin Li-Po',
    level: 'Chương 3 • Ứng dụng đo lường',
    duration: '20 phút',
    summary: 'Ứng dụng nguyên lý cầu phân áp để đọc cảm biến điện trở (quang trở, cảm biến nhiệt NTC) và đo dung lượng pin lớn hơn 3.3V.',
    componentsUsed: ['pot-joystick', 'led-resistor'],
    simulatorType: 'ldr-divider',
    learningGoals: [
      'Biết cách tạo cầu phân áp với 1 điện trở cố định `10kΩ` để đọc quang trở.',
      'Tính ngược điện áp Pin 4.2V hoặc 8.4V qua cầu phân áp `100kΩ + 100kΩ` (chia đôi áp).',
      'Tạo vùng trễ **Hysteresis** để đèn đường tự động không bị nhấp nháy lúc chập choạng tối.',
    ],
    wiringSteps: [
      { from: 'Quang trở (LDR)', to: '3V3 ↔ GPIO35 (ADC1_CH7)', detail: 'Nhánh trên kéo lên 3.3V' },
      { from: 'Điện trở 10kΩ', to: 'GPIO35 ↔ GND', detail: 'Nhánh dưới kéo xuống GND tạo cầu phân áp' },
      { from: 'LED đường phố', to: 'GPIO16 (qua trở 220Ω) → GND', detail: 'Tự bật khi trời tối' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao lúc chập choạng tối đèn lại nhấp nháy liên tục và cách sửa bằng Hysteresis?',
        content:
          'Giả sử bạn đặt ngưỡng `raw < 1500` thì bật đèn. Lúc trời sẩm tối, giá trị ADC dao động quanh `1495–1505` làm đèn bật-tắt-bật-tắt liên hồi như chớp! Giải pháp là tạo 2 ngưỡng (Hysteresis): **chỉ BẬT khi tối hẳn (`raw < 1300`)** và **chỉ TẮT khi sáng hẳn (`raw > 1700`)**. Khoảng đệm 400 đơn vị ở giữa giúp đèn đóng cắt cực kỳ dứt khoát!',
      },
    ],
    code: `#include <Arduino.h>

#define LDR_PIN 35
#define LAMP_PIN 16

bool lampOn = false;

void setup() {
  Serial.begin(115200);
  pinMode(LAMP_PIN, OUTPUT);
}

void loop() {
  int lightVal = analogRead(LDR_PIN); // Càng sáng số càng lớn

  // Hysteresis chống nháy đèn lúc chập choạng
  if (!lampOn && lightVal < 1300) {
    lampOn = true;
    Serial.println("🌙 Trời tối -> BẬT đèn!");
  } else if (lampOn && lightVal > 1700) {
    lampOn = false;
    Serial.println("☀️ Trời sáng -> TẮT đèn!");
  }

  digitalWrite(LAMP_PIN, lampOn);
  delay(200);
}`,
    codeBreakdown: [
      { line: 'if (!lampOn && lightVal < 1300)', explain: 'Ngưỡng dưới kích hoạt bật đèn.' },
      { line: 'else if (lampOn && lightVal > 1700)', explain: 'Ngưỡng trên cách xa ngưỡng dưới 400 đơn vị giúp triệt tiêu hiện tượng nhấp nháy.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Đo điện áp Pin 1S (4.2V)',
        task: 'Nếu dùng 2 điện trở bằng nhau (`R1 = 100kΩ`, `R2 = 100kΩ`) chia đôi áp Pin 4.2V đưa vào `GPIO35`, viết công thức tính lại điện áp Pin thực tế.',
        hint: 'Áp đọc được bị giảm đi một nửa → nhân `2.0` để ra áp Pin thật.',
        answerCode: `float vPin = (analogReadMilliVolts(35) / 1000.0f) * 2.0f;`,
      },
      {
        level: 'Cấp 2 • Cảnh báo Pin yếu',
        task: 'Nếu `vPin < 3.4V`, cho LED nhấp nháy cảnh báo cần sạc pin.',
        hint: 'Kiểm tra điều kiện `if (vPin < 3.4f)` để chớp LED.',
        answerCode: `if (vPin < 3.4f) Serial.println("⚠️ PIN YẾU! Vui lòng sạc.");`,
      },
      {
        level: 'Cấp 3 • Thử nghiệm Bộ mô phỏng',
        task: 'Kéo thanh trượt **Ánh sáng môi trường** trong khung Mô phỏng qua lại vùng giữa 1300–1700 để thấy cơ chế **Hysteresis** giữ nguyên trạng thái đèn không nháy!',
        hint: 'Quan sát đèn chỉ đổi trạng thái khi vượt qua 2 mốc 1300 và 1700.',
        answerCode: `// Đây là thuật toán chuẩn dùng cho điều hòa, máy bơm nước và đèn cảm biến ánh sáng!`,
      },
    ],
  },

  {
    id: 'ex3-3',
    chapterId: 'ch3',
    number: 'Bài 3.3',
    title: 'Đọc Joystick 2 trục (VRx, VRy, SW) & Vùng chết (Deadzone)',
    level: 'Chương 3 • Tay cầm Robot',
    duration: '25 phút',
    summary: 'Đọc đồng thời 2 trục X/Y của Joystick KY-023 bằng ADC1, hiệu chuẩn tâm đứng yên (`centerVal`) và tạo vùng chết chống trôi xe.',
    componentsUsed: ['pot-joystick'],
    simulatorType: 'adc-joystick',
    learningGoals: [
      'Hiểu vì sao thả tay cần Joystick không trả về đúng `2048` mà bị lệch cơ khí.',
      'Viết hàm `calibrateJoystick(rawValue)` ép vùng giữa về `0` và map 2 nửa còn lại về `-255..+255`.',
      'Tích hợp nút nhấn `SW` giữa cần gạt để chuyển đổi chế độ tốc độ.',
    ],
    wiringSteps: [
      { from: 'Joystick +5V', to: 'ESP32 3V3', detail: '⚠️ Cấp 3.3V để dải ADC chuẩn 0–4095!' },
      { from: 'Joystick GND', to: 'ESP32 GND', detail: 'Nối đất chung' },
      { from: 'Joystick VRx', to: 'ESP32 GPIO34 (ADC1_CH6)', detail: 'Đọc trục ngang' },
      { from: 'Joystick VRy', to: 'ESP32 GPIO35 (ADC1_CH7)', detail: 'Đọc trục dọc' },
      { from: 'Joystick SW', to: 'ESP32 GPIO32 (INPUT_PULLUP)', detail: 'Nút ấn giữa cần gạt' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao phải viết hàm Calibrate chia 3 đoạn thay vì viết 1 dòng `map(raw, 0, 4095, -255, 255)`?',
        content:
          'Nếu chỉ viết `map(raw, 0, 4095, -255, 255)`, thì chỉ cần lò xo cần gạt hơi lệch về `2010` thay vì `2047`, kết quả trả ra sẽ là `-4` hoặc `+6`. Điều này làm động cơ xe robot lúc đứng yên vẫn bị rít nhẹ và ăn pin liên tục! Chia 3 đoạn với `deadzone = 200` đảm bảo vùng giữa luôn cho kết quả `0` tuyệt đối.',
      },
    ],
    code: `#include <Arduino.h>

#define PIN_VRX 34
#define PIN_VRY 35
#define PIN_SW  32

const int centerVal = 2020; // Đo thực tế khi thả tay
const int deadzone  = 200;

int calibrateJoystick(int rawValue) {
  if (rawValue > (centerVal - deadzone) && rawValue < (centerVal + deadzone)) return 0;
  if (rawValue <= (centerVal - deadzone)) return map(rawValue, 0, centerVal - deadzone, -255, 0);
  return map(rawValue, centerVal + deadzone, 4095, 0, 255);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SW, INPUT_PULLUP);
}

void loop() {
  int speedX = calibrateJoystick(analogRead(PIN_VRX));
  int speedY = calibrateJoystick(analogRead(PIN_VRY));
  bool turbo = (digitalRead(PIN_SW) == LOW);
  Serial.printf("X:%+4d | Y:%+4d | SW:%s\\n", speedX, speedY, turbo ? "NHẤN" : "THẢ");
  delay(80);
}`,
    codeBreakdown: [
      { line: 'if (rawValue > (centerVal - deadzone) && ...)', explain: 'Khóa vùng sai số cơ khí quanh tâm cần gạt về đúng 0.' },
      { line: 'pinMode(PIN_SW, INPUT_PULLUP);', explain: 'Cắm SW vào GPIO32 có sẵn pull-up nội (tránh GPIO34–39).' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Tự động hiệu chuẩn lúc bật nguồn (Auto-Calibrate)',
        task: 'Thay vì gán cứng `centerVal = 2020`, hãy đọc trung bình 20 lần giá trị Joystick ngay trong `setup()` lúc mới bật máy để tự lấy làm tâm chuẩn!',
        hint: 'Đọc `analogRead(PIN_VRX)` 20 lần trong `setup()` rồi chia 20.',
        answerCode: `long sum = 0;\nfor(int i=0; i<20; i++) { sum += analogRead(PIN_VRX); delay(5); }\ncenterX = sum / 20;`,
      },
      {
        level: 'Cấp 2 • Giới hạn tốc độ ECO / SPORT',
        task: 'Khi bấm nút SW giữa cần gạt, giới hạn tốc độ tối đa từ `±255` (SPORT) xuống `±140` (ECO cho người mới tập lái).',
        hint: 'Nhân hệ số `0.55f` khi đang ở chế độ ECO.',
        answerCode: `if (ecoMode) { speedX = speedX * 0.55; speedY = speedY * 0.55; }`,
      },
      {
        level: 'Cấp 3 • Tính tốc độ 2 bánh xe (Lái vi sai)',
        task: 'Từ `speedY` (Tiến/Lùi) và `speedX` (Rẽ Trái/Phải), tính lệnh tốc độ cho 2 bánh `leftWheel` và `rightWheel`.',
        hint: 'Bánh trái = `constrain(speedY + speedX, -255, 255)`, bánh phải = `constrain(speedY - speedX, -255, 255)`.',
        answerCode: `int leftMotor  = constrain(speedY + speedX, -255, 255);\nint rightMotor = constrain(speedY - speedX, -255, 255);`,
      },
    ],
  },

  // =========================================================================
  // CHƯƠNG 4: PWM, BUZZER & SERVO (BÀI 4.1 -> 4.3)
  // =========================================================================
  {
    id: 'ex4-1',
    chapterId: 'ch4',
    number: 'Bài 4.1',
    title: 'Điều chỉnh độ sáng LED mượt mà bằng xung PWM (Breathing LED)',
    level: 'Chương 4 • PWM cơ bản',
    duration: '15 phút',
    summary: 'Hiểu cách ESP32 tạo mức sáng êm ái từ 0% đến 100% chỉ bằng việc BẬT/TẮT siêu nhanh hàng nghìn lần/giây (Duty Cycle).',
    componentsUsed: ['led-resistor'],
    simulatorType: 'pwm-servo',
    learningGoals: [
      'Phân biệt xung Digital thuần túy (chỉ 0 hoặc 1) với xung PWM (`0–255`).',
      'Hiểu 2 thông số của PWM: **Tần số (Hz)** và **Độ rộng xung (Duty Cycle)**.',
    ],
    wiringSteps: [
      { from: 'ESP32 GPIO16 → Trở 220Ω', to: 'Anode (+) LED → GND', detail: 'Tất cả chân Output của ESP32 đều xuất được PWM!' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao mắt người không thấy LED chớp tắt mà lại thấy nó sáng mờ?',
        content:
          'Mắt người chỉ phân biệt được sự nhấp nháy dưới ~50Hz. Khi ESP32 xuất xung PWM ở tần số `5000 Hz` (tắt mở 5000 lần mỗi giây!), hiện tượng lưu ảnh trên võng mạc cộng gộp lại thành độ sáng đồng đều tỷ lệ thuận với phần trăm thời gian đèn sáng (`Duty Cycle`).',
      },
    ],
    code: `#include <Arduino.h>

#define LED_PWM 16

void setup() {
  pinMode(LED_PWM, OUTPUT);
}

void loop() {
  // Sáng dần từ 0 -> 255
  for (int duty = 0; duty <= 255; duty += 5) {
    analogWrite(LED_PWM, duty);
    delay(20);
  }
  // Tối dần từ 255 -> 0
  for (int duty = 255; duty >= 0; duty -= 5) {
    analogWrite(LED_PWM, duty);
    delay(20);
  }
}`,
    codeBreakdown: [
      { line: 'analogWrite(LED_PWM, duty);', explain: 'Xuất xung PWM 8-bit (0 = tắt hoàn toàn, 128 = sáng 50%, 255 = sáng 100%).' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Hiệu chỉnh phi tuyến (Gamma)',
        task: 'Mắt người nhạy ở vùng sáng yếu: thay vì tăng tuyến tính `+5`, hãy tăng theo bình phương `(i*i)/255` để thấy độ sáng chuyển mượt mà hơn nhiều ở mức tối!',
        hint: 'Dùng `int bright = (i * i) / 255;`.',
        answerCode: `for (int i = 0; i <= 255; i += 4) {\n  analogWrite(LED_PWM, (i * i) / 255);\n  delay(20);\n}`,
      },
      {
        level: 'Cấp 2 • Dùng LEDC phần cứng trực tiếp (Tùy chọn)',
        task: 'Tìm hiểu hàm `ledcAttach(16, 5000, 8)` (ESP32 Core v3) hoặc `ledcSetup(0, 5000, 8)` (Core v2) khi muốn tự chọn tần số lên tới 20kHz.',
        hint: 'Tần số cao >18kHz giúp động cơ DC không phát ra tiếng rít "e e" khó chịu.',
        answerCode: `// Core v3:\nledcAttach(16, 20000, 8);\nledcWrite(16, 128);`,
      },
      {
        level: 'Cấp 3 • Bắt bệnh chân Input-Only',
        task: 'Nếu bạn viết `analogWrite(35, 128);` thì chuyện gì xảy ra?',
        hint: 'GPIO35 chỉ hỗ trợ Input (đọc vào), không có mạch tạo PWM ra ngoài.',
        answerCode: `// Không xuất được tín hiệu! Hãy dùng GPIO4, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33.`,
      },
    ],
  },

  {
    id: 'ex4-2',
    chapterId: 'ch4',
    number: 'Bài 4.2',
    title: 'Kết hợp Biến trở chỉnh sáng LED & Phát nốt nhạc Còi Buzzer',
    level: 'Chương 4 • Tần số PWM',
    duration: '20 phút',
    summary: 'Ghép kiến thức ADC (Chương 3) với PWM (Chương 4): vặn biến trở điều chỉnh ánh sáng đèn ngủ và thay đổi tần số (Hz) tạo giai điệu còi Buzzer.',
    componentsUsed: ['pot-joystick', 'led-resistor'],
    simulatorType: 'buzzer-pwm',
    learningGoals: [
      'Ánh xạ trực tiếp dải `0–4095` của ADC sang `0–255` của PWM.',
      'Hiểu sự khác biệt giữa **thay đổi Duty Cycle** (chỉnh độ sáng/tốc độ) và **thay đổi Tần số Hz** (chỉnh cao độ âm thanh Buzzer thụ động).',
    ],
    wiringSteps: [
      { from: 'Biến trở (Chân giữa)', to: 'ESP32 GPIO34 (ADC1)', detail: 'Hai đầu ngoài nối 3V3 & GND' },
      { from: 'LED + Trở 220Ω', to: 'ESP32 GPIO16 → GND', detail: 'Độ sáng đổi theo biến trở' },
      { from: 'Còi Buzzer thụ động (+)', to: 'ESP32 GPIO25 → GND', detail: 'Phát tần số nốt nhạc (262Hz Đô, 294Hz Rê...)' },
    ],
    deepExplanations: [
      {
        title: 'Phân biệt Còi Buzzer Chủ động (Active) vs Thụ động (Passive)',
        content:
          'Còi **Chủ động** có sẵn mạch dao động bên trong — chỉ cần cấp `HIGH` 3.3V là tự kêu "bíp" một tông cố định (dùng `digitalWrite`). Còi **Thụ động** (thường nhìn thấy mạch in xanh ở mặt đáy) cần ESP32 xuất xung vuông thay đổi tần số liên tục bằng hàm `tone(pin, freqHz)` mới phát ra được các nốt nhạc Đồ-Rê-Mi-Fa-Sol!',
      },
    ],
    code: `#include <Arduino.h>

#define POT_PIN    34
#define LED_PIN    16
#define BUZZER_PIN 25

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  int raw = analogRead(POT_PIN);
  int brightness = map(raw, 0, 4095, 0, 255);
  analogWrite(LED_PIN, brightness);

  // Nếu vặn qua 90%, phát tiếng còi bíp cảnh báo nốt La (440Hz)
  if (brightness > 230) {
    tone(BUZZER_PIN, 440, 100);
  } else {
    noTone(BUZZER_PIN);
  }
  delay(50);
}`,
    codeBreakdown: [
      { line: 'int brightness = map(raw, 0, 4095, 0, 255);', explain: 'Thu gọn dải 12-bit (0..4095) xuống vừa khít dải PWM 8-bit (0..255).' },
      { line: 'tone(BUZZER_PIN, 440, 100);', explain: 'Phát xung vuông tần số 440 Hz (nốt La) trong 100ms.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Chơi thang âm Đồ-Rê-Mi',
        task: 'Tạo mảng `int notes[] = {262, 294, 330, 349, 392, 440, 494, 523};` và phát tuần tự từng nốt trong `setup()` mỗi nốt 250ms.',
        hint: 'Dùng `for(int i=0; i<8; i++) { tone(BUZZER_PIN, notes[i], 200); delay(250); }`.',
        answerCode: `int notes[] = {262, 294, 330, 349, 392, 440, 494, 523};\nfor (int i = 0; i < 8; i++) { tone(BUZZER_PIN, notes[i], 200); delay(250); }`,
      },
      {
        level: 'Cấp 2 • Biến trở chỉnh cao độ âm thanh (Theremin)',
        task: 'Dùng `map(raw, 0, 4095, 200, 1200)` để vặn biến trở thay đổi tiếng còi từ trầm (200Hz) lên bổng (1200Hz).',
        hint: 'Gọi `tone(BUZZER_PIN, freq);` liên tục theo biến trở.',
        answerCode: `int freq = map(analogRead(POT_PIN), 0, 4095, 200, 1200);\ntone(BUZZER_PIN, freq);`,
      },
      {
        level: 'Cấp 3 • Thử nghiệm Bộ mô phỏng',
        task: 'Kéo thanh trượt **Tần số PWM (Hz)** trong Bộ mô phỏng để nghe/xem bước sóng thay đổi từ nốt Đô (262Hz) lên nốt Đô cao (523Hz)!',
        hint: 'Tần số càng cao thì chu kỳ T = 1000/f (ms) càng ngắn.',
        answerCode: `// Tần số quy định cao độ (Pitch), còn Duty Cycle quy định độ lớn / độ sáng!`,
      },
    ],
  },

  {
    id: 'ex4-3',
    chapterId: 'ch4',
    number: 'Bài 4.3',
    title: 'Điều khiển góc Động cơ Servo SG90 (0°–180°) & Lái bằng Joystick',
    level: 'Chương 4 • Truyền động chính xác',
    duration: '25 phút',
    summary: 'Hiểu xung điều khiển chuẩn 50Hz (500–2400µs) của Servo SG90, cấp nguồn an toàn chống Brownout và lái góc Servo theo cần gạt.',
    componentsUsed: ['servo-sg90', 'pot-joystick'],
    simulatorType: 'pwm-servo',
    learningGoals: [
      'Cài đặt và sử dụng thư viện `ESP32Servo` thay cho `Servo.h` của Arduino Uno.',
      'Hiểu bản chất 50Hz (chu kỳ 20ms) và độ rộng xung `500µs → 2400µs`.',
      'Cấp nguồn 5V ngoài + nối chung GND để tránh làm sập nguồn ESP32.',
    ],
    wiringSteps: [
      { from: 'Servo Dây Nâu (GND)', to: 'GND nguồn 5V ngoài + GND ESP32', detail: 'Nối chung Mass hai bên' },
      { from: 'Servo Dây Đỏ (+5V)', to: 'Nguồn 5V ngoài (≥1A)', detail: '⚠️ Không nối vào chân 3V3!' },
      { from: 'Servo Dây Cam (Signal)', to: 'ESP32 GPIO13', detail: 'Chân PWM sạch' },
      { from: 'Biến trở / Joystick VRx (tùy chọn)', to: 'ESP32 GPIO34 (ADC1)', detail: 'Lái góc Servo theo tay vặn' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao Servo không quay theo điện áp trung bình như động cơ DC mà lại dùng 500–2400µs?',
        content:
          'Bên trong hộp nhựa SG90 có sẵn chip giải mã và biến trở đo góc trục quay. Cứ 20ms (50Hz) một lần, chip đọc độ rộng xung HIGH: `500µs` là 0°, `1500µs` là 90° (chính giữa), `2400µs` là 180°. Khoảng rộng này không phụ thuộc vào mức áp 3.3V hay 5V của tín hiệu, nên GPIO 3.3V của ESP32 lái trực tiếp Servo rất chuẩn!',
      },
    ],
    code: `#include <Arduino.h>
#include <ESP32Servo.h>

#define SERVO_PIN 13
#define POT_PIN   34

Servo myServo;

void setup() {
  Serial.begin(115200);
  myServo.setPeriodHertz(50);
  myServo.attach(SERVO_PIN, 500, 2400);
}

void loop() {
  int raw = analogRead(POT_PIN);
  int angle = map(raw, 0, 4095, 0, 180);
  myServo.write(angle);
  delay(20); // Cho Servo thời gian quay tới vị trí
}`,
    codeBreakdown: [
      { line: 'myServo.setPeriodHertz(50);', explain: 'Cài đúng tần số chuẩn 50Hz cho động cơ Servo.' },
      { line: 'myServo.attach(SERVO_PIN, 500, 2400);', explain: 'Giới hạn xung tối thiểu 500µs (0°) và tối đa 2400µs (180°).' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Quét gạt mưa tự động',
        task: 'Bỏ biến trở, viết code cho Servo quét mượt từ 0° lên 180° rồi quay lại 0° (mỗi bước 5°, nghỉ 30ms).',
        hint: 'Dùng 2 vòng lặp `for` tăng và giảm biến `angle`.',
        answerCode: `for(int a=0; a<=180; a+=5) { myServo.write(a); delay(30); }\nfor(int a=180; a>=0; a-=5) { myServo.write(a); delay(30); }`,
      },
      {
        level: 'Cấp 2 • Barie tự động bằng nút nhấn',
        task: 'Bình thường giữ Servo đóng Barie ở `0°`. Khi bấm nút GPIO18, mở Barie lên `90°`, giữ 3 giây rồi tự hạ xuống `0°`.',
        hint: 'Đọc `digitalRead(18) == LOW`, gọi `myServo.write(90); delay(3000); myServo.write(0);`.',
        answerCode: `if (digitalRead(18) == LOW) { myServo.write(90); delay(3000); myServo.write(0); }`,
      },
      {
        level: 'Cấp 3 • Bắt bệnh Brownout Reset',
        task: 'Nếu vừa cắm dây Signal cho Servo chạy mà Serial Monitor liên tục in dòng `Brownout detector was triggered`, nguyên nhân là gì và xử lý ra sao?',
        hint: 'Servo đang kéo sụt áp đường nguồn 5V/3.3V dùng chung với ESP32!',
        answerCode: `// Dùng bộ nguồn 5V ngoài riêng (>=1A-2A) cấp cho dây Đỏ của Servo, gắn thêm tụ 470uF và NỐI CHUNG GND với ESP32!`,
      },
    ],
  },

  // =========================================================================
  // CHƯƠNG 5: ĐA NHIỆM MILLIS() & CẢM BIẾN (BÀI 5.1 -> 5.3)
  // =========================================================================
  {
    id: 'ex5-1',
    chapterId: 'ch5',
    number: 'Bài 5.1',
    title: 'Thoát khỏi delay(): Đa nhiệm Non-blocking với millis()',
    level: 'Chương 5 • Tư duy Nhúng chuyên nghiệp',
    duration: '20 phút',
    summary: 'Kỹ thuật quan trọng nhất giúp ESP32 chạy mượt nhiều tác vụ cùng lúc: chớp 2 LED ở 2 chu kỳ khác nhau mà nút bấm vẫn phản hồi tức thì.',
    componentsUsed: ['led-resistor', 'push-button'],
    simulatorType: 'millis-dual',
    learningGoals: [
      'Hiểu vì sao `delay()` là "kẻ thù" của các hệ thống IoT và Robot thời gian thực.',
      'Thành thạo mẫu thiết kế `if (millis() - prevTime >= interval)` cho nhiều tác vụ song song.',
    ],
    wiringSteps: [
      { from: 'LED 1 + Trở 220Ω', to: 'ESP32 GPIO16 → GND', detail: 'Chớp nhanh mỗi 250ms' },
      { from: 'LED 2 + Trở 220Ω', to: 'ESP32 GPIO17 → GND', detail: 'Chớp chậm mỗi 1000ms' },
      { from: 'Nút nhấn', to: 'ESP32 GPIO18 ↔ GND', detail: 'Bấm phát ăn ngay không bị khựng!' },
    ],
    deepExplanations: [
      {
        title: 'Làm sao 1 vòng `loop()` quản lý cùng lúc 3–4 mốc thời gian khác nhau?',
        content:
          'Hãy tưởng tượng bạn đang nấu cơm (20 phút), luộc trứng (6 phút) và chờ chuông cửa: bạn KHÔNG ngồi nhìn chằm chằm nồi cơm suốt 20 phút không làm gì cả (`delay()`), mà bạn nhìn đồng hồ treo tường (`millis()`) để kiểm tra xem việc nào tới hạn thì xử lý ngay rồi quay lại theo dõi tiếp!',
      },
    ],
    code: `#include <Arduino.h>

#define LED1 16
#define LED2 17
#define BTN  18

unsigned long t1 = 0, t2 = 0;
bool s1 = false, s2 = false;

void setup() {
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(BTN, INPUT_PULLUP);
}

void loop() {
  unsigned long now = millis();

  // Tác vụ 1: Chớp LED1 mỗi 250ms
  if (now - t1 >= 250) {
    t1 = now;
    s1 = !s1;
    digitalWrite(LED1, s1);
  }

  // Tác vụ 2: Chớp LED2 mỗi 1000ms (Độc lập hoàn toàn với Tác vụ 1)
  if (now - t2 >= 1000) {
    t2 = now;
    s2 = !s2;
    digitalWrite(LED2, s2);
  }

  // Tác vụ 3: Đọc nút nhấn phản hồi tức thì 0ms trễ!
  if (digitalRead(BTN) == LOW) {
    digitalWrite(LED1, HIGH);
    digitalWrite(LED2, HIGH);
  }
}`,
    codeBreakdown: [
      { line: 'if (now - t1 >= 250) { t1 = now; ... }', explain: 'Kiểm tra đồng hồ không chặn: nếu chưa đủ 250ms, CPU lập tức bỏ qua đi kiểm tra Tác vụ 2 và Tác vụ 3!' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Thêm tác vụ thứ 3 (In Serial mỗi 2 giây)',
        task: 'Bổ sung thêm biến `t3` để cứ mỗi `2000ms` tự động in ra dòng `"Hệ thống đang chạy ổn định!"` mà không làm khựng 2 đèn LED.',
        hint: 'Tạo thêm `unsigned long t3 = 0;` và `if (now - t3 >= 2000)`.',
        answerCode: `if (now - t3 >= 2000) { t3 = now; Serial.println("Hệ thống ổn định!"); }`,
      },
      {
        level: 'Cấp 2 • Bật/Tắt chế độ chớp bằng nút bấm',
        task: 'Giữ nguyên 2 đèn chớp song song, nhưng thêm 1 nút nhấn Toggle (Bài 2.2) để tạm dừng hoặc chạy tiếp hiệu ứng đèn.',
        hint: 'Thêm biến `bool isRunning = true;` bọc bên ngoài 2 khối `if (now - t1...)`.',
        answerCode: `if (isRunning) { /* Chạy Tác vụ 1 & 2 */ }`,
      },
      {
        level: 'Cấp 3 • Thử nghiệm Bộ mô phỏng',
        task: 'So sánh trong Bộ mô phỏng **Đa nhiệm millis()** phía trên khi bấm nút ở chế độ `Dùng millis()` vs `Dùng delay(2000)`!',
        hint: 'Ở chế độ `delay()`, bạn phải đợi hết thời gian ngủ nút mới có phản hồi.',
        answerCode: `// Đây là nền tảng bắt buộc cho các dự án có LCD + OLED + ESP-NOW chạy đồng thời!`,
      },
    ],
  },

  {
    id: 'ex5-2',
    chapterId: 'ch5',
    number: 'Bài 5.2',
    title: 'Cảm biến chuyển động thân nhiệt PIR (HC-SR501)',
    level: 'Chương 5 • Nhà thông minh',
    duration: '20 phút',
    summary: 'Phát hiện người đi qua để tự động bật đèn hành lang / báo trộm với cảm biến PIR xuất mức 3.3V chuẩn cho ESP32.',
    componentsUsed: ['hc-sr501', 'led-resistor'],
    simulatorType: 'ultrasonic-pir',
    learningGoals: [
      'Hiểu cách hiệu chỉnh 2 biến trở cam (Độ nhạy `Sx` và Thời gian trễ `Tx`) trên lưng PIR.',
      'Phân biệt pha làm nóng (Warm-up 30–60s) lúc mới cấp nguồn để không tưởng cảm biến bị lỗi.',
    ],
    wiringSteps: [
      { from: 'PIR VCC', to: 'ESP32 VIN / 5V', detail: 'PIR có IC ổn áp 3.3V bên trong nên cấp 5V vào VCC' },
      { from: 'PIR OUT', to: 'ESP32 GPIO27', detail: 'Xuất mức chuẩn 3.3V khi có chuyển động' },
      { from: 'PIR GND', to: 'ESP32 GND', detail: 'Nối đất chung' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao vặn biến trở Time Delay về tối thiểu nhưng đèn vẫn sáng thêm vài giây?',
        content:
          'Chip xử lý BISS0001 trên HC-SR501 có thời gian giữ xung tối thiểu khoảng **2.5 đến 3 giây** ngay cả khi bạn vặn biến trở `Tx` hết cỡ ngược chiều kim đồng hồ. Ngoài ra, nếu bạn đặt Jumper ở vị trí `H` (Repeatable), miễn là bạn còn nhúc nhích trong vùng quét, bộ đếm 3 giây sẽ tự reset làm đèn sáng liên tục.',
      },
    ],
    code: `#include <Arduino.h>

#define PIR_PIN 27
#define LED_PIN 16

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Chờ PIR ổn định nhiệt độ 30s...");
}

void loop() {
  int motion = digitalRead(PIR_PIN);
  digitalWrite(LED_PIN, motion);
  if (motion == HIGH) {
    Serial.println("⚠️ Phát hiện chuyển động!");
  }
  delay(200);
}`,
    codeBreakdown: [
      { line: 'int motion = digitalRead(PIR_PIN);', explain: 'Đọc tín hiệu số 3.3V từ chân OUT của HC-SR501 (HIGH = Có người).' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Bắt sườn lúc vừa có người vào',
        task: 'Chỉ in dòng thông báo `"Có người vừa bước vào!"` đúng 1 lần khi trạng thái chuyển từ `LOW → HIGH` thay vì in liên tục mỗi 200ms.',
        hint: 'Lưu biến `lastMotion` và kiểm tra `if (motion == HIGH && lastMotion == LOW)`.',
        answerCode: `if (motion == HIGH && lastMotion == LOW) Serial.println("Có người vừa bước vào!");\nlastMotion = motion;`,
      },
      {
        level: 'Cấp 2 • Đèn hành lang tự giữ sáng bằng phần mềm (10 giây)',
        task: 'Vặn biến trở `Tx` trên PIR về mức nhỏ nhất (3s), dùng `millis()` trong code để mỗi khi có chuyển động thì giữ đèn sáng đúng 10 giây rồi mới tắt!',
        hint: 'Cập nhật `lastMotionTime = millis()` khi thấy `motion == HIGH`; tắt đèn khi `millis() - lastMotionTime > 10000`.',
        answerCode: `if (digitalRead(PIR_PIN) == HIGH) { lastMotionTime = millis(); digitalWrite(LED_PIN, HIGH); }\nif (millis() - lastMotionTime > 10000) digitalWrite(LED_PIN, LOW);`,
      },
      {
        level: 'Cấp 3 • Xử lý nhiễu sóng Wi-Fi',
        task: 'Nếu khi bật Wi-Fi mà cảm biến PIR thỉnh thoảng tự nhảy `HIGH` dù phòng trống không, bạn cần xử lý phần cứng thế nào?',
        hint: 'Ăng-ten Wi-Fi phát công suất đỉnh 20dBm gây nhiễu lên mạch khuếch đại nhạy của PIR.',
        answerCode: `// Dời PIR cách xa ăng-ten ESP32 ít nhất 15cm, rút ngắn dây OUT, hoặc lắp thêm tụ 100uF lọc nguồn VCC cho PIR.`,
      },
    ],
  },

  {
    id: 'ex5-3',
    chapterId: 'ch5',
    number: 'Bài 5.3',
    title: 'Đo khoảng cách Siêu âm (HC-SR04) & Cầu phân áp bảo vệ Echo',
    level: 'Chương 5 • Cảm biến vật cản Robot',
    duration: '25 phút',
    summary: 'Phát chùm sóng 40kHz, đo thời gian dội về bằng `pulseIn()` có timeout tránh đơ xe robot và bảo vệ chân GPIO khỏi xung 5V.',
    componentsUsed: ['hc-sr04'],
    simulatorType: 'ultrasonic-pir',
    learningGoals: [
      'Áp dụng công thức `Khoảng cách (cm) = (Thời gian_µs × 0.0343) / 2`.',
      'Lắp đúng cầu phân áp `1kΩ + 2kΩ` hạ xung Echo từ 5V xuống 3.33V.',
      'Luôn truyền tham số timeout (VD: `30000 µs`) cho hàm `pulseIn()`.',
    ],
    wiringSteps: [
      { from: 'HC-SR04 VCC', to: 'ESP32 VIN / 5V', detail: 'Cấp 5V cho HC-SR04 bản xanh tiêu chuẩn' },
      { from: 'HC-SR04 Trig', to: 'ESP32 GPIO5', detail: 'Nối thẳng được (3.3V kích tốt)' },
      { from: 'HC-SR04 Echo', to: 'GPIO18 qua cầu phân áp 1kΩ + 2kΩ', detail: '⚠️ Hạ xung 5V xuống 3.33V bảo vệ ESP32' },
      { from: 'HC-SR04 GND', to: 'ESP32 GND', detail: 'Nối đất chung' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao thiếu tham số timeout trong `pulseIn(ECHO, HIGH, 30000)` lại làm xe robot bị khựng?',
        content:
          'Nếu xe quay mặt ra hành lang dài >5m không có vật phản xạ, hàm `pulseIn(ECHO, HIGH)` không có timeout sẽ đứng đợi tròn **1 giây** mới chịu đi tiếp! Với tốc độ xe chạy, 1 giây đơ mạch đủ để xe mất điều khiển. Timeout `30000µs` giới hạn tầm đo tối đa 5m và kết thúc chỉ trong tối đa 30ms.',
      },
    ],
    code: `#include <Arduino.h>

#define TRIG_PIN 5
#define ECHO_PIN 18
#define ALERT_LED 16

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(ALERT_LED, OUTPUT);
}

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return -1.0f;
  return (duration * 0.0343f) / 2.0f;
}

void loop() {
  float d = readDistanceCm();
  if (d > 0) {
    Serial.printf("Khoảng cách: %.1f cm\\n", d);
    digitalWrite(ALERT_LED, (d < 20.0f) ? HIGH : LOW);
  } else {
    Serial.println("Ngoài tầm đo (>5m)");
    digitalWrite(ALERT_LED, LOW);
  }
  delay(80);
}`,
    codeBreakdown: [
      { line: 'digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);', explain: 'Xung kích 10µs phát lệnh cho loa siêu âm bắn sóng.' },
      { line: 'long duration = pulseIn(ECHO_PIN, HIGH, 30000);', explain: 'Đo độ rộng xung phản hồi, tự thoát sau 30ms nếu không thấy vật cản.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Lọc trung vị (Median 3 mẫu) chống nhảy số ảo',
        task: 'Đôi khi siêu âm trả về 1 giá trị nhiễu bất thường (VD: tự dưng nhảy về 2cm). Hãy đọc 3 lần (cách nhau 30ms) rồi lấy giá trị ở giữa (hoặc trung bình bỏ số 0).',
        hint: 'Đọc 3 mẫu a, b, c; bỏ các mẫu `<= 0` rồi lấy trung bình.',
        answerCode: `float sum = 0; int cnt = 0;\nfor(int i=0; i<3; i++){ float v=readDistanceCm(); if(v>0){sum+=v; cnt++;} delay(30); }\nfloat avg = (cnt>0) ? sum/cnt : -1;`,
      },
      {
        level: 'Cấp 2 • Cảm biến lùi xe (Còi bíp nhanh dần khi càng gần)',
        task: 'Gắn thêm còi Buzzer ở GPIO25: nếu vật cản cách 30–50cm thì bíp chậm (500ms); 15–30cm bíp vừa (200ms); dưới 15cm kêu liên tục!',
        hint: 'Dùng cấu trúc `if (d < 15) ... else if (d < 30) ... else if (d < 50) ...`.',
        answerCode: `if (d > 0 && d < 15) tone(25, 1000);\nelse if (d > 0 && d < 30) { tone(25, 1000, 80); delay(150); }\nelse noTone(25);`,
      },
      {
        level: 'Cấp 3 • Thử nghiệm Bộ mô phỏng',
        task: 'Kéo thanh trượt khoảng cách trong Bộ mô phỏng xuống dưới `20 cm` và xem giá trị thời gian `pulseIn()` (µs) tương ứng.',
        hint: '20cm tương ứng `duration ≈ 1166 µs`.',
        answerCode: `// Ở 2cm (tối thiểu của HC-SR04), duration ≈ 116 µs.`,
      },
    ],
  },

  // =========================================================================
  // CHƯƠNG 6: GIAO TIẾP I2C & MÀN HÌNH (BÀI 6.1 -> 6.2)
  // =========================================================================
  {
    id: 'ex6-1',
    chapterId: 'ch6',
    number: 'Bài 6.1',
    title: 'Quét địa chỉ Bus I2C (Scanner) & Hiển thị OLED SSD1306',
    level: 'Chương 6 • Màn hình giao tiếp 2 dây',
    duration: '20 phút',
    summary: 'Kiểm tra kết nối phần cứng màn hình I2C chỉ trong 5 giây bằng bộ quét địa chỉ và xuất chữ, số lên màn hình OLED 0.96".',
    componentsUsed: ['oled-lcd-i2c'],
    simulatorType: 'i2c-display',
    learningGoals: [
      'Nắm vững cặp chân I2C chuẩn: ESP32 Classic (`SDA=21, SCL=22`) và ESP32-S3/C3 (`SDA=8, SCL=9`).',
      'Luôn chạy I2C Scanner khi màn hình mới mua không lên chữ để biết chính xác địa chỉ (`0x3C`, `0x3D`, `0x27`, `0x3F`).',
    ],
    wiringSteps: [
      { from: 'OLED GND', to: 'ESP32 GND', detail: '⚠️ Đọc kỹ nhãn VCC/GND trước khi cắm!' },
      { from: 'OLED VCC', to: 'ESP32 3V3', detail: 'OLED SSD1306 chạy mát và ổn định ở 3.3V' },
      { from: 'OLED SCL', to: 'GPIO22 (Classic) / GPIO9 (S3, C3)', detail: 'Đường xung nhịp đồng bộ' },
      { from: 'OLED SDA', to: 'GPIO21 (Classic) / GPIO8 (S3, C3)', detail: 'Đường dữ liệu 2 chiều' },
    ],
    deepExplanations: [
      {
        title: 'Quét I2C không thấy thiết bị nào (`0 devices found`) — 4 lỗi phổ biến nhất?',
        content:
          '(1) Lỏng dây hoặc cắm nhầm **SDA ↔ SCL**; (2) Chưa gọi `Wire.begin(SDA, SCL)` đúng chân với board ESP32-S3/C3; (3) Màn hình không có nguồn 3.3V hoặc bị ngược VCC-GND; (4) Thiếu điện trở kéo lên (Pull-up 4.7kΩ) nếu bạn dùng IC rời chưa có module.',
      },
    ],
    code: `#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22); // ESP32-S3/C3 đổi thành Wire.begin(8, 9);
  Serial.println("\\n--- Quét thiết bị I2C ---");

  for (byte addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("✓ Tìm thấy thiết bị I2C tại: 0x%02X\\n", addr);
    }
  }
}

void loop() {}`,
    codeBreakdown: [
      { line: 'Wire.begin(21, 22);', explain: 'Mở bus I2C trên cặp chân SDA=21, SCL=22.' },
      { line: 'if (Wire.endTransmission() == 0)', explain: 'Thiết bị có địa chỉ `addr` đã gửi tín hiệu xác nhận ACK trả về!' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • In chữ lên OLED bằng Adafruit_SSD1306',
        task: 'Sau khi xác nhận địa chỉ `0x3C`, nạp code khởi tạo `Adafruit_SSD1306` để in tên của bạn cỡ chữ 2 lên màn hình.',
        hint: 'Đừng quên gọi `display.display();` ở cuối mới xuất hình ra kính!',
        answerCode: `display.clearDisplay();\ndisplay.setTextSize(2);\ndisplay.setTextColor(SSD1306_WHITE);\ndisplay.setCursor(10, 20);\ndisplay.println("ESP32 OK!");\ndisplay.display();`,
      },
      {
        level: 'Cấp 2 • Thanh tiến trình (Progress Bar) theo Biến trở',
        task: 'Dùng hàm `display.fillRect(10, 35, barWidth, 14, SSD1306_WHITE);` với `barWidth = map(analogRead(34), 0, 4095, 0, 108)` để vẽ thanh mức pin/ga trực quan.',
        hint: 'Vẽ thêm khung viền `drawRect(10, 35, 108, 14, SSD1306_WHITE)` bên ngoài.',
        answerCode: `display.drawRect(10, 35, 108, 14, SSD1306_WHITE);\ndisplay.fillRect(10, 35, map(analogRead(34), 0, 4095, 0, 108), 14, SSD1306_WHITE);`,
      },
      {
        level: 'Cấp 3 • Tối ưu tốc độ I2C không giật mạch',
        task: 'Khi dùng LCD 16x2 I2C kèm điều khiển xe, tại sao không được cập nhật LCD mỗi vòng `loop()`?',
        hint: 'Bus I2C gửi chuỗi LCD rất chậm — làm nghẽn vòng lặp đọc Joystick/ESP-NOW!',
        answerCode: `// Giới hạn cập nhật LCD bằng millis() mỗi 300-500ms:\nif (millis() - lastLcd >= 500) { lastLcd = millis(); updateLcd(); }`,
      },
    ],
  },

  {
    id: 'ex6-2',
    chapterId: 'ch6',
    number: 'Bài 6.2',
    title: 'Đọc cảm biến 6 trục MPU6050 & Chia sẻ chung Bus I2C với OLED',
    level: 'Chương 6 • Đa thiết bị trên 1 Bus',
    duration: '25 phút',
    summary: 'Nối song song cả màn hình OLED (`0x3C`) và cảm biến MPU6050 (`0x68`) vào chung 2 sợi dây I2C để hiển thị góc nghiêng theo thời gian thực.',
    componentsUsed: ['mpu6050', 'oled-lcd-i2c'],
    simulatorType: 'i2c-display',
    learningGoals: [
      'Nối nhiều thiết bị chung bus I2C nhờ địa chỉ khác nhau (`0x3C` và `0x68`).',
      'Hiểu thanh ghi đánh thức nguồn (`0x6B`) của MPU6050 và công thức tính góc nghiêng `atan2()`.',
    ],
    wiringSteps: [
      { from: 'OLED + MPU6050 VCC', to: 'ESP32 3V3', detail: 'Cả 2 cùng chia sẻ nguồn 3.3V' },
      { from: 'OLED + MPU6050 GND', to: 'ESP32 GND', detail: 'Nối chung Mass' },
      { from: 'OLED SCL + MPU6050 SCL', to: 'ESP32 GPIO22', detail: 'Chập chung vào 1 chân SCL!' },
      { from: 'OLED SDA + MPU6050 SDA', to: 'ESP32 GPIO21', detail: 'Chập chung vào 1 chân SDA!' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao mới bật lên mà MPU6050 toàn trả về số `0`?',
        content:
          'Mặc định khi cấp nguồn, chip MPU6050 nằm ở chế độ Ngủ (Sleep Mode) để tiết kiệm điện. Trước khi đọc thanh ghi gia tốc `0x3B`, bạn BẮT BUỘC phải ghi giá trị `0` vào thanh ghi `PWR_MGMT_1` (`0x6B`) để đánh thức chip dậy!',
      },
    ],
    code: `#include <Wire.h>
#include <math.h>

const int MPU = 0x68;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  Wire.setClock(400000); // Chế độ Fast I2C 400kHz

  // Đánh thức MPU6050 khỏi chế độ ngủ
  Wire.beginTransmission(MPU);
  Wire.write(0x6B);
  Wire.write(0);
  Wire.endTransmission(true);
}

void loop() {
  Wire.beginTransmission(MPU);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU, 6, true);

  int16_t ax = Wire.read() << 8 | Wire.read();
  int16_t ay = Wire.read() << 8 | Wire.read();
  int16_t az = Wire.read() << 8 | Wire.read();

  float pitch = atan2(ax, sqrt((long)ay * ay + (long)az * az)) * 180.0 / PI;
  Serial.printf("Góc nghiêng Pitch: %+.1f độ\\n", pitch);
  delay(100);
}`,
    codeBreakdown: [
      { line: 'Wire.write(0x6B); Wire.write(0);', explain: 'Đánh thức cảm biến MPU6050 bắt đầu lấy mẫu.' },
      { line: 'atan2(ax, sqrt(ay*ay + az*az))', explain: 'Tính góc nghiêng so với phương thẳng đứng từ vectơ trọng lực 3 trục.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Tính thêm góc Roll (nghiêng ngang)',
        task: 'Bổ sung công thức tính góc `roll = atan2(ay, sqrt((long)ax*ax + (long)az*az)) * 180.0 / PI;` và in song song cả Pitch và Roll.',
        hint: 'Thay `ax` bằng `ay` ở tử số của hàm `atan2`.',
        answerCode: `float roll = atan2(ay, sqrt((long)ax * ax + (long)az * az)) * 180.0 / PI;`,
      },
      {
        level: 'Cấp 2 • Thước thủy điện tử (Cảnh báo cân bằng)',
        task: 'Nếu góc nghiêng Pitch & Roll đều nằm trong khoảng `-3°` đến `+3°`, bật đèn LED xanh báo mặt phẳng đã cân bằng tuyệt đối!',
        hint: 'Kiểm tra `abs(pitch) < 3.0 && abs(roll) < 3.0`.',
        answerCode: `digitalWrite(16, (abs(pitch) < 3.0f && abs(roll) < 3.0f) ? HIGH : LOW);`,
      },
      {
        level: 'Cấp 3 • Dùng 2 cảm biến MPU6050 trên cùng 1 bus I2C',
        task: 'Nếu cánh tay robot cần đọc góc của cả cánh tay trên và cẳng tay (2 con MPU6050 chung GPIO21/22), làm sao tránh trùng địa chỉ `0x68`?',
        hint: 'Xem lại công dụng chân `AD0` trong Datasheet MPU6050!',
        answerCode: `// Con 1: nối AD0 -> GND (địa chỉ 0x68)\n// Con 2: nối AD0 -> 3V3 (địa chỉ 0x69)`,
      },
    ],
  },

  // =========================================================================
  // CHƯƠNG 7: CÔNG SUẤT, ĐỘNG CƠ DRV8833 & KHÔNG DÂY (BÀI 7.1 -> 7.3)
  // =========================================================================
  {
    id: 'ex7-1',
    chapterId: 'ch7',
    number: 'Bài 7.1',
    title: 'Đóng ngắt tải an toàn với Module Relay (Chống nháy lúc Boot)',
    level: 'Chương 7 • Điều khiển công suất',
    duration: '20 phút',
    summary: 'Hiểu cơ chế kích mức Thấp (Active LOW) của đa số module Relay, cách chọn chân GPIO không phát xung rác và chốt trạng thái TẮT trước khi mở Output.',
    componentsUsed: ['relay-module', 'push-button'],
    simulatorType: 'relay-sim',
    learningGoals: [
      'Chọn đúng chân GPIO sạch (như `GPIO26, 27, 32, 33`) tránh Relay "tạch" 1 cái khi mất điện có lại.',
      'Chốt lệnh `digitalWrite(RELAY, OFF)` TRƯỚC `pinMode(RELAY, OUTPUT)`.',
      'Biết cách đấu đúng 2 đầu tiếp điểm `COM` & `NO` để đóng ngắt bóng đèn / máy bơm.',
    ],
    wiringSteps: [
      { from: 'Relay VCC', to: 'ESP32 VIN / 5V', detail: 'Relay 5V cần đủ nguồn 5V mới hút tiếp điểm chắc' },
      { from: 'Relay GND', to: 'ESP32 GND', detail: 'Nối đất chung' },
      { from: 'Relay IN', to: 'ESP32 GPIO26', detail: 'Chân sạch không phát xung PWM lúc boot' },
      { from: 'Domino COM & NO', to: 'Cắt nối tiếp 1 dây nguồn của tải', detail: '⚡ Tuyệt đối không đấu 2 cực nguồn vào COM & NO!' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao phải viết `digitalWrite(RELAY, HIGH)` TRƯỚC `pinMode(RELAY, OUTPUT)` với Relay kích LOW?',
        content:
          'Thanh ghi đầu ra mặc định khi khởi động bằng `0` (LOW). Nếu bạn viết `pinMode(26, OUTPUT)` trước rồi mới `digitalWrite(26, HIGH)`, chân GPIO26 sẽ bị kéo xuống `LOW` trong vài micro-giây giữa 2 lệnh đó — đủ để module Relay kích âm "tạch" một phát rồi mới nhả ra! Đảo thứ tự chốt `HIGH` trước khi mở `OUTPUT` giúp Relay im lặng tuyệt đối lúc khởi động.',
      },
    ],
    code: `#include <Arduino.h>

#define RELAY_PIN  26
#define RELAY_ON   LOW   // Đa số Relay module xanh kích mức Thấp (Active LOW)
#define RELAY_OFF  HIGH

void setup() {
  Serial.begin(115200);
  digitalWrite(RELAY_PIN, RELAY_OFF); // Chốt TẮT trước!
  pinMode(RELAY_PIN, OUTPUT);
}

void loop() {
  Serial.println("⚡ ĐÓNG Relay (Tải BẬT)");
  digitalWrite(RELAY_PIN, RELAY_ON);
  delay(2500);

  Serial.println("🔌 NHẢ Relay (Tải TẮT)");
  digitalWrite(RELAY_PIN, RELAY_OFF);
  delay(2500);
}`,
    codeBreakdown: [
      { line: 'digitalWrite(RELAY_PIN, RELAY_OFF); pinMode(RELAY_PIN, OUTPUT);', explain: 'Mẹo kỹ thuật chống giật Relay trong tích tắc lúc cấp nguồn.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Công tắc thông minh nút nhấn + Relay',
        task: 'Kết hợp Bài 2.2: mỗi lần nhấn nút ở GPIO18 thì đảo trạng thái đóng/ngắt Relay ở GPIO26.',
        hint: 'Thay biến điều khiển `LED_PIN` bằng `RELAY_PIN` với hằng số `RELAY_ON / RELAY_OFF`.',
        answerCode: `digitalWrite(RELAY_PIN, relayActive ? RELAY_ON : RELAY_OFF);`,
      },
      {
        level: 'Cấp 2 • Bơm tưới cây tự động hẹn giờ an toàn',
        task: 'Nếu cảm biến độ ẩm đất báo khô, bật bơm 5 giây rồi BẮT BUỘC nghỉ ít nhất 30 giây mới đo lại (tránh ngập úng).',
        hint: 'Dùng `millis()` tạo chu kỳ khóa nghỉ 30s sau mỗi lần tưới.',
        answerCode: `// Chỉ tưới khi khô && (millis() - lastWater > 30000)`,
      },
      {
        level: 'Cấp 3 • Bắt bệnh Relay bật lên rồi không chịu tắt',
        task: 'Nếu đèn báo trên module Relay vẫn sáng mờ khi ESP32 đã xuất `HIGH` (3.3V) và Relay không chịu nhả ra, nguyên nhân do đâu?',
        hint: 'Chênh lệch giữa VCC 5V của mạch Relay và mức HIGH 3.3V của ESP32 là `5V - 3.3V = 1.7V` vẫn đủ làm LED Opto dẫn dòng!',
        answerCode: `// Cách sửa: Dùng module Relay có Jumper JD-VCC cấp riêng 3.3V cho phần kích IN, hoặc thêm 1 con transistor NPN C1815 kích đệm.`,
      },
    ],
  },

  {
    id: 'ex7-2',
    chapterId: 'ch7',
    number: 'Bài 7.2',
    title: 'Làm chủ Cầu H DRV8833: Điều khiển 2 Bánh xe Robot (Tiến/Lùi/Xoay)',
    level: 'Chương 7 • Xe Robot thực chiến',
    duration: '30 phút',
    summary: 'Lắp mạch điều khiển 2 động cơ DC hoàn chỉnh với module DRV8833, bật chân STBY/SLP và viết hàm `moveCar(left, right)` chuyên nghiệp.',
    componentsUsed: ['drv8833', 'pot-joystick'],
    simulatorType: 'drv8833-motor',
    learningGoals: [
      'Đấu đúng nguồn pin 2S (7.4V) vào `VM` và nối chung `GND` với ESP32.',
      'Không bao giờ quên kéo chân `STBY / SLP` lên mức `HIGH` (3.3V).',
      'Điều khiển chiều quay và tốc độ bằng hàm `driveMotor(in1, in2, speed)` (-255 đến +255).',
    ],
    wiringSteps: [
      { from: 'Pin Li-ion 2S (7.4V) (+)', to: 'DRV8833 VM', detail: '⚠️ Tối đa 10.8V — không dùng pin 3S 12.6V!' },
      { from: 'Pin (-) & ESP32 GND', to: 'DRV8833 GND', detail: 'Nối chung Mass hai bên' },
      { from: 'ESP32 GPIO25', to: 'DRV8833 STBY / SLP', detail: 'Kéo HIGH (3.3V) để bật mạch driver' },
      { from: 'ESP32 GPIO18 / GPIO19', to: 'DRV8833 AIN1 / AIN2', detail: 'Motor Trái (AO1, AO2)' },
      { from: 'ESP32 GPIO23 / GPIO26', to: 'DRV8833 BIN1 / BIN2', detail: 'Motor Phải (BO1, BO2)' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao xe lắp đúng code mà một bánh lại chạy ngược chiều bánh kia?',
        content:
          'Hai động cơ gắn đối xứng hai bên khung xe quay ngược hướng tự nhiên với nhau! Thay vì tháo hàn dây, bạn chỉ việc rút tráo 2 dây động cơ tại cặp `AO1 ↔ AO2` (hoặc thêm dấu trừ `-leftSpeed` ngay trong hàm `moveCar()`).',
      },
    ],
    code: `#include <Arduino.h>

#define AIN1 18
#define AIN2 19
#define BIN1 23
#define BIN2 26
#define SLP  25  // Chân STBY / SLP bắt buộc lên HIGH!

void driveMotor(int in1, int in2, int speed) {
  speed = constrain(speed, -255, 255);
  if (speed > 0) {
    analogWrite(in1, speed); analogWrite(in2, 0);
  } else if (speed < 0) {
    analogWrite(in1, 0); analogWrite(in2, -speed);
  } else {
    analogWrite(in1, 0); analogWrite(in2, 0);
  }
}

void moveCar(int leftSpd, int rightSpd) {
  driveMotor(AIN1, AIN2, leftSpd);
  driveMotor(BIN1, BIN2, rightSpd);
}

void setup() {
  pinMode(SLP, OUTPUT);
  digitalWrite(SLP, HIGH); // Đánh thức DRV8833!
  moveCar(0, 0);
}

void loop() {
  moveCar(180, 180);   delay(1500); // Tiến thẳng
  moveCar(-150, 150);  delay(800);  // Xoay trái tại chỗ
  moveCar(0, 0);       delay(1000); // Dừng
}`,
    codeBreakdown: [
      { line: 'digitalWrite(SLP, HIGH);', explain: 'Kích hoạt IC DRV8833 thoát khỏi trạng thái Sleep.' },
      { line: 'moveCar(-150, 150);', explain: 'Bánh trái quay lùi, bánh phải quay tiến giúp xe xoay vòng tại chỗ.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Chức năng Phanh gấp (Brake) vs Trôi tự do (Coast)',
        task: 'Sửa trường hợp `speed == 0` xuất `255` vào cả `in1` và `in2` để kích hoạt chế độ Phanh điện từ (Brake) giúp xe dừng khựng ngay khi xuống dốc!',
        hint: 'Theo Datasheet DRV8833: `IN1=1, IN2=1` nối tắt 2 cực động cơ để hãm phanh.',
        answerCode: `else { analogWrite(in1, 255); analogWrite(in2, 255); } // Short Brake!`,
      },
      {
        level: 'Cấp 2 • Xe tự tránh vật cản (Kết hợp Bài 5.3 + Bài 7.2)',
        task: 'Gắn HC-SR04 phía trước xe: khi khoảng cách > 25cm thì cho xe chạy thẳng `(180, 180)`, nếu < 25cm thì dừng 200ms, lùi lại 400ms rồi xoay phải tránh!',
        hint: 'Gọi `float d = readDistanceCm();` trong `loop()` trước khi chọn lệnh `moveCar()`.',
        answerCode: `if (d > 0 && d < 25) { moveCar(0,0); delay(200); moveCar(-160,-160); delay(400); moveCar(160,-160); delay(450); } else moveCar(180,180);`,
      },
      {
        level: 'Cấp 3 • Thử nghiệm Bộ mô phỏng',
        task: 'Bỏ dấu tích `Chân STBY = HIGH` trong Bộ mô phỏng để thấy mạch DRV8833 lập tức về trạng thái ngủ `NGỦ (STBY=0)` dù thanh trượt PWM đang ở `180`!',
        hint: 'Động cơ chỉ chạy khi STBY ở mức HIGH.',
        answerCode: `// Luôn kiểm tra chân STBY/SLP/EEP đầu tiên nếu lắp xe xong mà bánh không quay!`,
      },
    ],
  },

  {
    id: 'ex7-3',
    chapterId: 'ch7',
    number: 'Bài 7.3',
    title: 'Đọc địa chỉ MAC Wi-Fi & Chế độ Ngủ sâu (Deep Sleep) siêu tiết kiệm pin',
    level: 'Chương 7 • IoT & Năng lượng thấp',
    duration: '25 phút',
    summary: 'Lấy mã định danh MAC để giao tiếp không dây ESP-NOW giữa 2 mạch ESP32 và đưa chip vào giấc ngủ sâu chỉ tốn ~20µA.',
    componentsUsed: ['push-button', 'hc-sr501'],
    simulatorType: 'deep-sleep-wifi',
    learningGoals: [
      'Đọc địa chỉ MAC phần cứng (`WiFi.macAddress()`) chuẩn bị cho giao thức **ESP-NOW**.',
      'Hiểu miền nguồn RTC (`RTC_GPIO`) và từ khóa `RTC_DATA_ATTR` giữ biến qua giấc ngủ sâu.',
    ],
    wiringSteps: [
      { from: 'Nút nhấn / PIR OUT', to: 'ESP32 GPIO33 (RTC_GPIO8)', detail: '⚠️ CHỈ chân RTC_GPIO mới đánh thức được Deep Sleep!' },
      { from: 'Đầu còn lại nút nhấn', to: 'ESP32 3V3 (qua trở kéo xuống 10kΩ về GND)', detail: 'Kích mức HIGH đánh thức chip' },
    ],
    deepExplanations: [
      {
        title: 'Tại sao lúc thức dậy từ Deep Sleep biến đếm thông thường lại bị reset về 0?',
        content:
          'Khi vào `esp_deep_sleep_start()`, toàn bộ 520KB SRAM chính bị cắt điện hoàn toàn để tiết kiệm pin! Khi thức dậy, chip khởi động lại từ `setup()`. Muốn giữ dữ liệu qua giấc ngủ, hãy đặt từ khóa `RTC_DATA_ATTR` trước biến để cất vào 8KB bộ nhớ RTC SRAM luôn được cấp điện.',
      },
    ],
    code: `#include <Arduino.h>
#include <WiFi.h>

RTC_DATA_ATTR int bootCount = 0;

void setup() {
  Serial.begin(115200);
  delay(300);

  bootCount++;
  Serial.printf("\\n=== Thức dậy lần #%d ===\\n", bootCount);

  WiFi.mode(WIFI_STA);
  Serial.print("Địa chỉ MAC của ESP32: ");
  Serial.println(WiFi.macAddress());

  esp_sleep_enable_timer_wakeup(10ULL * 1000000ULL); // Ngủ 10 giây
  esp_sleep_enable_ext0_wakeup(GPIO_NUM_33, 1);      // Hoặc đánh thức bằng GPIO33 = HIGH

  Serial.println("Đi ngủ Deep Sleep...");
  Serial.flush();
  esp_deep_sleep_start();
}

void loop() {}`,
    codeBreakdown: [
      { line: 'RTC_DATA_ATTR int bootCount = 0;', explain: 'Giữ nguyên giá trị đếm số lần thức dậy ngay cả khi chip ngủ sâu.' },
      { line: 'WiFi.macAddress()', explain: 'Lấy 6 byte định danh để truyền dữ liệu không dây P2P qua ESP-NOW.' },
    ],
    practiceDrills: [
      {
        level: 'Cấp 1 • Đổi thời gian ngủ hẹn giờ',
        task: 'Sửa code để ESP32 ngủ 5 phút (`300 giây`) mới tự thức dậy đo nhiệt độ 1 lần rồi ngủ tiếp.',
        hint: 'Đổi `10ULL` thành `300ULL` (chú ý chữ `ULL` kiểu 64-bit tránh tràn số `int` 32-bit!).',
        answerCode: `esp_sleep_enable_timer_wakeup(300ULL * 1000000ULL);`,
      },
      {
        level: 'Cấp 2 • Đánh thức bằng Nút nhấn kéo xuống GND (Active LOW)',
        task: 'Nếu nút nhấn nối giữa `GPIO33` và `GND` (có trở kéo lên 10kΩ lên 3V3), sửa tham số thứ 2 của `esp_sleep_enable_ext0_wakeup` như thế nào?',
        hint: 'Đổi mức kích thức dậy từ `1` (HIGH) sang `0` (LOW).',
        answerCode: `esp_sleep_enable_ext0_wakeup(GPIO_NUM_33, 0); // Đánh thức khi kéo xuống LOW!`,
      },
      {
        level: 'Cấp 3 • Kiểm tra nguyên nhân thức dậy',
        task: 'Làm sao phân biệt được ESP32 vừa thức dậy là do **hết giờ Timer** hay do **có người bấm nút GPIO33**?',
        hint: 'Gọi hàm `esp_sleep_get_wakeup_cause()` ngay trong `setup()`.',
        answerCode: `if (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_EXT0) Serial.println("Có người bấm nút đánh thức!");`,
      },
    ],
  },
];
