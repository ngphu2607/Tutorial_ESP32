/**
 * Cơ sở dữ liệu Datasheet Trực quan & Mô hình 3D cho 10 linh kiện cơ bản khi học ESP32.
 * Mọi thông số, công thức, cảnh báo 3.3V/5V và sơ đồ chân được viết chi tiết cho người mới.
 */

const COMPONENT_CATEGORIES = {
  all: { id: 'all', label: 'Tất cả linh kiện' },
  basic: { id: 'basic', label: 'Cơ bản (LED / Nút / Biến trở)' },
  sensor: { id: 'sensor', label: 'Cảm biến' },
  actuator: { id: 'actuator', label: 'Động cơ & Đóng ngắt' },
  display: { id: 'display', label: 'Màn hình I2C' },
};

const ESP32_COMPONENTS = [
  // =========================================================================
  // 1. ĐÈN LED & ĐIỆN TRỞ HẠN DÒNG
  // =========================================================================
  {
    id: 'led-resistor',
    name: 'Đèn LED & Điện trở hạn dòng',
    shortName: 'LED & Điện trở',
    category: 'basic',
    badge: 'Bắt buộc học đầu tiên',
    model3DType: 'led-resistor',
    summary: 'Linh kiện phát sáng bán dẫn phân cực (+ / -) và điện trở bảo vệ chân GPIO khỏi cháy.',
    specs: [
      { key: 'Điện áp thuận (Vf)', value: 'Đỏ/Vàng: ~1.8–2.1V • Xanh lá/Xanh dương/Trắng: ~2.8–3.2V' },
      { key: 'Dòng làm việc chuẩn', value: '5mA – 15mA (Mỗi chân GPIO ESP32 khuyên dùng ≤ 12mA, tối đa 40mA)' },
      { key: 'Điện trở khuyên dùng', value: '220Ω hoặc 330Ω (An toàn cho mọi màu LED ở mức nguồn 3.3V)' },
      { key: 'Phân cực', value: 'CÓ phân cực! Chân dài = Anode (+) • Chân ngắn / vát phẳng = Cathode (-)' },
      { key: 'Công thức tính R', value: 'R = (3.3V - Vf) / I_LED (VD: LED đỏ (3.3 - 2.0) / 0.006A ≈ 220Ω)' },
    ],
    pins: [
      {
        id: 'anode',
        name: 'Anode (+) — Chân dài',
        shortLabel: 'A (+)',
        role: 'Cực Dương (Đầu vào mức HIGH 3.3V)',
        color: '#ef4444',
        pos3D: [-0.28, -1.25, 0],
        connectTo: 'Chân GPIO Output (VD: GPIO2, GPIO4, GPIO16) qua điện trở 220Ω–330Ω',
        desc: 'Cực dương của điốt phát quang. Khi điện áp ở chân Anode cao hơn Cathode khoảng 1.8V–3.0V (tùy màu), dòng điện chạy qua làm LED phát sáng. Luôn nối nối tiếp điện trở hạn dòng vào một trong hai chân để giới hạn dòng điện.',
        warning: 'Nếu nối trực tiếp LED từ GPIO 3.3V xuống GND mà KHÔNG có điện trở hạn dòng, dòng điện tăng vọt có thể làm cháy LED hoặc hỏng bộ đệm Output bên trong chân GPIO ESP32!',
      },
      {
        id: 'cathode',
        name: 'Cathode (-) — Chân ngắn / Cạnh vát',
        shortLabel: 'K (−)',
        role: 'Cực Âm (Nối Mass GND)',
        color: '#64748b',
        pos3D: [0.28, -1.05, 0],
        connectTo: 'Chân GND của ESP32',
        desc: 'Cực âm của LED. Mẹo nhận biết dù đã cắt bằng 2 chân: sờ quanh viền nhựa ở đáy bóng LED sẽ thấy một cạnh bị vát phẳng (chính là cực âm Cathode), hoặc soi vào trong bóng thấy bản kim loại to bản hơn là Cathode (-).',
        warning: 'Nếu cắm ngược cực (+ và -), LED đơn giản sẽ không sáng (không cháy ngay ở 3.3V vì điện áp đánh thủng ngược của LED thường ~5V).',
      },
      {
        id: 'resistor',
        name: 'Điện trở hạn dòng (220Ω – 330Ω)',
        shortLabel: 'R 220Ω',
        role: 'Giới hạn cường độ dòng điện (Không phân cực)',
        color: '#eab308',
        pos3D: [1.35, -0.35, 0],
        connectTo: 'Mắc nối tiếp giữa chân GPIO và chân Anode (+) của LED',
        desc: 'Điện trở KHÔNG phân cực (xoay chiều nào cũng được). Vạch màu của trở 220Ω (4 vạch): Đỏ - Đỏ - Nâu - Vàng kim; của trở 330Ω: Cam - Cam - Nâu - Vàng kim. Dùng để tiêu bớt áp dư và giữ dòng điện ở mức ~6–10mA an toàn cho ESP32.',
        warning: 'Không dùng điện trở quá nhỏ (<100Ω) hoặc quên lắp điện trở. Nếu dùng trở quá lớn (>4.7kΩ) thì LED sẽ sáng rất mờ.',
      },
    ],
    howItWorks: [
      'LED là viết tắt của Light Emitting Diode (Điốt phát quang). Bản chất nó chỉ cho dòng điện đi theo 1 chiều từ Anode (+) sang Cathode (-).',
      'Khác với bóng đèn sợi đốt, LED có nội trở gần như bằng 0 khi đã vượt qua ngưỡng điện áp thuận Vf. Vì vậy bắt buộc phải mắc nối tiếp thêm 1 điện trở để hãm dòng điện theo định luật Ôm: I = (Vcc - Vf) / R.',
      'Có 2 kiểu mắc phổ biến: (1) Active HIGH: GPIO → Trở → LED(+) → LED(-) → GND (xuất HIGH là sáng); (2) Active LOW: 3V3 → Trở → LED(+) → LED(-) → GPIO (xuất LOW là sáng — kiểu này hay dùng cho LED tích hợp trên ESP32-C3/ESP8266).',
    ],
    warnings: [
      'KHÔNG bao giờ dùng LED làm công cụ thử chân nguồn 5V nếu đi kèm trở 220Ω thiết kế cho 3.3V lâu dài (nên dùng 330Ω–470Ω nếu test 5V).',
      'Tổng dòng của tất cả các chân GPIO xuất ra đồng thời trên ESP32 không nên vượt quá ~200mA.',
    ],
    wiringTable: [
      { compPin: 'Anode (+) (qua trở 220Ω)', espPin: 'GPIO16 (hoặc GPIO bất kỳ an toàn)', note: 'Tín hiệu điều khiển HIGH = Sáng' },
      { compPin: 'Cathode (-)', espPin: 'GND', note: 'Nối đất chung' },
    ],
    codeSnippet: `#define LED_PIN 16

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH); // Bật LED (3.3V)
  delay(500);
  digitalWrite(LED_PIN, LOW);  // Tắt LED (0V)
  delay(500);
}`,
  },

  // =========================================================================
  // 2. NÚT NHẤN 4 CHÂN (TACTILE PUSH BUTTON)
  // =========================================================================
  {
    id: 'push-button',
    name: 'Nút nhấn 4 chân (Tactile Switch)',
    shortName: 'Nút nhấn 4P',
    category: 'basic',
    badge: 'Input cơ bản',
    model3DType: 'push-button',
    summary: 'Công tắc nhấn nhả thường hở (NO) — hiểu đúng 2 cặp chân thông nhau và hiện tượng dội phím.',
    specs: [
      { key: 'Loại tiếp điểm', value: 'SPST-NO (1 cực, thường hở — nhấn xuống mới nối thông)' },
      { key: 'Số chân', value: '4 chân (Thực chất chỉ có 2 cực: 2 chân trái nối sẵn, 2 chân phải nối sẵn)' },
      { key: 'Cách đấu khuyên dùng', value: 'INPUT_PULLUP nội bộ của ESP32 (Nhấn = LOW, Thả = HIGH)' },
      { key: 'Thời gian dội phím', value: '5ms – 30ms (Cần lọc nhiễu Debounce bằng code hoặc tụ 100nF)' },
      { key: 'Lưu ý chân Input-Only', value: 'GPIO34, 35, 36, 39 KHÔNG có INPUT_PULLUP nội bộ!' },
    ],
    pins: [
      {
        id: 'pin-a1',
        name: 'Cặp chân A1 & A2 (Cùng 1 phía)',
        shortLabel: 'A1 / A2',
        role: 'Đầu nối tín hiệu GPIO (Luôn thông mạch nội bộ với nhau)',
        color: '#3b82f6',
        pos3D: [-0.75, -0.7, -0.55],
        connectTo: 'Chân GPIO Input (VD: GPIO4, GPIO18) — bật INPUT_PULLUP',
        desc: 'Hai chân đối diện nhau dọc theo cạnh nhựa phẳng luôn được nối liền bên trong bằng một thanh đồng. Bạn chỉ cần nối dây vào 1 trong 2 chân (hoặc cắm bắc qua rãnh giữa breadboard).',
        warning: 'Đừng bao giờ cắm 2 chân ĐÃ THÔNG NHAU vào 3.3V và GND — sẽ gây chập nguồn ngay lập tức dù chưa bấm nút!',
      },
      {
        id: 'pin-b1',
        name: 'Cặp chân B1 & B2 (Phía đối diện)',
        shortLabel: 'B1 / B2',
        role: 'Đầu nối Mass GND (Thông với cặp A khi nhấn nút)',
        color: '#64748b',
        pos3D: [0.75, -0.7, 0.55],
        connectTo: 'Chân GND của ESP32',
        desc: 'Khi bạn ấn nút xuống, lá đồng đàn hồi bên trong ép xuống nối thông Cặp A sang Cặp B. Mẹo an toàn tuyệt đối: LUÔN cắm dây vào 2 chân ĐỐI XỨNG CHÉO (góc trên-trái và góc dưới-phải) — chắc chắn 100% đúng cặp không bao giờ nhầm chiều!',
        warning: 'Nếu gắn nút nhấn vào chân GPIO34, 35, 36, 39 thì BẮT BUỘC phải gắn thêm điện trở kéo lên 10kΩ bên ngoài vì 4 chân đó không có pull-up nội bộ.',
      },
    ],
    howItWorks: [
      'Một chân GPIO đặt ở chế độ INPUT thông thường giống như "sợi ăng-ten" có trở kháng cực lớn. Nếu không nối với nguồn 3.3V hoặc GND thông qua điện trở, trạng thái chân sẽ nhảy loạn xạ (Floating Pin) chỉ vì nhiễu tĩnh điện từ tay bạn!',
      'Giải pháp chuẩn nhất trên ESP32 là dùng `pinMode(PIN, INPUT_PULLUP)`: chip tự bật một điện trở ~45kΩ kéo chân lên mức HIGH (3.3V) khi thả tay. Khi bấm nút nối chân đó xuống GND, điện áp tụt xuống 0V (LOW).',
      'Khi lá đồng tiếp xúc, nó nảy lên xuống vài lần trong khoảng 5–20ms tạo ra hàng loạt xung 0-1-0-1 giả gọi là "Dội phím" (Switch Bounce). Cần dùng `millis()` kiểm tra trễ 50ms để đọc chính xác 1 lần bấm.',
    ],
    warnings: [
      'LỖI NGƯỜI MỚI HAY GẶP: Dùng `INPUT_PULLUP` trên GPIO34/35/36/39 rồi thắc mắc tại sao chân luôn đọc 0 hoặc nhảy loạn → Vì 4 chân Input-Only không có pull-up nội bộ!',
      'Không nối nút nhấn kéo GPIO0 hoặc GPIO2 xuống GND cố định lúc khởi động vì làm sai chế độ boot.',
    ],
    wiringTable: [
      { compPin: 'Chân A (góc trên trái)', espPin: 'GPIO18 (INPUT_PULLUP)', note: 'Thả = HIGH (1), Nhấn = LOW (0)' },
      { compPin: 'Chân B (góc dưới phải - chéo)', espPin: 'GND', note: 'Nối đất chung' },
    ],
    codeSnippet: `#define BTN_PIN 18
bool lastState = HIGH;
unsigned long lastDebounce = 0;

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP); // Nhấn = LOW, Thả = HIGH
}

void loop() {
  bool reading = digitalRead(BTN_PIN);
  if (reading != lastState && (millis() - lastDebounce > 50)) {
    lastDebounce = millis();
    lastState = reading;
    if (reading == LOW) {
      Serial.println("Đã nhấn nút!");
    }
  }
}`,
  },

  // =========================================================================
  // 3. BIẾN TRỞ & MODULE JOYSTICK 2 TRỤC (KY-023)
  // =========================================================================
  {
    id: 'pot-joystick',
    name: 'Biến trở & Module Joystick (KY-023)',
    shortName: 'Biến trở / Joystick',
    category: 'basic',
    badge: 'Analog ADC1',
    model3DType: 'joystick',
    summary: 'Bộ chia áp biến thiên đọc tọa độ X/Y qua bộ ADC 12-bit (0–4095) và nút nhấn SW.',
    specs: [
      { key: 'Điện áp cấp', value: '3.3V (BẮT BUỘC dùng 3.3V khi đọc bằng ESP32!)' },
      { key: 'Giá trị trả về', value: 'ADC 12-bit: 0 → 4095 (Vị trí giữa lý tưởng ~ 1850–2100)' },
      { key: 'Chân ESP32 khuyên dùng', value: 'NHÓM ADC1 (GPIO 32, 33, 34, 35, 36, 39 hoặc S3: GPIO 1–10)' },
      { key: 'Thành phần bên trong', value: '2 biến trở 10kΩ vuông góc nhau (Trục X, Y) + 1 nút nhấn SW' },
      { key: 'Vùng chết (Deadzone)', value: '±150 đến ±250 đơn vị quanh tâm để chống trôi xe/servo' },
    ],
    pins: [
      {
        id: 'gnd',
        name: 'GND (Mass)',
        shortLabel: 'GND',
        role: 'Cực âm nguồn 0V',
        color: '#64748b',
        pos3D: [-1.05, -0.35, 0.95],
        connectTo: 'GND trên ESP32',
        desc: 'Đầu 0V của cả 2 biến trở trục X, trục Y và một đầu của nút nhấn SW.',
        warning: 'Phải nối chung GND nếu không giá trị ADC sẽ nhảy loạn 0–4095.',
      },
      {
        id: 'vcc',
        name: '+5V / VCC (Cấp 3.3V cho ESP32!)',
        shortLabel: '3.3V',
        role: 'Nguồn dương tham chiếu chia áp',
        color: '#ef4444',
        pos3D: [-0.52, -0.35, 0.95],
        connectTo: 'Chân 3V3 trên ESP32 (KHÔNG cắm 5V!)',
        desc: 'Dù trên mạch KY-023 in chữ "+5V", thực chất bên trong chỉ là 2 điện trở thụ động 10kΩ nên hoạt động hoàn hảo ở 3.3V! Cấp 3.3V giúp điện áp ra VRx/VRy nằm gọn từ 0V đến 3.3V đúng dải đo an toàn của ESP32.',
        warning: 'Nếu bạn cắm chân này vào 5V rồi gạt hết cần Joystick, điện áp 5V đi thẳng vào chân ADC của ESP32 sẽ gây bão hòa (luôn đọc 4095 từ nửa hành trình) và có thể làm hỏng chân ADC!',
      },
      {
        id: 'vrx',
        name: 'VRx (Analog Trục X)',
        shortLabel: 'VRx',
        role: 'Điện áp biến thiên trục Ngang (0 – 3.3V)',
        color: '#06b6d4',
        pos3D: [0.0, -0.35, 0.95],
        connectTo: 'Chân ADC1 (VD: GPIO34 trên ESP32 / GPIO1 trên S3)',
        desc: 'Xuất điện áp tỷ lệ theo góc gạt trái/phải. Ở giữa đứng yên sẽ cho ~1.65V (giá trị ADC ~1900–2050). Đẩy hết một bên cho ~0V (0), bên kia ~3.3V (4095).',
        warning: 'TUYỆT ĐỐI cắm vào nhóm ADC1 nếu dự án có dùng Wi-Fi hoặc ESP-NOW (nhóm ADC2 sẽ bị vô hiệu hóa khi bật Wi-Fi!).',
      },
      {
        id: 'vry',
        name: 'VRy (Analog Trục Y)',
        shortLabel: 'VRy',
        role: 'Điện áp biến thiên trục Dọc (0 – 3.3V)',
        color: '#0891b2',
        pos3D: [0.52, -0.35, 0.95],
        connectTo: 'Chân ADC1 (VD: GPIO35 trên ESP32 / GPIO2 trên S3)',
        desc: 'Xuất điện áp tỷ lệ theo góc gạt lên/xuống (Tiến/Lùi). Đọc bằng hàm `analogRead()`.',
        warning: 'Trên một số Joystick giá rẻ, biến trở bị rơ cơ khí làm điểm giữa lệch (VD: 1880 thay vì 2048). Luôn dùng vùng chết (Deadzone) trong code.',
      },
      {
        id: 'sw',
        name: 'SW (Switch — Nhấn xuống giữa cần)',
        shortLabel: 'SW',
        role: 'Tín hiệu Digital nút nhấn giữa cần',
        color: '#22c55e',
        pos3D: [1.05, -0.35, 0.95],
        connectTo: 'Chân GPIO có INPUT_PULLUP nội (VD: GPIO32 hoặc GPIO4)',
        desc: 'Khi bạn ấn thẳng cần gạt xuống nghe tiếng "tách", chân SW sẽ được nối xuống GND (mức LOW).',
        warning: 'Nhiều module KY-023 KHÔNG gắn sẵn điện trở kéo lên cho chân SW! Và nếu bạn cắm SW vào GPIO34/35/36/39 (không có pull-up nội) thì nút bấm sẽ không hoạt động — hãy cắm SW vào GPIO32, 33, 4, 18... và dùng `INPUT_PULLUP`.',
      },
    ],
    howItWorks: [
      'Mỗi trục của Joystick (hoặc biến trở xoay 3 chân) hoạt động như một cầu phân áp cơ học: con trượt chia thanh điện trở 10kΩ thành 2 phần R1 và R2, xuất ra điện áp V_out = 3.3V × R2 / (R1 + R2).',
      'ESP32 đọc điện áp đó qua bộ chuyển đổi ADC 12-bit (2¹² = 4096 mức, từ 0 đến 4095).',
      'Trong các dự án tay cầm điều khiển xe (như ESP-NOW), cần đo giá trị tĩnh khi thả tay (`centerVal`) và tạo khoảng đệm `deadzone` (ví dụ ±200) để xe đứng im tuyệt đối khi không chạm cần.',
    ],
    warnings: [
      'BẮT BUỘC cấp 3.3V vào chân "+5V" của Joystick khi dùng với ESP32 để bảo vệ chân ADC và đo hết hành trình cần gạt!',
      'CHỈ dùng ADC1 (GPIO32–39 trên ESP32 thường; GPIO1–10 trên ESP32-S3) khi bật Wi-Fi / ESP-NOW!',
    ],
    wiringTable: [
      { compPin: 'GND', espPin: 'GND', note: 'Nối mass chung' },
      { compPin: '+5V (VCC)', espPin: '3V3', note: 'Cấp 3.3V để dải ADC chuẩn 0–3.3V' },
      { compPin: 'VRx', espPin: 'GPIO34 (ADC1_6)', note: 'Không xung đột Wi-Fi' },
      { compPin: 'VRy', espPin: 'GPIO35 (ADC1_7)', note: 'Không xung đột Wi-Fi' },
      { compPin: 'SW', espPin: 'GPIO32 (INPUT_PULLUP)', note: 'Tránh cắm vào GPIO34–39' },
    ],
    codeSnippet: `#define PIN_VRX 34
#define PIN_VRY 35
#define PIN_SW  32

void setup() {
  Serial.begin(115200);
  pinMode(PIN_SW, INPUT_PULLUP);
  analogReadResolution(12); // 0 -> 4095
}

void loop() {
  int x = analogRead(PIN_VRX);
  int y = analogRead(PIN_VRY);
  bool pressed = (digitalRead(PIN_SW) == LOW);
  Serial.printf("X: %d | Y: %d | SW: %s\\n", x, y, pressed ? "NHAN" : "THA");
  delay(100);
}`,
  },

  // =========================================================================
  // 4. CẢM BIẾN SIÊU ÂM HC-SR04
  // =========================================================================
  {
    id: 'hc-sr04',
    name: 'Cảm biến siêu âm đo khoảng cách (HC-SR04)',
    shortName: 'Siêu âm HC-SR04',
    category: 'sensor',
    badge: '⚠️ Cần hạ áp Echo 5V→3.3V',
    model3DType: 'hc-sr04',
    summary: 'Đo khoảng cách 2cm – 400cm bằng sóng siêu âm 40kHz (Lưu ý mạch thường chạy 5V).',
    specs: [
      { key: 'Điện áp nguồn', value: '5V DC (Bản HC-SR04 tiêu chuẩn cần 5V; bản RCWL/HC-SR04P hỗ trợ 3.3V)' },
      { key: 'Tầm đo hiệu quả', value: '2 cm – 400 cm (Chính xác nhất ở 5 cm – 250 cm, góc quét ~15°)' },
      { key: 'Tần số sóng âm', value: '40 kHz (Siêu âm ngoài ngưỡng nghe của tai người)' },
      { key: 'Tín hiệu Trig', value: 'Input — Xung HIGH ít nhất 10 µs (Mức 3.3V của ESP32 kích tốt)' },
      { key: 'Tín hiệu Echo', value: '⚠️ Output 5V! Nên qua cầu phân áp 1kΩ + 2kΩ để hạ xuống ~3.3V' },
    ],
    pins: [
      {
        id: 'vcc',
        name: 'VCC (Nguồn 5V)',
        shortLabel: 'VCC 5V',
        role: 'Cấp nguồn 5V cho mạch phát siêu âm',
        color: '#ef4444',
        pos3D: [-0.45, -1.05, 0],
        connectTo: 'Chân VIN / 5V của ESP32 (hoặc nguồn 5V ngoài)',
        desc: 'Mạch HC-SR04 xanh dương phổ biến cần đúng nguồn 5V để mạch khuếch đại tạo sóng siêu âm 40kHz đủ khỏe. Nếu cấp 3.3V cho bản thường, cảm biến sẽ không đo được hoặc luôn trả về 0.',
        warning: 'Nếu mua đúng phiên bản "HC-SR04P" hoặc "HC-SR04+" (ghi 3V–5.5V trên lưng mạch) thì mới cấp trực tiếp 3.3V được.',
      },
      {
        id: 'trig',
        name: 'Trig (Trigger — Chân kích phát sóng)',
        shortLabel: 'TRIG',
        role: 'Input nhận xung 10µs từ ESP32',
        color: '#22c55e',
        pos3D: [-0.15, -1.05, 0],
        connectTo: 'Chân GPIO Output (VD: GPIO5 hoặc GPIO13)',
        desc: 'ESP32 xuất một xung HIGH kéo dài 10 micro-giây (µs) vào chân Trig để ra lệnh cho mắt phát (T) bắn ra một chùm 8 xung sóng siêu âm 40kHz.',
        warning: 'Chân Trig nhận tín hiệu 3.3V từ ESP32 hoàn toàn bình thường (ngưỡng nhận mức HIGH của mạch TTL 5V là >2.0V), nên KHÔNG cần mạch chuyển mức cho chân Trig.',
      },
      {
        id: 'echo',
        name: 'Echo (Chân phản hồi thời gian bay)',
        shortLabel: 'ECHO (5V!)',
        role: 'Output xuất xung HIGH bằng thời gian sóng đi + về',
        color: '#f97316',
        pos3D: [0.15, -1.05, 0],
        connectTo: 'Chân GPIO Input QUA CẦU PHÂN ÁP 1kΩ + 2kΩ (VD: GPIO18)',
        desc: 'Ngay khi phát sóng, chân Echo tự nhảy lên mức HIGH và giữ ở mức HIGH cho đến khi mắt thu (R) bắt được sóng phản xạ quay về. Độ rộng xung HIGH (đo bằng hàm `pulseIn`) chính là thời gian sóng đi và về.',
        warning: 'CẢNH BÁO MỨC ÁP 5V: HC-SR04 bản thường xuất mức HIGH = 5V trên chân Echo! Đấu thẳng vào ESP32 (chịu 3.3V) có thể làm giảm tuổi thọ hoặc cháy chân GPIO. Cách sửa đơn giản nhất: nối Echo → [1kΩ] → (Vào GPIO ESP32) → [2kΩ] → GND để chia áp còn 3.33V!',
      },
      {
        id: 'gnd',
        name: 'GND (Mass)',
        shortLabel: 'GND',
        role: 'Cực âm 0V',
        color: '#64748b',
        pos3D: [0.45, -1.05, 0],
        connectTo: 'GND của ESP32',
        desc: 'Chân Mass chung. Nếu cấp 5V từ nguồn ngoài cho HC-SR04, bắt buộc nối chung GND với ESP32.',
        warning: 'Không dùng các chân Input-Only nếu cắm nhầm vào Trig (vì Trig phải là Output). Echo có thể đọc trên mọi chân Input.',
      },
    ],
    howItWorks: [
      'Tốc độ âm thanh trong không khí (ở ~20°C) là xấp xỉ 343 m/s = 0.0343 cm/µs.',
      'Vì sóng siêu âm phải đi từ cảm biến tới vật cản rồi dội ngược trở lại, quãng đường sóng đi bằng 2 lần khoảng cách thực tế.',
      'Công thức vàng: Khoảng cách (cm) = (Thời gian_µs × 0.0343) / 2. Ví dụ `pulseIn()` đo được 1000 µs → Khoảng cách = (1000 × 0.0343) / 2 ≈ 17.15 cm.',
      'Giữa 2 lần đo liên tiếp nên nghỉ ít nhất 50–60ms để sóng dội của lần đo trước tắt hẳn (tránh nhiễu vọng âm).',
    ],
    warnings: [
      'ĐỪNG quên cầu phân áp (1kΩ nối tiếp + 2kΩ kéo xuống GND) ở chân Echo nếu bạn dùng bản HC-SR04 chạy 5V!',
      'Hàm `pulseIn(ECHO, HIGH, 30000)` nên có tham số timeout (30000 µs ≈ 5 mét) — nếu không có timeout, khi không gặp vật cản hàm sẽ chờ mặc định tới 1 giây làm giật/đơ toàn bộ robot!',
    ],
    wiringTable: [
      { compPin: 'VCC', espPin: 'VIN / 5V', note: 'Cấp nguồn 5V cho HC-SR04 bản thường' },
      { compPin: 'Trig', espPin: 'GPIO5 (Output)', note: 'Nối trực tiếp được (3.3V kích tốt)' },
      { compPin: 'Echo', espPin: 'GPIO18 (qua cầu chia áp 1kΩ/2kΩ)', note: 'Hạ áp 5V xuống 3.33V an toàn cho ESP32' },
      { compPin: 'GND', espPin: 'GND', note: 'Nối đất chung' },
    ],
    codeSnippet: `#define TRIG_PIN 5
#define ECHO_PIN 18

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Timeout 30000 us (~5m) tránh làm đơ mạch khi không có vật cản
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float distance = (duration == 0) ? -1 : (duration * 0.0343f) / 2.0f;

  Serial.printf("Khoảng cách: %.1f cm\\n", distance);
  delay(60); // Chờ tắt sóng vọng
}`,
  },

  // =========================================================================
  // 5. CẢM BIẾN CHUYỂN ĐỘNG HỒNG NGOẠI PIR (HC-SR501)
  // =========================================================================
  {
    id: 'hc-sr501',
    name: 'Cảm biến chuyển động PIR (HC-SR501)',
    shortName: 'PIR HC-SR501',
    category: 'sensor',
    badge: 'Phát hiện người',
    model3DType: 'hc-sr501',
    summary: 'Phát hiện thân nhiệt chuyển động (người/động vật) — xuất tín hiệu 3.3V rất hợp với ESP32.',
    specs: [
      { key: 'Điện áp cấp (VCC)', value: '4.5V – 20V DC (Cắm vào chân VIN/5V của ESP32)' },
      { key: 'Mức điện áp OUT', value: '3.3V khi phát hiện chuyển động • 0V khi không có (An toàn tuyệt đối cho ESP32!)' },
      { key: 'Góc quét & Tầm xa', value: 'Hình nón ~110°, khoảng cách điều chỉnh từ 3m đến 7m' },
      { key: '2 Biến trở cam', value: 'Trái: Độ nhạy/Khoảng cách (Sx) • Phải: Thời gian giữ HIGH (Tx: 3s – 300s)' },
      { key: 'Thời gian ổn định', value: 'Cần 30–60 giây đầu sau khi cấp điện để cảm biến tự cân bằng nhiệt độ phòng' },
    ],
    pins: [
      {
        id: 'vcc',
        name: 'VCC (Nguồn vào 5V)',
        shortLabel: 'VCC 5V',
        role: 'Cấp nguồn 5V qua IC ổn áp 3.3V tích hợp sẵn trên PIR',
        color: '#ef4444',
        pos3D: [-0.35, -0.9, 0.35],
        connectTo: 'Chân VIN / 5V của ESP32',
        desc: 'Trên lưng HC-SR501 có sẵn một IC ổn áp 7133 hạ áp từ 5V xuống 3.3V để nuôi chip xử lý BISS0001. Do đó bạn cấp 5V vào VCC nhưng chân OUT vẫn xuất ra đúng 3.3V!',
        warning: 'Nếu cấp 3.3V vào chân VCC sẽ không đủ áp qua ổn áp 7133 khiến cảm biến báo giả liên tục.',
      },
      {
        id: 'out',
        name: 'OUT (Tín hiệu đầu ra Digital 3.3V)',
        shortLabel: 'OUT 3.3V',
        role: 'Xuất HIGH (3.3V) khi có người di chuyển',
        color: '#10b981',
        pos3D: [0, -0.9, 0.35],
        connectTo: 'Chân GPIO Input bất kỳ (VD: GPIO13, GPIO27, GPIO34)',
        desc: 'Khi có sự thay đổi tia hồng ngoại thân nhiệt đi ngang qua thấu kính cầu Fresnel, chân OUT bật lên mức HIGH (3.3V) trong khoảng thời gian chỉnh bởi biến trở Tx (vặn hết ngược chiều kim đồng hồ để ngắn nhất ~3 giây).',
        warning: 'Rất an toàn với ESP32 vì mức HIGH là 3.3V! Có thể dùng để đánh thức ESP32 từ chế độ Deep Sleep (`esp_sleep_enable_ext0_wakeup`).',
      },
      {
        id: 'gnd',
        name: 'GND (Mass)',
        shortLabel: 'GND',
        role: 'Cực âm 0V',
        color: '#64748b',
        pos3D: [0.35, -0.9, 0.35],
        connectTo: 'GND của ESP32',
        desc: 'Nối Mass chung với ESP32.',
        warning: 'Tránh đặt cảm biến PIR sát bên cạnh ăng-ten Wi-Fi của ESP32 — sóng phát Wi-Fi công suất cao đôi khi gây nhiễu làm PIR kích báo giả!',
      },
    ],
    howItWorks: [
      'Cảm biến PIR (Passive Infrared) KHÔNG tự phát tia mà chỉ thu tia hồng ngoại nhiệt phát ra từ cơ thể người/động vật thông qua chao nhựa trắng (thấu kính Fresnel chia vùng sáng-tối).',
      'Khi người đứng yên hoàn toàn, lượng nhiệt không biến đổi nên cảm biến sẽ KHÔNG kích lại (chỉ phát hiện khi có sự chuyển động qua các vùng Fresnel).',
      'Jumper 3 chân màu vàng trên mạch chọn chế độ kích: **H (Repeatable / Mặc định)**: nếu người còn di chuyển, bộ đếm thời gian tự reset giữ OUT luôn ở mức HIGH; **L (Single Trigger)**: hết thời gian trễ OUT sẽ tắt về LOW một nhịp rồi mới đo tiếp.',
    ],
    warnings: [
      'Khi mới cấp nguồn, đừng vội thấy đèn báo bật sáng liên tục trong 30–60 giây đầu mà nghĩ cảm biến hỏng — đó là pha hiệu chuẩn nhiệt môi trường (Warm-up time)!',
      'Vặn biến trở Time Delay (Tx) hết cỡ ngược chiều kim đồng hồ (giảm về ~3s) khi test code để không phải đợi 5 phút mỗi lần kiểm tra!',
      'Đặt PIR cách ăng-ten ESP32 ít nhất 10–15cm hoặc bọc dây tín hiệu ngắn để tránh nhiễu sóng Wi-Fi gây báo động giả.',
    ],
    wiringTable: [
      { compPin: 'VCC', espPin: 'VIN / 5V', note: 'Cấp 5V (mạch có IC hạ 3.3V sẵn)' },
      { compPin: 'OUT', espPin: 'GPIO27 (hoặc GPIO34)', note: 'Tín hiệu chuẩn 3.3V, 1 = Có chuyển động' },
      { compPin: 'GND', espPin: 'GND', note: 'Nối đất chung' },
    ],
    codeSnippet: `#define PIR_PIN 27
#define LED_PIN 2

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("Đang chờ PIR ổn định...");
}

void loop() {
  if (digitalRead(PIR_PIN) == HIGH) {
    digitalWrite(LED_PIN, HIGH);
    Serial.println("⚠️ Phát hiện chuyển động!");
  } else {
    digitalWrite(LED_PIN, LOW);
  }
  delay(200);
}`,
  },

  // =========================================================================
  // 6. MẠCH CẦU H ĐIỀU KHIỂN 2 ĐỘNG CƠ DC (DRV8833)
  // =========================================================================
  {
    id: 'drv8833',
    name: 'Mạch cầu H điều khiển 2 động cơ (DRV8833)',
    shortName: 'Cầu H DRV8833',
    category: 'actuator',
    badge: 'Xe Robot 2WD/4WD',
    model3DType: 'drv8833',
    summary: 'Driver MOSFET hiệu suất cao điều khiển 2 động cơ DC đảo chiều + chỉnh tốc độ PWM (không nóng như L298N).',
    specs: [
      { key: 'Điện áp động cơ (VM)', value: '2.7V – 10.8V DC (Tuyệt vời cho pin Li-ion 1S 3.7V hoặc 2S 7.4V!)' },
      { key: 'Dòng tải mỗi kênh', value: '1.5A liên tục / 2A đỉnh mỗi động cơ (2 kênh A & B độc lập)' },
      { key: 'Mức logic điều khiển', value: '1.8V – 5V (Tương thích hoàn toàn với 3.3V của ESP32!)' },
      { key: 'Chân kích hoạt', value: 'STBY / EEP (SLP) — BẮT BUỘC kéo lên mức HIGH (3.3V) mạch mới chạy!' },
      { key: 'Ưu điểm vs L298N', value: 'Sụt áp cực thấp (chạy pin 2S rất khỏe), kích thước siêu nhỏ, có bảo vệ quá nhiệt/ngắn mạch' },
    ],
    pins: [
      {
        id: 'vm',
        name: 'VM (Nguồn dương cấp cho Động cơ)',
        shortLabel: 'VM',
        role: 'Nguồn pin cấp trực tiếp cho 2 động cơ (2.7V–10.8V)',
        color: '#ef4444',
        pos3D: [-0.95, 0.12, -0.88],
        connectTo: 'Cực dương (+) của Pin 2S (7.4V) hoặc nguồn ngoài',
        desc: 'Cấp nguồn nuôi động cơ DC. KHÔNG lấy nguồn từ chân 3V3 của ESP32 để nối vào VM!',
        warning: 'Tuyệt đối KHÔNG cấp quá 10.8V vào VM (ví dụ không dùng pin LiPo 3S 12.6V vì sẽ nổ IC DRV8833 ngay lập tức! Nếu dùng pin 3S phải hạ áp hoặc dùng L298N/TB6612).',
      },
      {
        id: 'ao12',
        name: 'AO1 / AO2 (Đầu ra Động cơ A)',
        shortLabel: 'AO1/AO2',
        role: 'Nối tới 2 cực của Động cơ trái (Motor A)',
        color: '#22c55e',
        pos3D: [-0.95, 0.12, 0.12],
        connectTo: '2 dây của Động cơ DC thứ nhất',
        desc: 'Nếu động cơ quay ngược chiều mong muốn, bạn chỉ việc tráo 2 dây nối vào AO1 và AO2 (hoặc đổi logic trong code).',
        warning: 'Nên hàn thêm tụ gốm 104 (100nF) song song 2 cực động cơ để lọc nhiễu tia lửa chổi than giúp ESP32 không bị reset bất ngờ.',
      },
      {
        id: 'bo12',
        name: 'BO1 / BO2 (Đầu ra Động cơ B)',
        shortLabel: 'BO1/BO2',
        role: 'Nối tới 2 cực của Động cơ phải (Motor B)',
        color: '#10b981',
        pos3D: [-0.95, 0.12, 0.52],
        connectTo: '2 dây của Động cơ DC thứ hai',
        desc: 'Kênh B độc lập hoàn toàn với kênh A.',
        warning: 'Không đấu chập AO với BO trừ khi dùng chế độ song song theo datasheet.',
      },
      {
        id: 'ain',
        name: 'AIN1 / AIN2 (Điều khiển Động cơ A)',
        shortLabel: 'AIN1/2',
        role: '2 chân PWM điều khiển chiều & tốc độ kênh A',
        color: '#06b6d4',
        pos3D: [0.95, 0.12, -0.45],
        connectTo: '2 chân GPIO PWM trên ESP32 (VD: GPIO18, GPIO19)',
        desc: 'Bảng chân lý điều khiển: AIN1=PWM, AIN2=0 → Quay thuận; AIN1=0, AIN2=PWM → Quay ngược; AIN1=0, AIN2=0 → Trôi tự do (Coast); AIN1=1, AIN2=1 → Phanh gấp (Brake)!',
        warning: 'ESP32 dùng 2 chân PWM cho mỗi động cơ (khác L298N dùng chân ENA riêng).',
      },
      {
        id: 'stby',
        name: 'STBY / SLP / EEP (Chân Ngủ — QUAN TRỌNG!)',
        shortLabel: 'STBY (HIGH)',
        role: 'Bật/Tắt mạch Driver (Mức HIGH = Hoạt động, LOW = Ngủ)',
        color: '#f97316',
        pos3D: [0.95, 0.12, -0.05],
        connectTo: 'Chân GPIO (xuất HIGH) hoặc nối thẳng lên 3V3 của ESP32',
        desc: 'Chân Standby (trên một số mạch đỏ ghi là EEP hoặc SLP). Nếu thả nổi không nối gì, IC sẽ ngủ im lìm không quay dù bạn xuất PWM mạnh đến đâu!',
        warning: 'LỖI KINH ĐIỂN: Rất nhiều bạn đấu xong hết nhưng quên nối STBY/SLP lên 3.3V nên động cơ đứng im! Luôn nhớ kéo chân này lên HIGH (hoặc nối vào 1 chân GPIO rồi `digitalWrite(SLP, HIGH)`).',
      },
      {
        id: 'bin',
        name: 'BIN1 / BIN2 (Điều khiển Động cơ B)',
        shortLabel: 'BIN1/2',
        role: '2 chân PWM điều khiển chiều & tốc độ kênh B',
        color: '#3b82f6',
        pos3D: [0.95, 0.12, 0.35],
        connectTo: '2 chân GPIO PWM trên ESP32 (VD: GPIO23, GPIO5)',
        desc: 'Tương tự AIN1/AIN2 nhưng điều khiển cặp đầu ra BO1/BO2.',
        warning: 'Tránh các chân Input-Only (34, 35, 36, 39) vì không xuất PWM được.',
      },
      {
        id: 'gnd',
        name: 'GND (Mass chung)',
        shortLabel: 'GND',
        role: 'Nối chung cực âm Pin và cực âm ESP32',
        color: '#64748b',
        pos3D: [0.95, 0.12, 0.88],
        connectTo: 'Cả cực âm Pin (-) LẪN chân GND của ESP32!',
        desc: 'Tất cả chân GND trên module DRV8833 đều thông nhau.',
        warning: 'QUY TẮC BẮT BUỘC: Nếu ESP32 cắm cáp USB hoặc chạy nguồn riêng còn DRV8833 chạy Pin, BẮT BUỘC phải nối 1 dây nối chung GND giữa mạch DRV8833 và ESP32!',
      },
    ],
    howItWorks: [
      'Bên trong DRV8833 là 2 mạch cầu H gồm 8 transistor MOSFET công suất đóng mở nhanh theo xung PWM từ ESP32.',
      'Bằng cách cấp xung PWM (độ rộng xung từ 0 đến 255) vào AIN1 trong khi giữ AIN2 = 0, dòng điện chạy qua động cơ theo 1 chiều với tốc độ tỷ lệ thuận theo duty cycle PWM.',
      'Đảo ngược lại (AIN1 = 0, AIN2 = PWM) sẽ làm dòng điện chạy chiều ngược lại → động cơ đảo chiều quay.',
    ],
    warnings: [
      'KHÔNG dùng nguồn quá 10.8V (không dùng pin 3S 12.6V cho DRV8833). Tối ưu nhất là dùng 2 cell pin Li-ion 18650 (7.4V – 8.4V).',
      'Nhớ kéo chân `STBY / SLP` lên HIGH (3.3V) thì mạch mới thức dậy chạy!',
    ],
    wiringTable: [
      { compPin: 'VM / GND', espPin: 'Pin 7.4V (+ / -) & chung GND ESP32', note: 'Tối đa 10.8V' },
      { compPin: 'STBY (SLP)', espPin: 'GPIO25 (hoặc chân 3V3)', note: 'BẮT BUỘC ở mức HIGH' },
      { compPin: 'AIN1 / AIN2', espPin: 'GPIO18 / GPIO19', note: 'Điều khiển Motor A' },
      { compPin: 'BIN1 / BIN2', espPin: 'GPIO23 / GPIO26', note: 'Điều khiển Motor B' },
    ],
    codeSnippet: `#define AIN1 18
#define AIN2 19
#define SLP  25

void setMotorA(int speed) { // speed: -255 đến 255
  speed = constrain(speed, -255, 255);
  if (speed > 0) {
    analogWrite(AIN1, speed); analogWrite(AIN2, 0);
  } else if (speed < 0) {
    analogWrite(AIN1, 0); analogWrite(AIN2, -speed);
  } else {
    analogWrite(AIN1, 0); analogWrite(AIN2, 0);
  }
}

void setup() {
  pinMode(SLP, OUTPUT);
  digitalWrite(SLP, HIGH); // Đánh thức DRV8833!
}
void loop() {
  setMotorA(180); delay(1500);  // Tiến
  setMotorA(-180); delay(1500); // Lùi
  setMotorA(0); delay(1000);    // Dừng
}`,
  },

  // =========================================================================
  // 7. ĐỘNG CƠ SERVO SG90 / MG90S
  // =========================================================================
  {
    id: 'servo-sg90',
    name: 'Động cơ Servo góc quay (SG90 / MG90S)',
    shortName: 'Servo SG90',
    category: 'actuator',
    badge: 'Điều khiển góc 0°–180°',
    model3DType: 'servo-sg90',
    summary: 'Động cơ quay chính xác theo góc 0°–180° bằng xung PWM tần số chuẩn 50Hz (chu kỳ 20ms).',
    specs: [
      { key: 'Điện áp nguồn', value: '4.8V – 6.0V DC (Dùng nguồn 5V ngoài ≥1A; KHÔNG lấy từ chân 3V3!)' },
      { key: 'Dòng tải đỉnh', value: '100mA không tải • 500mA – 800mA khi kẹt/khởi động quay' },
      { key: 'Tín hiệu điều khiển', value: 'PWM 50Hz (Chu kỳ 20ms): 0° ≈ 500µs • 90° ≈ 1500µs • 180° ≈ 2400µs' },
      { key: 'Thư viện ESP32', value: 'ESP32Servo (có sẵn trong platformio.ini dự án của bạn!)' },
      { key: 'Thứ tự dây chuẩn', value: 'Nâu/Đen = GND • Đỏ = 5V (+) • Cam/Vàng = Signal (GPIO)' },
    ],
    pins: [
      {
        id: 'gnd',
        name: 'Dây Nâu (hoặc Đen) — GND',
        shortLabel: 'NÂU (GND)',
        role: 'Cực âm nguồn 0V',
        color: '#78350f',
        pos3D: [-0.95, -0.5, 0.25],
        connectTo: 'Cực âm nguồn 5V ngoài VÀ chân GND của ESP32 (Nối chung!)',
        desc: 'Dây âm của động cơ Servo. Luôn nằm ở một bên mép của giắc 3 chân.',
        warning: 'Nếu dùng nguồn 5V riêng cho Servo mà quên nối dây GND vào ESP32, Servo sẽ giật rung bần bật không theo lệnh!',
      },
      {
        id: 'vcc',
        name: 'Dây Đỏ — Nguồn +5V (Ở GIỮA)',
        shortLabel: 'ĐỎ (+5V)',
        role: 'Cấp nguồn 4.8V – 6V nuôi mô-tơ DC bên trong',
        color: '#ef4444',
        pos3D: [-0.95, -0.35, 0.0],
        connectTo: 'Nguồn 5V ngoài / Mạch hạ áp 5V (Chỉ dùng VIN khi test 1 con SG90 không tải)',
        desc: 'Dây nguồn chính nằm ở vị trí chính giữa giắc cắm (giúp cắm ngược giắc cũng không bị đảo cực cháy mạch ngay, chỉ đảo Signal với GND).',
        warning: 'CẢNH BÁO SỤT ÁP: Khi quay, SG90 ăn dòng vọt lên ~500mA, MG90S/MG996R ăn tới 1.5–2A! Nếu lấy nguồn từ chân 3V3 hoặc cổng USB yếu, ESP32 sẽ lập tức báo lỗi "Brownout detector was triggered" và tự khởi động lại!',
      },
      {
        id: 'sig',
        name: 'Dây Cam (hoặc Vàng) — Signal PWM',
        shortLabel: 'CAM (SIG)',
        role: 'Nhận xung PWM 50Hz quy định góc quay',
        color: '#f97316',
        pos3D: [-0.95, -0.2, -0.25],
        connectTo: 'Chân GPIO có PWM (VD: GPIO13, GPIO18, GPIO25, GPIO26)',
        desc: 'Servo đọc ĐỘ RỘNG XUNG (tính bằng micro-giây µs) chứ không đọc điện áp trung bình. Xung 3.3V của ESP32 đủ mức kích logic cho Servo 5V hoạt động chính xác.',
        warning: 'Thư viện `Servo.h` gốc của Arduino Uno KHÔNG chạy trên ESP32 — bắt buộc cài thư viện `ESP32Servo`!',
      },
    ],
    howItWorks: [
      'Bên trong Servo gồm: 1 động cơ DC nhỏ + hộp giảm tốc nhiều bánh răng + 1 biến trở gắn vào trục ra để đo góc thật + mạch vi điều khiển phản hồi vòng kín (PID).',
      'Cứ mỗi 20ms (50 lần/giây), ESP32 gửi một xung HIGH: dài 500–1000µs → quay về 0°; dài 1500µs → đứng ở 90°; dài 2000–2500µs → quay tới 180°.',
      'Mạch bên trong Servo tự so sánh góc hiện tại (đọc từ biến trở) với góc lệnh để quay tới đúng vị trí và giữ chặt trục ở đó.',
    ],
    warnings: [
      'Không lấy nguồn từ chân 3V3 của ESP32 để nuôi Servo!',
      'Nếu điều khiển từ 2 con Servo trở lên (cánh tay robot, gật gù camera), BẮT BUỘC dùng nguồn 5V ngoài ≥2A và nối chung GND với ESP32.',
      'Không dùng tay bẻ ép trục Servo khi đang cấp điện vì có thể làm gãy bánh răng nhựa của SG90.',
    ],
    wiringTable: [
      { compPin: 'Dây Nâu (GND)', espPin: 'GND nguồn 5V + GND ESP32', note: 'Bắt buộc nối chung Mass' },
      { compPin: 'Dây Đỏ (VCC)', espPin: 'Nguồn 5V ngoài (≥1A)', note: 'Không lấy từ chân 3V3!' },
      { compPin: 'Dây Cam (Signal)', espPin: 'GPIO13 (PWM)', note: 'Dùng thư viện ESP32Servo' },
    ],
    codeSnippet: `#include <ESP32Servo.h>

Servo myServo;
const int SERVO_PIN = 13;

void setup() {
  myServo.setPeriodHertz(50);           // Chuẩn 50Hz cho Servo
  myServo.attach(SERVO_PIN, 500, 2400); // Min 500us (0°), Max 2400us (180°)
}

void loop() {
  myServo.write(0);   delay(1000);
  myServo.write(90);  delay(1000);
  myServo.write(180); delay(1000);
}`,
  },

  // =========================================================================
  // 8. MÀN HÌNH OLED 0.96" (SSD1306) & LCD 16x2 I2C
  // =========================================================================
  {
    id: 'oled-lcd-i2c',
    name: 'Màn hình OLED 0.96" (SSD1306) & LCD I2C',
    shortName: 'Màn hình OLED I2C',
    category: 'display',
    badge: 'Chuẩn I2C (2 dây)',
    model3DType: 'oled-i2c',
    summary: 'Hiển thị chữ, số và đồ họa sắc nét chỉ bằng 2 dây dữ liệu SDA & SCL (địa chỉ 0x3C / 0x27).',
    specs: [
      { key: 'Điện áp nguồn', value: 'OLED SSD1306: 3.3V–5V (Khuyên dùng 3.3V) • LCD 16x2 I2C: cần 5V đèn nền mới sáng' },
      { key: 'Giao tiếp', value: 'I2C (Chỉ cần 2 dây tín hiệu SDA & SCL — mắc chung nhiều thiết bị được!)' },
      { key: 'Chân I2C mặc định', value: 'ESP32 Classic: SDA=21, SCL=22 • ESP32-S3: SDA=8, SCL=9 • C3: SDA=8, SCL=9' },
      { key: 'Địa chỉ I2C phổ biến', value: 'OLED 0.96": 0x3C (đôi khi 0x3D) • LCD 16x2 PCF8574: 0x27 (hoặc 0x3F)' },
      { key: 'Độ phân giải OLED', value: '128 × 64 pixels (dòng rất nhẹ chỉ ~20mA)' },
    ],
    pins: [
      {
        id: 'gnd',
        name: 'GND (Mass)',
        shortLabel: 'GND',
        role: 'Cực âm nguồn 0V',
        color: '#64748b',
        pos3D: [-0.45, 0.95, 0.08],
        connectTo: 'GND của ESP32',
        desc: 'Chú ý thứ tự chân trên từng màn hình! Một số hãng xếp `GND-VCC-SCL-SDA`, hãng khác xếp `VCC-GND-SCL-SDA` — LUÔN đọc kỹ chữ in trên mạch trước khi cắm!',
        warning: 'Cắm ngược VCC và GND trên màn hình OLED có thể làm cháy IC nguồn hoặc màn hình ngay trong 1 giây!',
      },
      {
        id: 'vcc',
        name: 'VCC / VDD (Nguồn dương)',
        shortLabel: 'VCC 3.3V',
        role: 'Cấp nguồn 3.3V cho OLED (hoặc 5V nếu là LCD 16x2)',
        color: '#ef4444',
        pos3D: [-0.15, 0.95, 0.08],
        connectTo: '3V3 của ESP32 (với OLED) • VIN/5V (với LCD 16x2)',
        desc: 'Màn hình OLED 0.96" có mạch ổn áp nhỏ ở mặt sau nên chạy rất mát và ổn định ở nguồn 3.3V.',
        warning: 'Riêng với module LCD 16x2 I2C dùng nguồn 5V: điện trở kéo lên (Pull-up) trên mạch LCD kéo đường SDA/SCL lên 5V. Tuy ESP32 có thể chịu tạm thời nhưng khuyên gỡ 2 trở pull-up trên module I2C hoặc dùng bộ chuyển mức 3.3V↔5V nếu chạy lâu dài.',
      },
      {
        id: 'scl',
        name: 'SCL (Serial Clock — Xung nhịp I2C)',
        shortLabel: 'SCL',
        role: 'Đường xung đồng bộ dữ liệu I2C',
        color: '#a855f7',
        pos3D: [0.15, 0.95, 0.08],
        connectTo: 'GPIO22 trên ESP32 thường (hoặc GPIO9 trên ESP32-S3 / C3)',
        desc: 'ESP32 tạo xung nhịp lên chân SCL để đồng bộ tốc độ truyền từng bit dữ liệu (chuẩn 100kHz hoặc Fast Mode 400kHz).',
        warning: 'Có thể nối chung nhiều màn hình / cảm biến I2C (như OLED + MPU6050) vào cùng cặp dây SDA & SCL miễn là chúng khác địa chỉ I2C!',
      },
      {
        id: 'sda',
        name: 'SDA (Serial Data — Dữ liệu I2C)',
        shortLabel: 'SDA',
        role: 'Đường truyền nhận dữ liệu 2 chiều I2C',
        color: '#9333ea',
        pos3D: [0.45, 0.95, 0.08],
        connectTo: 'GPIO21 trên ESP32 thường (hoặc GPIO8 trên ESP32-S3 / C3)',
        desc: 'Truyền dữ liệu điểm ảnh / ký tự từ ESP32 ra màn hình.',
        warning: 'Nếu màn hình không lên chữ: chạy code I2C Scanner trước để kiểm tra xem ESP32 có nhìn thấy địa chỉ `0x3C` hoặc `0x27` hay không (nếu không thấy 90% là do lỏng dây hoặc đấu nhầm SDA↔SCL).',
      },
    ],
    howItWorks: [
      'Giao thức I2C hoạt động theo cơ chế Master-Slave: ESP32 là Master điều phối xung nhịp (SCL), còn mỗi màn hình/cảm biến là 1 Slave có địa chỉ riêng (giống số nhà).',
      'Khi dùng cả OLED (`0x3C`) và LCD/MPU6050 (`0x27` / `0x68`), bạn chỉ tốn đúng 2 chân GPIO trên ESP32 cho tất cả chúng.',
      'Mẹo tối ưu tốc độ (như trong dự án tay cầm ESP32-S3 của bạn): KHÔNG cập nhật LCD 16x2 liên tục trong `loop()` vì bus I2C gửi chậm — hãy dùng `millis()` giới hạn cập nhật màn hình mỗi 200–500ms!',
    ],
    warnings: [
      'LUÔN đọc kỹ thứ tự chữ in trên 4 chân OLED (`GND VCC` hay `VCC GND`) trước khi cấp điện!',
      'Đừng gọi `display.display()` quá dày đặc nếu không cần thiết — tránh nghẽn vòng lặp điều khiển động cơ/ESP-NOW.',
    ],
    wiringTable: [
      { compPin: 'GND', espPin: 'GND', note: 'Kiểm tra kỹ vị trí chân trên PCB' },
      { compPin: 'VCC', espPin: '3V3 (OLED) / VIN 5V (LCD 16x2)', note: 'OLED rất hợp 3.3V' },
      { compPin: 'SCL', espPin: 'GPIO22 (Classic) / GPIO9 (S3, C3)', note: 'Xung nhịp I2C' },
      { compPin: 'SDA', espPin: 'GPIO21 (Classic) / GPIO8 (S3, C3)', note: 'Dữ liệu I2C' },
    ],
    codeSnippet: `#include <Wire.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Wire.begin(21, 22); // SDA=21, SCL=22 (ESP32-S3 đổi thành 8, 9)
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 10);
  display.println("ESP32 Ready!");
  display.display();
}
void loop() {}`,
  },

  // =========================================================================
  // 9. MODULE RELAY ĐÓNG NGẮT TẢI
  // =========================================================================
  {
    id: 'relay-module',
    name: 'Module Relay 1 Kênh (Đóng ngắt thiết bị)',
    shortName: 'Relay 1 kênh',
    category: 'actuator',
    badge: 'Đóng ngắt 220V / 12V',
    model3DType: 'relay',
    summary: 'Công tắc điện từ cách ly đóng ngắt đèn 220V, quạt, bơm nước bằng tín hiệu nhỏ từ ESP32.',
    specs: [
      { key: 'Điện áp cấp cuộn hút', value: 'Loại Relay 5V (cắm VIN/5V) hoặc loại Relay 3.3V (cắm 3V3)' },
      { key: 'Mức kích hoạt (IN)', value: 'Đa số module xanh kích mức THẤP (Active LOW = ĐÓNG Relay!)' },
      { key: 'Công suất tiếp điểm', value: 'Tối đa 10A @ 250V AC hoặc 10A @ 30V DC (Không chạy tải cảm lớn quá 5A)' },
      { key: '3 Cổng đầu ra tải', value: 'COM (Chung) • NO (Thường hở — đóng khi kích) • NC (Thường đóng)' },
      { key: 'Cách ly quang', value: 'Nhiều module có Optocoupler PC817 bảo vệ ngược xung cho ESP32' },
    ],
    pins: [
      {
        id: 'vcc',
        name: 'VCC (Nuôi cuộn hút Relay)',
        shortLabel: 'VCC 5V',
        role: 'Cấp nguồn 5V cho cuộn dây nam châm điện (với Relay 5V)',
        color: '#ef4444',
        pos3D: [-1.15, -0.15, -0.35],
        connectTo: 'Chân VIN / 5V của ESP32 (hoặc nguồn 5V ngoài nếu dùng từ 2 Relay trở lên)',
        desc: 'Cuộn hút Relay 5V ăn dòng khoảng 70–80mA khi đóng. Tuyệt đối không lấy từ chân 3V3 vì Relay 5V không hút nổi (chỉ kêu rè rè) và làm sụt áp chip.',
        warning: 'Nếu dùng module 4 hoặc 8 kênh Relay, bắt buộc cấp nguồn 5V riêng bên ngoài!',
      },
      {
        id: 'gnd',
        name: 'GND (Mass)',
        shortLabel: 'GND',
        role: 'Cực âm nguồn',
        color: '#64748b',
        pos3D: [-1.15, -0.15, 0.0],
        connectTo: 'GND của ESP32',
        desc: 'Dây âm chung giữa mạch Relay và ESP32.',
        warning: 'Không được chạm tay vào mặt dưới board Relay khi bên tải đang nối điện lưới 220V!',
      },
      {
        id: 'in',
        name: 'IN (Chân tín hiệu điều khiển)',
        shortLabel: 'IN',
        role: 'Nhận mức HIGH/LOW để đóng/ngắt Relay',
        color: '#3b82f6',
        pos3D: [-1.15, -0.15, 0.35],
        connectTo: 'Chân GPIO sạch KHÔNG nháy lúc boot (VD: GPIO26, 27, 32, 33)',
        desc: 'Kiểm tra loại Relay: Đa số module Relay xanh có Opto trên thị trường kích mức THẤP (`LOW` = Đóng Relay, `HIGH` = Nhả Relay). Một số loại mới có Jumper chọn H/L.',
        warning: 'BẪY CỰC NGUY HIỂM: KHÔNG nối chân IN của Relay vào GPIO5, GPIO12, GPIO14, GPIO15 vì các chân này phát xung nháy lúc khởi động — sẽ làm đèn/bơm 220V bật nháy "tạch" 1 cái mỗi khi mất điện có lại! Hãy dùng GPIO26, 27, 32, 33 và đặt `digitalWrite(RELAY, HIGH)` TRƯỚC `pinMode(RELAY, OUTPUT)` nếu Relay kích LOW!',
      },
      {
        id: 'no-com-nc',
        name: 'Cổng tải COM / NO / NC (Bên domino xanh)',
        shortLabel: 'COM / NO / NC',
        role: 'Tiếp điểm cơ học đóng ngắt mạch điện công suất',
        color: '#f59e0b',
        pos3D: [1.18, -0.05, 0.0],
        connectTo: 'Đấu NỐI TIẾP 1 dây (khuyên ngắt dây Lửa L) của bóng đèn/máy bơm',
        desc: 'Cổng giữa là **COM** (Common). **NO** (Normally Open - Thường hở): bình thường hở, khi kích Relay sẽ nối thông với COM (dùng 95% trường hợp). **NC** (Normally Closed): bình thường nối thông với COM, khi kích sẽ ngắt ra.',
        warning: '⚡ AN TOÀN ĐIỆN 220V: Domino tiếp điểm 220V cách ly hoàn toàn với bên 3 chân tín hiệu. Tuyệt đối KHÔNG cấp điện 220V vào hai đầu dây khi chưa cố định chặt ốc domino và đặt trong hộp cách điện!',
      },
    ],
    howItWorks: [
      'Khi tín hiệu kích hoạt vào chân IN, dòng điện đi qua cuộn dây đồng tạo ra từ trường hút thanh sắt công tắc bên trong hộp nhựa xanh (nghe tiếng "tạch") nối cặp tiếp điểm COM và NO.',
      'Nếu bạn dùng Relay 5V kích mức THẤP (Active LOW) với ESP32 3.3V: một số module Relay 5V cần kéo dòng về 0V (LOW) rất dễ đóng, nhưng khi ESP32 xuất HIGH (3.3V), chênh áp 5V - 3.3V = 1.7V đôi khi vẫn làm LED kích mờ khiến Relay KHÔNG chịu nhả! Nếu gặp hiện tượng Relay bật lên rồi không tắt được, hãy dùng Relay loại hỗ trợ 3.3V hoặc thêm 1 con Transistor NPN (C1815 / 2N2222) kích đệm.',
    ],
    warnings: [
      'Ưu tiên dùng chân GPIO 26, 27, 32, 33 (không phát xung lúc boot) cho Relay.',
      'Nếu Relay kích LOW không chịu nhả khi xuất 3.3V (do nguồn VCC = 5V), hãy gắn jumper sang nguồn 3.3V cho phần kích Opto (JD-VCC riêng) hoặc dùng mạch đệm Transistor.',
    ],
    wiringTable: [
      { compPin: 'VCC / GND', espPin: 'VIN (5V) / GND', note: 'Đủ dòng cho cuộn hút 5V' },
      { compPin: 'IN', espPin: 'GPIO26 (An toàn khi boot)', note: 'Kiểm tra Active LOW hay Active HIGH' },
      { compPin: 'COM & NO', espPin: 'Cắt 1 dây nguồn tải (Đèn/Bơm)', note: 'KHÔNG đấu trực tiếp 2 dây nguồn vào COM & NO!' },
    ],
    codeSnippet: `#define RELAY_PIN 26
#define RELAY_ON  LOW   // Đổi thành HIGH nếu Relay của bạn kích mức cao
#define RELAY_OFF HIGH

void setup() {
  digitalWrite(RELAY_PIN, RELAY_OFF); // Chốt trạng thái TẮT trước khi mở Output!
  pinMode(RELAY_PIN, OUTPUT);
}

void loop() {
  digitalWrite(RELAY_PIN, RELAY_ON);  delay(2000); // Đóng Relay
  digitalWrite(RELAY_PIN, RELAY_OFF); delay(2000); // Nhả Relay
}`,
  },

  // =========================================================================
  // 10. CẢM BIẾN GIA TỐC & CON QUAY HỒI CHUYỂN 6 TRỤC (MPU6050)
  // =========================================================================
  {
    id: 'mpu6050',
    name: 'Cảm biến góc nghiêng 6 trục (MPU6050 / GY-521)',
    shortName: 'MPU6050 6-Trục',
    category: 'sensor',
    badge: 'Robot tự cân bằng',
    model3DType: 'mpu6050',
    summary: 'Đo gia tốc 3 trục (Ax, Ay, Az) và vận tốc góc con quay hồi chuyển 3 trục (Gx, Gy, Gz) qua bus I2C.',
    specs: [
      { key: 'Điện áp cấp (VCC)', value: '3.3V – 5V (Module GY-521 có sẵn IC ổn áp 3.3V — khuyên cấp 3.3V hoặc 5V)' },
      { key: 'Giao tiếp & Địa chỉ', value: 'I2C (SDA, SCL) • Địa chỉ mặc định 0x68 (kéo AD0 lên 3.3V đổi thành 0x69)' },
      { key: '6 Bậc tự do (6-DoF)', value: '3 trục Gia tốc kế (±2g..±16g) + 3 trục Con quay hồi chuyển (±250..±2000°/s)' },
      { key: 'Nhiệt độ nội', value: 'Tích hợp cảm biến nhiệt độ chip hỗ trợ bù trôi góc' },
      { key: 'Tốc độ I2C khuyên dùng', value: '400 kHz (`Wire.setClock(400000)`) cho robot phản hồi nhanh' },
    ],
    pins: [
      {
        id: 'vcc',
        name: 'VCC (Nguồn dương)',
        shortLabel: 'VCC',
        role: 'Cấp nguồn nuôi module GY-521',
        color: '#ef4444',
        pos3D: [-0.75, -0.58, 0.08],
        connectTo: '3V3 (hoặc VIN 5V) trên ESP32',
        desc: 'Bản GY-521 có IC ổn áp LDO 3.3V gắn sẵn. Nếu cấp vào chân 3V3 của ESP32 vẫn chạy ổn, hoặc cấp 5V vào VCC (nhưng mức logic I2C trên mạch vẫn kéo lên 3.3V qua trở sau LDO).',
        warning: 'Tránh gắn nguồn chập chờn gây reset thông số hiệu chuẩn (Calibration) của con quay.',
      },
      {
        id: 'gnd',
        name: 'GND (Mass)',
        shortLabel: 'GND',
        role: 'Cực âm 0V',
        color: '#64748b',
        pos3D: [-0.53, -0.58, 0.08],
        connectTo: 'GND của ESP32',
        desc: 'Nối chung Mass với ESP32.',
        warning: 'Dây nối I2C với MPU6050 nên ngắn (<20cm) để tránh nhiễu động cơ làm treo bus I2C.',
      },
      {
        id: 'scl',
        name: 'SCL (Xung nhịp I2C)',
        shortLabel: 'SCL',
        role: 'Đường xung nhịp I2C',
        color: '#a855f7',
        pos3D: [-0.31, -0.58, 0.08],
        connectTo: 'GPIO22 (ESP32 Classic) / GPIO9 (ESP32-S3)',
        desc: 'Truyền xung nhịp I2C tốc độ tối đa 400kHz.',
        warning: 'Mạch GY-521 đã có sẵn điện trở kéo lên (Pull-up) 4.7kΩ trên SDA và SCL.',
      },
      {
        id: 'sda',
        name: 'SDA (Dữ liệu I2C)',
        shortLabel: 'SDA',
        role: 'Đường dữ liệu I2C',
        color: '#9333ea',
        pos3D: [-0.09, -0.58, 0.08],
        connectTo: 'GPIO21 (ESP32 Classic) / GPIO8 (ESP32-S3)',
        desc: 'Đọc các thanh ghi dữ liệu gia tốc và vận tốc góc 16-bit.',
        warning: 'Nếu bus I2C bị treo khi động cơ quay gây nhiễu, hãy gọi `Wire.setTimeOut(50)` để ESP32 không bị đứng mạch.',
      },
      {
        id: 'xda-xcl',
        name: 'XDA / XCL (Auxiliary I2C)',
        shortLabel: 'XDA / XCL',
        role: 'Cổng I2C phụ nối thêm cảm biến la bàn (thường bỏ trống)',
        color: '#475569',
        pos3D: [0.22, -0.58, 0.08],
        connectTo: 'Để trống (Không nối)',
        desc: 'Dùng để MPU6050 giao tiếp trực tiếp với cảm biến từ trường HMC5883L bên ngoài thành hệ 9 trục. Với các bài tập cơ bản hoàn toàn để trống.',
        warning: 'Không nối nhầm XDA/XCL thay cho SDA/SCL!',
      },
      {
        id: 'ad0',
        name: 'AD0 (Chọn địa chỉ I2C)',
        shortLabel: 'AD0',
        role: 'LOW/Thả nổi = 0x68 • HIGH (3.3V) = 0x69',
        color: '#eab308',
        pos3D: [0.53, -0.58, 0.08],
        connectTo: 'Để trống (hoặc GND) để dùng địa chỉ mặc định 0x68',
        desc: 'Cho phép gắn tối đa 2 con MPU6050 trên cùng 1 bus I2C: con thứ nhất nối AD0 xuống GND (`0x68`), con thứ hai nối AD0 lên 3V3 (`0x69`).',
        warning: 'Đừng cấp 5V vào AD0!',
      },
      {
        id: 'int',
        name: 'INT (Interrupt — Ngắt báo có dữ liệu mới)',
        shortLabel: 'INT',
        role: 'Xuất xung ngắt khi DMP/ADC có mẫu dữ liệu mới',
        color: '#06b6d4',
        pos3D: [0.75, -0.58, 0.08],
        connectTo: 'Tùy chọn nối vào GPIO ngắt (hoặc để trống)',
        desc: 'Hữu ích khi dùng thư viện DMP (Digital Motion Processor) để đọc Quaternion chuẩn xác cao.',
        warning: 'Với bài tập cơ bản đọc trực tiếp qua I2C thì chưa cần nối chân INT.',
      },
    ],
    howItWorks: [
      'Gia tốc kế (Accelerometer) đo gia tốc tổng hợp (bao gồm trọng lực Trái Đất $9.8\\text{ m/s}^2$) — cực chính xác khi vật đứng yên nhưng bị nhiễu mạnh khi xe rung lắc.',
      'Con quay hồi chuyển (Gyroscope) đo tốc độ xoay (°/giây) cực mượt khi đang chuyển động, nhưng bị trôi số (Drift) nếu tích phân lâu.',
      'Khi kết hợp cả 2 bằng **Bộ lọc bù (Complementary Filter)** hoặc **Kalman Filter**, bạn tính được góc nghiêng Pitch/Roll vừa nhanh nhạy vừa không bị trôi!',
    ],
    warnings: [
      'Khi mới bật nguồn hoặc gọi hàm hiệu chuẩn Offset, hãy đặt cảm biến NẰM PHẲNG ĐỨNG YÊN trong 2 giây đầu!',
      'Chú ý chiều mũi tên X, Y in trên mặt PCB của GY-521 để đặt đúng hướng xe robot.',
    ],
    wiringTable: [
      { compPin: 'VCC / GND', espPin: '3V3 / GND', note: 'Hoặc VCC nối 5V' },
      { compPin: 'SCL / SDA', espPin: 'GPIO22 / GPIO21', note: 'Địa chỉ I2C: 0x68' },
      { compPin: 'XDA, XCL, AD0, INT', espPin: 'Để trống', note: 'Không bắt buộc khi bắt đầu' },
    ],
    codeSnippet: `#include <Wire.h>
const int MPU_ADDR = 0x68;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); Wire.write(0); // Đánh thức MPU6050 khỏi chế độ ngủ!
  Wire.endTransmission(true);
}

void loop() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B); // Thanh ghi bắt đầu của ACCEL_XOUT_H
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  int16_t ax = Wire.read() << 8 | Wire.read();
  int16_t ay = Wire.read() << 8 | Wire.read();
  int16_t az = Wire.read() << 8 | Wire.read();
  Serial.printf("Ax:%d  Ay:%d  Az:%d\\n", ax, ay, az);
  delay(150);
}`,
  },
];
