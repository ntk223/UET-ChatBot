import { useCallback, useEffect, useState, useMemo } from "react";
import { createMessage } from "../utils/messages.js";

const DEFAULT_SYSTEM_PROMPT = `## 1. VAI TRÒ & ĐẠI DIỆN (IDENTITY)
Bạn là Trợ lý ảo Tuyển sinh và Nhập học chính thức của Trường Đại học Công nghệ - Đại học Quốc gia Hà Nội (UET-VNU). Nhiệm vụ của bạn là tư vấn thông tin ngành học một cách thân thiện và dẫn dắt thí sinh hoàn thành quy trình đặt nguyện vọng trực tuyến theo đúng sơ đồ flowchart nghiệp vụ.

## 2. KIẾN THỨC NỀN TẢNG (KNOWLEDGE BASE)
Sử dụng thông tin chính xác sau để tư vấn:
- **Khoa học máy tính (Mã ngành: CN1):** Học về AI, Khoa học dữ liệu, Công nghệ phần mềm. Điểm chuẩn 2025: 27.25.
- **Kỹ thuật phần mềm (Mã ngành: CN2):** Học về quy trình phát triển, kiểm thử phần mềm. Điểm chuẩn 2025: 26.85.
- **Công nghệ thông tin (Mã ngành: CN4):** Học về hệ thống mạng, hạ tầng CNTT, phát triển web/app. Điểm chuẩn 2025: 26.50.
- **An toàn thông tin (Mã ngành: CN11):** Học về mật mã, bảo mật hệ thống, an ninh mạng. Điểm chuẩn 2025: 26.10.

## 3. QUY TRÌNH ĐIỀU HƯỚNG FLOWCHART (CONVERSATION STATE MACHINE)
Bạn phải theo dõi sát tiến trình của cuộc hội thoại. Khi người dùng muốn ĐĂNG KÝ NGUYỆN VỌNG, bạn bắt buộc phải ép hội thoại đi theo quy trình thu thập thông tin nghiêm ngặt, hỏi MỖI LƯỢT MỘT CÂU HỎI, không hỏi gộp.

### Bước 1: Xác định phương thức xét tuyển
Hỏi thí sinh chọn 1 trong 4 phương thức: THPTQG, HSA, IELTS, TUYEN_THANG.

### Bước 2: Rẽ nhánh thu thập thông tin dựa trên phương thức
Sau khi có phương thức, hãy kích hoạt "Vòng lặp thu thập" (Form Loop) tương ứng để hỏi tuần tự các thông tin còn thiếu. 

- Nếu chọn phương thức THPTQG:
  1. Hỏi Họ và tên (fullname)
  2. Hỏi Số điện thoại (phone_number)
  3. Hỏi Ngành chọn đăng ký (chosen_major)
  4. Hỏi Khối thi / Tổ hợp môn (thptqg_block)
  5. Hỏi Tổng điểm tổ hợp /30 (thptqg_score)
  6. Hỏi Link minh chứng Cloud (evidence_url) -> Kết thúc, gọi hàm: action_submit_thptqg_form.

- Nếu chọn phương thức HSA:
  1. Hỏi Họ và tên (fullname)
  2. Hỏi Số điện thoại (phone_number)
  3. Hỏi Ngành chọn đăng ký (chosen_major)
  4. Hỏi Số báo danh HSA (hsa_id)
  5. Hỏi Điểm thi HSA (hsa_score) -> Kết thúc, gọi hàm: action_submit_hsa_form.

- Nếu chọn phương thức IELTS:
  1. Hỏi Họ và tên (fullname)
  2. Hỏi Số điện thoại (phone_number)
  3. Hỏi Ngành chọn đăng ký (chosen_major)
  4. Hỏi Điểm thi IELTS (ielts_score)
  5. Hỏi Điểm môn Toán kết hợp (math_score) -> Kết thúc, gọi hàm: action_submit_ielts_form.

- Nếu chọn phương thức TUYEN_THANG:
  1. Hỏi Họ và tên (fullname)
  2. Hỏi Số điện thoại (phone_number)
  3. Hỏi Ngành chọn đăng ký (chosen_major)
  4. Hỏi Tên giải thưởng đạt được (award_name) -> Kết thúc, gọi hàm: action_submit_direct_form.

## 4. QUY TẮC PHẢN HỒI (OUTPUT FORMAT & CONSTRAINT)
1. Quản lý Slot ngầm: Đọc kỹ câu trả lời của user ở lượt chat mới nhất, tự động trích xuất thông tin để điền vào bộ nhớ (Slots).
2. Không nhảy bước: Tuyệt đối không được bỏ qua bất kỳ trường thông tin nào trong luồng phương thức đã chọn.
3. Xử lý xen ngang (Unhappy Path): Nếu user đang điền thông tin mà hỏi xen ngang (ví dụ: đang điền điểm THPTQG bỗng hỏi "Học phí CN1 bao nhiêu?"), hãy trả lời ngắn gọn câu hỏi đó, sau đó lập tức đưa người dùng quay lại đúng slot đang bỏ dở bằng câu: "Quay lại hồ sơ của bạn, xin vui lòng cung cấp tiếp...".
4. Định dạng Output cuối cùng: Khi thu thập đủ thông tin của một phương thức, bạn phải xuất ra kết quả có cấu trúc JSON ở cuối phản hồi để Backend bắt sự kiện, định dạng:
   [CALL_ACTION: <tên_action>] kèm tóm tắt dữ liệu.

## 5. VÍ DỤ TƯ DUY TRONG LƯỢT (THINKING PROCESS)
User: "Mình thi khối A00"
Agent Thinking: 
- User cung cấp khối thi -> Trích xuất slot: thptqg_block = "A00".
- Trạng thái luồng hiện tại: Phương thức THPTQG.
- Slot tiếp theo cần thu thập: thptqg_score.
Response: "Hệ thống đã nhận khối thi A00. Bạn vui lòng cung cấp tổng điểm thi của tổ hợp này nhé."`;

const INITIAL_SLOTS = {
  fullname: null,
  phone_number: null,
  chosen_major: null,
  thptqg_block: null,
  thptqg_score: null,
  evidence_url: null,
  hsa_id: null,
  hsa_score: null,
  ielts_score: null,
  math_score: null,
  award_name: null,
};

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [chatEngine, setChatEngine] = useState("rasa"); // Locked to Rasa engine
  const [rasaStatus, setRasaStatus] = useState("unknown");

  const [senderId, setSenderId] = useState(() => `user-${Math.floor(Math.random() * 1000000)}`);

  // Compatibility wrappers
  const useLocalSimulator = chatEngine === "local";
  const setUseLocalSimulator = useCallback((val) => {
    setChatEngine(val ? "local" : "gemini");
  }, []);

  // Conversation state machine slots
  const [slots, setSlots] = useState(INITIAL_SLOTS);
  const [currentFlow, setCurrentFlow] = useState(null); // 'THPTQG' | 'HSA' | 'IELTS' | 'TUYEN_THANG' | null
  const [nextSlotToCollect, setNextSlotToCollect] = useState(null); // e.g. 'fullname', 'phone_number', 'method'
  const [submissions, setSubmissions] = useState(() => {
    const saved = localStorage.getItem("uet_candidate_submissions");
    return saved ? JSON.parse(saved) : [];
  });

  // Save submissions to local storage when changed
  useEffect(() => {
    localStorage.setItem("uet_candidate_submissions", JSON.stringify(submissions));
  }, [submissions]);

  // Persist API Key & Engine Mode
  useEffect(() => {
    localStorage.setItem("gemini_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("uet_chat_engine", chatEngine);
  }, [chatEngine]);

  // Rasa health monitor
  useEffect(() => {
    if (chatEngine === "rasa") {
      fetch("http://localhost:5005/")
        .then(() => setRasaStatus("online"))
        .catch(() => setRasaStatus("offline"));
    }
  }, [chatEngine]);

  const getSenderId = useCallback(() => {
    return senderId;
  }, [senderId]);

  const newChat = useCallback(() => {
    const newId = `user-${Math.floor(Math.random() * 1000000)}`;
    setSenderId(newId);
    setMessages([]);
    setSlots(INITIAL_SLOTS);
    setCurrentFlow(null);
    setNextSlotToCollect(null);
    setError("");

    // If using Rasa, send /restart event to clear server side tracker
    if (chatEngine === "rasa") {
      fetch(`http://localhost:5005/conversations/${encodeURIComponent(newId)}/tracker/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "restart" })
      }).catch((err) => console.warn("Failed to restart Rasa tracker:", err));
    }

    // Push initial message
    const botMsg = createMessage({
      from: "bot",
      text: "Xin chào! Mình là Trợ lý ảo Tuyển sinh và Nhập học chính thức của Trường Đại học Công nghệ - ĐHQGHN (UET-VNU). Mình có thể tư vấn thông tin các ngành học hoặc hướng dẫn bạn đăng ký nguyện vọng trực tuyến. Bạn cần mình hỗ trợ gì hôm nay?",
      buttons: [
        { title: "Tư vấn ngành học 📚", payload: "hoi_thong_tin_nganh" },
        { title: "Đăng ký nguyện vọng 📝", payload: "dang_ky_nguyen_vong" },
      ],
      thinking: "Khởi chạy Agent tuyển sinh UET. Chào mừng người dùng và hiển thị lựa chọn hướng đi ban đầu.",
    });
    setMessages([botMsg]);
  }, [chatEngine]);

  const startChat = useCallback(() => {
    newChat();
  }, [newChat]);

  // Boot on mount
  useEffect(() => {
    newChat();
  }, []);

  // Helper label mapping
  const getSlotLabel = (name) => {
    const labels = {
      fullname: "Họ và tên",
      phone_number: "Số điện thoại",
      chosen_major: "Ngành đăng ký",
      thptqg_block: "Khối thi / Tổ hợp môn",
      thptqg_score: "Tổng điểm thi THPTQG",
      evidence_url: "Đường dẫn minh chứng học bạ/điểm thi",
      hsa_id: "Số báo danh HSA",
      hsa_score: "Điểm thi HSA",
      ielts_score: "Điểm chứng chỉ IELTS",
      math_score: "Điểm môn Toán kết hợp",
      award_name: "Tên giải thưởng đạt được",
    };
    return labels[name] || name;
  };

  // Helper question mapping
  const getSlotQuestion = (name) => {
    const questions = {
      fullname: "Vui lòng cung cấp Họ và tên đầy đủ của thí sinh:",
      phone_number: "Vui lòng cung cấp Số điện thoại liên hệ chính thức:",
      chosen_major: "Bạn muốn đăng ký nguyện vọng vào ngành nào? (Bạn có thể chọn nút bấm dưới đây):",
      thptqg_block: "Bạn xét tuyển theo khối thi / tổ hợp môn nào? (Ví dụ: A00, A01, D01):",
      thptqg_score: "Tổng điểm tổ hợp 3 môn thi THPTQG của bạn là bao nhiêu (Thang điểm 30)?",
      evidence_url: "Vui lòng dán link (URL) ảnh chụp minh chứng học bạ hoặc điểm thi đã upload lên Cloud của bạn tại đây:",
      hsa_id: "Nhập số báo danh kì thi HSA của bạn (Ví dụ: HSA-12345):",
      hsa_score: "Tổng điểm thi HSA (ĐGNL) của bạn là bao nhiêu (Thang điểm 150)?",
      ielts_score: "Điểm chứng chỉ IELTS Academic của bạn là bao nhiêu (Ví dụ: 6.5, 7.0)?",
      math_score: "Điểm môn Toán học bạ/thi THPT kết hợp của bạn là bao nhiêu (Thang điểm 10)?",
      award_name: "Ghi rõ tên giải thưởng và môn thi học sinh giỏi của bạn (Ví dụ: Giải Nhì Tin học Quốc gia):",
    };
    return questions[name] || `Vui lòng nhập ${getSlotLabel(name)}:`;
  };

  // Helper major buttons
  const majorButtons = [
    { title: "Khoa học máy tính (CN1)", payload: "CN1" },
    { title: "Kỹ thuật phần mềm (CN2)", payload: "CN2" },
    { title: "Công nghệ thông tin (CN4)", payload: "CN4" },
    { title: "An toàn thông tin (CN11)", payload: "CN11" },
  ];

  // Helper block buttons
  const blockButtons = [
    { title: "A00 (Toán, Lý, Hóa)", payload: "A00" },
    { title: "A01 (Toán, Lý, Anh)", payload: "A01" },
    { title: "D01 (Toán, Văn, Anh)", payload: "D01" },
    { title: "D07 (Toán, Hóa, Anh)", payload: "D07" },
  ];

  // Local rule-based system prompt simulator
  const runLocalSimulator = useCallback((userText, payload) => {
    const text = (payload || userText).trim();
    const normalized = text.toLowerCase();

    let thinkingLines = [];
    let responseText = "";
    let responseButtons = [];
    let callAction = null;

    // Temporary variables for states
    let tempSlots = { ...slots };
    let tempFlow = currentFlow;
    let tempNextSlot = nextSlotToCollect;

    thinkingLines.push(`Nhận tin nhắn: "${text}"${payload ? ` (Payload: "${payload}")` : ""}`);

    // Check if user wants to reset or start over
    if (normalized === "/restart" || normalized.includes("bắt đầu lại") || normalized === "lượt chat mới") {
      thinkingLines.push("- User muốn reset cuộc hội thoại -> Xóa toàn bộ trạng thái.");
      setSlots(INITIAL_SLOTS);
      setCurrentFlow(null);
      setNextSlotToCollect(null);
      return {
        text: "Hệ thống đã reset. Mình có thể giúp gì cho bạn hôm nay?",
        buttons: [
          { title: "Tư vấn ngành học 📚", payload: "hoi_thong_tin_nganh" },
          { title: "Đăng ký nguyện vọng 📝", payload: "dang_ky_nguyen_vong" },
        ],
        thinking: "Reset toàn bộ slots và trạng thái cuộc trò chuyện theo yêu cầu của user.",
      };
    }

    // 1. Implicit slot extraction (Rule 1: Quản lý Slot ngầm)
    // Extract Phone Number
    const phoneMatch = text.match(/\b(0[35789]\d{8})\b/);
    if (phoneMatch && !tempSlots.phone_number) {
      tempSlots.phone_number = phoneMatch[1];
      thinkingLines.push(`- Trích xuất slot ngầm [phone_number] = "${phoneMatch[1]}"`);
    }

    // Extract URL
    const urlMatch = text.match(/\b(https?:\/\/[^\s]+)/i) || text.includes("drive.google.com") || text.includes("cloudinary.com") || text.includes("imgur.com");
    if (urlMatch && !tempSlots.evidence_url && tempFlow === "THPTQG") {
      const urlStr = typeof urlMatch === "string" ? text : urlMatch[0];
      tempSlots.evidence_url = urlStr;
      thinkingLines.push(`- Trích xuất slot ngầm [evidence_url] = "${urlStr}"`);
    }

    // Extract Block
    const blockMatch = text.match(/\b(A00|A01|D01|D07)\b/i);
    if (blockMatch && !tempSlots.thptqg_block && tempFlow === "THPTQG") {
      tempSlots.thptqg_block = blockMatch[1].toUpperCase();
      thinkingLines.push(`- Trích xuất slot ngầm [thptqg_block] = "${tempSlots.thptqg_block}"`);
    }

    // Extract Major
    let matchedMajor = null;
    if (normalized.includes("khoa học máy tính") || normalized.includes("khmt") || normalized.includes("cn1")) {
      matchedMajor = "Khoa học máy tính (CN1)";
    } else if (normalized.includes("kỹ thuật phần mềm") || normalized.includes("ktpm") || normalized.includes("cn2")) {
      matchedMajor = "Kỹ thuật phần mềm (CN2)";
    } else if (normalized.includes("công nghệ thông tin") || normalized.includes("cntt") || normalized.includes("cn4")) {
      matchedMajor = "Công nghệ thông tin (CN4)";
    } else if (normalized.includes("an toàn thông tin") || normalized.includes("attt") || normalized.includes("cn11")) {
      matchedMajor = "An toàn thông tin (CN11)";
    }

    if (matchedMajor && !tempSlots.chosen_major) {
      tempSlots.chosen_major = matchedMajor;
      thinkingLines.push(`- Trích xuất slot ngầm [chosen_major] = "${matchedMajor}"`);
    }

    // 2. State routing logic
    if (normalized.includes("đăng ký") || normalized.includes("nguyện vọng") || normalized.includes("nộp hồ sơ") || text === "dang_ky_nguyen_vong") {
      thinkingLines.push("- Phát hiện yêu cầu đăng ký nguyện vọng -> Chuyển sang Bước 1: Xác định phương thức.");
      tempFlow = null;
      tempNextSlot = "method";
      responseText = "Bạn muốn ĐĂNG KÝ NGUYỆN VỌNG xét tuyển trực tuyến. Vui lòng chọn 1 trong 4 phương thức xét tuyển chính thức sau đây:";
      responseButtons = [
        { title: "Xét điểm thi THPTQG 📝", payload: "method_THPTQG" },
        { title: "Xét tuyển HSA (ĐGNL) ⚡", payload: "method_HSA" },
        { title: "Xét tuyển kết hợp IELTS 🇬🇧", payload: "method_IELTS" },
        { title: "Diện Tuyển thẳng 🥇", payload: "method_TUYEN_THANG" },
      ];
    } else if (tempNextSlot === "method") {
      // User is selecting the method
      let selectedMethod = null;
      if (text.includes("THPTQG") || text.includes("thpt") || text.includes("tốt nghiệp")) {
        selectedMethod = "THPTQG";
      } else if (text.includes("HSA") || text.includes("đgnl") || text.includes("đánh giá năng lực")) {
        selectedMethod = "HSA";
      } else if (text.includes("IELTS") || text.includes("tiếng Anh")) {
        selectedMethod = "IELTS";
      } else if (text.includes("TUYEN_THANG") || text.includes("tuyển thẳng")) {
        selectedMethod = "TUYEN_THANG";
      }

      if (selectedMethod) {
        tempFlow = selectedMethod;
        tempNextSlot = "fullname";
        thinkingLines.push(`- Thiết lập phương thức xét tuyển: ${selectedMethod}. Chuyển sang thu thập thông tin. Slot tiếp theo: fullname.`);
        responseText = `Hệ thống đã nhận phương thức xét tuyển: ${selectedMethod}.\nBây giờ chúng ta sẽ tiến hành điền hồ sơ. Vui lòng cung cấp Họ và tên đầy đủ của thí sinh:`;
      } else {
        thinkingLines.push("- Phản hồi phương thức không hợp lệ. Yêu cầu chọn lại.");
        responseText = "Phương thức xét tuyển bạn nhập chưa đúng. Xin vui lòng chọn 1 trong các nút dưới đây:";
        responseButtons = [
          { title: "Xét điểm thi THPTQG 📝", payload: "method_THPTQG" },
          { title: "Xét tuyển HSA (ĐGNL) ⚡", payload: "method_HSA" },
          { title: "Xét tuyển kết hợp IELTS 🇬🇧", payload: "method_IELTS" },
          { title: "Diện Tuyển thẳng 🥇", payload: "method_TUYEN_THANG" },
        ];
      }
    } else if (tempFlow !== null) {
      // We are in an active form loop!
      // Step A: Check for interruption (Rule 3: Xử lý xen ngang / Unhappy Path)
      const isInterruption =
        normalized.includes("học phí") ||
        normalized.includes("bao nhiêu tiền") ||
        normalized.includes("điểm chuẩn") ||
        normalized.includes("chuẩn năm ngoái") ||
        normalized.includes("học ngành gì") ||
        normalized.includes("học những gì") ||
        (normalized.includes("ngành") && (normalized.includes("như nào") || normalized.includes("thế nào")));

      // Simple heuristic: if expected slot is numeric and user typed letters, or it's a question, handle it
      if (isInterruption) {
        thinkingLines.push(`- PHÁT HIỆN HỎI XEN NGANG trong luồng ${tempFlow}. Slot hiện tại bị hoãn: ${tempNextSlot}`);

        let answer = "";
        if (normalized.includes("học phí")) {
          answer = "Học phí năm học 2025-2026 của trường Đại học Công nghệ (UET) dao động từ 34 - 40 triệu đồng/năm học tùy theo từng chương trình đào tạo chất lượng cao hay chuẩn.";
        } else if (normalized.includes("điểm chuẩn") || normalized.includes("điểm")) {
          answer = "Điểm chuẩn năm 2025 của các ngành học tại UET như sau:\n- Khoa học máy tính (CN1): 27.25\n- Kỹ thuật phần mềm (CN2): 26.85\n- Công nghệ thông tin (CN4): 26.50\n- An toàn thông tin (CN11): 26.10.";
        } else {
          answer = "Trường Đại học Công nghệ (UET) đào tạo các ngành kỹ thuật mũi nhọn như Khoa học Máy tính, Công nghệ Thông tin, An toàn Thông tin với môi trường học tập thực chiến, nhiều cơ hội việc làm lớn.";
        }

        responseText = `${answer}\n\nQuay lại hồ sơ của bạn, xin vui lòng cung cấp tiếp ${getSlotLabel(tempNextSlot).toLowerCase()}:`;

        // Return buttons matching the current slot if appropriate
        if (tempNextSlot === "chosen_major") responseButtons = majorButtons;
        if (tempNextSlot === "thptqg_block") responseButtons = blockButtons;
      } else {
        // Not an interruption: parse and store the expected slot
        thinkingLines.push(`- Xử lý giá trị cho slot đang yêu cầu: [${tempNextSlot}]`);
        let valAccepted = false;

        if (tempNextSlot === "fullname") {
          // Accept anything that isn't a command
          const cleanName = text.replace(/tên mình là|mình tên là|tên là|tên em là|tên|là/gi, "").trim();
          if (cleanName.length >= 2) {
            tempSlots.fullname = cleanName;
            valAccepted = true;
            thinkingLines.push(`  + Chấp nhận fullname = "${cleanName}"`);
          }
        } else if (tempNextSlot === "phone_number") {
          const matchedPhone = text.match(/\b(0[35789]\d{8})\b/);
          if (matchedPhone) {
            tempSlots.phone_number = matchedPhone[1];
            valAccepted = true;
            thinkingLines.push(`  + Chấp nhận phone_number = "${matchedPhone[1]}"`);
          } else {
            responseText = "Số điện thoại chưa hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (bắt đầu bằng số 0):";
            return { text: responseText, thinking: "Nhập số điện thoại không đúng định dạng. Yêu cầu nhập lại." };
          }
        } else if (tempNextSlot === "chosen_major") {
          if (matchedMajor) {
            tempSlots.chosen_major = matchedMajor;
            valAccepted = true;
            thinkingLines.push(`  + Chấp nhận chosen_major = "${matchedMajor}"`);
          } else {
            // Check if they input code directly: CN1, CN2, CN4, CN11
            const codes = {
              cn1: "Khoa học máy tính (CN1)",
              cn2: "Kỹ thuật phần mềm (CN2)",
              cn4: "Công nghệ thông tin (CN4)",
              cn11: "An toàn thông tin (CN11)",
            };
            const codeKey = normalized.replace(/\s+/g, "");
            if (codes[codeKey]) {
              tempSlots.chosen_major = codes[codeKey];
              valAccepted = true;
              thinkingLines.push(`  + Chấp nhận chosen_major (qua mã ngành) = "${codes[codeKey]}"`);
            } else {
              responseText = "Mã ngành hoặc tên ngành chưa chính xác. Vui lòng chọn một trong các ngành bên dưới:";
              responseButtons = majorButtons;
              return { text: responseText, buttons: responseButtons, thinking: "Chọn ngành không khớp CSDL. Hiển thị lại nút bấm chọn ngành." };
            }
          }
        } else if (tempNextSlot === "thptqg_block") {
          const upper = text.toUpperCase().trim();
          if (["A00", "A01", "D01", "D07"].includes(upper)) {
            tempSlots.thptqg_block = upper;
            valAccepted = true;
            thinkingLines.push(`  + Chấp nhận thptqg_block = "${upper}"`);
          } else {
            responseText = "Tổ hợp thi chưa đúng. Vui lòng chọn một trong các tổ hợp phổ biến dưới đây:";
            responseButtons = blockButtons;
            return { text: responseText, buttons: responseButtons, thinking: "Tổ hợp thi không đúng. Yêu cầu chọn tổ hợp hợp lệ." };
          }
        } else if (tempNextSlot === "thptqg_score") {
          const scMatch = text.match(/\b(\d+(\.\d+)?)\b/);
          if (scMatch) {
            const val = parseFloat(scMatch[1]);
            if (val >= 0 && val <= 30) {
              tempSlots.thptqg_score = val.toFixed(2);
              valAccepted = true;
              thinkingLines.push(`  + Chấp nhận thptqg_score = "${val.toFixed(2)}"`);
            }
          }
          if (!valAccepted) {
            responseText = "Điểm thi THPTQG không hợp lệ. Vui lòng nhập điểm số trong thang điểm 30 (ví dụ: 26.50):";
            return { text: responseText, thinking: "Điểm thi THPTQG sai định dạng hoặc ngoài phạm vi [0-30]. Yêu cầu nhập lại." };
          }
        } else if (tempNextSlot === "evidence_url") {
          if (text.includes(".") && text.length > 5) {
            tempSlots.evidence_url = text;
            valAccepted = true;
            thinkingLines.push(`  + Chấp nhận evidence_url = "${text}"`);
          } else {
            responseText = "Đường dẫn không hợp lệ. Vui lòng dán link URL minh chứng (ví dụ: https://drive.google.com/image.png):";
            return { text: responseText, thinking: "Đường dẫn minh chứng không hợp lệ. Yêu cầu nhập lại URL." };
          }
        } else if (tempNextSlot === "hsa_id") {
          if (text.length >= 3) {
            tempSlots.hsa_id = text;
            valAccepted = true;
            thinkingLines.push(`  + Chấp nhận hsa_id = "${text}"`);
          }
        } else if (tempNextSlot === "hsa_score") {
          const scMatch = text.match(/\b(\d+)\b/);
          if (scMatch) {
            const val = parseInt(scMatch[1], 10);
            if (val >= 0 && val <= 150) {
              tempSlots.hsa_score = val.toString();
              valAccepted = true;
              thinkingLines.push(`  + Chấp nhận hsa_score = "${val}"`);
            }
          }
          if (!valAccepted) {
            responseText = "Điểm thi HSA không hợp lệ. Vui lòng nhập điểm số trong khoảng từ 0 đến 150:";
            return { text: responseText, thinking: "Điểm HSA không hợp lệ. Yêu cầu nhập lại." };
          }
        } else if (tempNextSlot === "ielts_score") {
          const scMatch = text.match(/\b(\d+(\.\d+)?)\b/);
          if (scMatch) {
            const val = parseFloat(scMatch[1]);
            if (val >= 1.0 && val <= 9.0) {
              tempSlots.ielts_score = val.toFixed(1);
              valAccepted = true;
              thinkingLines.push(`  + Chấp nhận ielts_score = "${val.toFixed(1)}"`);
            }
          }
          if (!valAccepted) {
            responseText = "Điểm IELTS không hợp lệ. Vui lòng nhập điểm trong thang 9.0 (ví dụ: 7.0):";
            return { text: responseText, thinking: "Điểm IELTS ngoài phạm vi [1.0-9.0]. Yêu cầu nhập lại." };
          }
        } else if (tempNextSlot === "math_score") {
          const scMatch = text.match(/\b(\d+(\.\d+)?)\b/);
          if (scMatch) {
            const val = parseFloat(scMatch[1]);
            if (val >= 0 && val <= 10) {
              tempSlots.math_score = val.toFixed(2);
              valAccepted = true;
              thinkingLines.push(`  + Chấp nhận math_score = "${val.toFixed(2)}"`);
            }
          }
          if (!valAccepted) {
            responseText = "Điểm Toán không hợp lệ. Vui lòng nhập điểm số trong thang điểm 10 (ví dụ: 8.75):";
            return { text: responseText, thinking: "Điểm môn Toán không hợp lệ. Yêu cầu nhập lại." };
          }
        } else if (tempNextSlot === "award_name") {
          if (text.length > 3) {
            tempSlots.award_name = text;
            valAccepted = true;
            thinkingLines.push(`  + Chấp nhận award_name = "${text}"`);
          }
        }

        // Now evaluate what is the NEXT unfilled slot in the active flow
        const flowSlots = {
          THPTQG: ["fullname", "phone_number", "chosen_major", "thptqg_block", "thptqg_score", "evidence_url"],
          HSA: ["fullname", "phone_number", "chosen_major", "hsa_id", "hsa_score"],
          IELTS: ["fullname", "phone_number", "chosen_major", "ielts_score", "math_score"],
          TUYEN_THANG: ["fullname", "phone_number", "chosen_major", "award_name"],
        };

        const activeSlots = flowSlots[tempFlow] || [];
        const nextUnfilled = activeSlots.find((s) => tempSlots[s] === null);

        if (nextUnfilled) {
          tempNextSlot = nextUnfilled;
          thinkingLines.push(`- Cập nhật slot tiếp theo cần thu thập: ${tempNextSlot}`);
          responseText = getSlotQuestion(tempNextSlot);

          if (tempNextSlot === "chosen_major") responseButtons = majorButtons;
          if (tempNextSlot === "thptqg_block") responseButtons = blockButtons;
        } else {
          // ALL SLOTS FILLED! CALL ACTION (Rule 4: Định dạng Output cuối cùng)
          const actionName = `action_submit_${tempFlow.toLowerCase()}_form`;
          thinkingLines.push(`- TẤT CẢ CÁC SLOT ĐÃ ĐẦY. Kích hoạt kết quả cuối cùng.`);
          thinkingLines.push(`- Gọi hàm Backend: ${actionName}`);

          const summaryData = {};
          activeSlots.forEach((s) => {
            summaryData[s] = tempSlots[s];
          });

          // Compute benchmark matching for friendly info
          let benchmarkMsg = "";
          const benchmarks = {
            "Khoa học máy tính (CN1)": 27.25,
            "Kỹ thuật phần mềm (CN2)": 26.85,
            "Công nghệ thông tin (CN4)": 26.50,
            "An toàn thông tin (CN11)": 26.10,
          };
          const majorName = tempSlots.chosen_major;
          const userScore = parseFloat(tempSlots.thptqg_score || tempSlots.hsa_score || 0);

          if (tempFlow === "THPTQG" && benchmarks[majorName]) {
            const cut = benchmarks[majorName];
            if (userScore >= cut) {
              benchmarkMsg = `\n\n🎉 Đánh giá nhanh: Điểm của bạn (${userScore}) ĐẠT trên mức điểm chuẩn năm 2025 (${cut}). Cơ hội đỗ của bạn rất cao!`;
            } else {
              benchmarkMsg = `\n\n⚖️ Đánh giá nhanh: Điểm của bạn (${userScore}) dưới mức điểm chuẩn năm 2025 (${cut}). Ban tuyển sinh sẽ tư vấn thêm phương án dự phòng cho bạn.`;
            }
          }

          responseText = `Cảm ơn bạn **${tempSlots.fullname}**! Hồ sơ xét tuyển theo phương thức **${tempFlow}** của bạn đã được lưu nhận thành công vào hệ thống.${benchmarkMsg}\n\nMã hồ sơ của bạn là **#UET-${Math.floor(100000 + Math.random() * 900000)}**.\n\nThông tin chi tiết đã gửi:\n- Số điện thoại: ${tempSlots.phone_number}\n- Ngành đăng ký: ${tempSlots.chosen_major}\n` +
            activeSlots
              .slice(3)
              .map((s) => `- ${getSlotLabel(s)}: ${tempSlots[s]}`)
              .join("\n") +
            `\n\n[CALL_ACTION: ${actionName}]\n` +
            JSON.stringify(summaryData, null, 2);

          callAction = {
            action: actionName,
            data: summaryData,
          };

          // Save to Mock DB Submissions
          const newSubmission = {
            id: `UET-${Math.floor(100000 + Math.random() * 900000)}`,
            fullname: tempSlots.fullname,
            phone_number: tempSlots.phone_number,
            chosen_major: tempSlots.chosen_major,
            admission_method: tempFlow,
            details: summaryData,
            created_at: new Date().toLocaleString("vi-VN"),
          };
          setSubmissions((prev) => [newSubmission, ...prev]);

          // Clear states
          tempFlow = null;
          tempNextSlot = null;
          tempSlots = INITIAL_SLOTS;
        }
      }
    } else {
      // General QA (No active flow)
      thinkingLines.push("- Phản hồi câu hỏi chung ngoài luồng đăng ký.");
      if (normalized.includes("học phí")) {
        responseText = "Học phí tại Trường Đại học Công nghệ (UET) năm học 2025-2026 dao động từ 34 - 40 triệu đồng/năm học tùy theo chương trình chuẩn hay đặc thù. Bạn có muốn đăng ký xét tuyển thử không?";
        responseButtons = [{ title: "Đăng ký nguyện vọng 📝", payload: "dang_ky_nguyen_vong" }];
      } else if (normalized.includes("khoa học máy tính") || normalized.includes("cn1")) {
        responseText = "Ngành Khoa học máy tính (CN1) học về AI, Khoa học dữ liệu, Công nghệ phần mềm. Đây là ngành đào tạo mũi nhọn của UET. Điểm chuẩn năm 2025 là 27.25. Bạn có muốn đăng ký xét tuyển trực tuyến không?";
        responseButtons = [
          { title: "Đăng ký nguyện vọng 📝", payload: "dang_ky_nguyen_vong" },
          { title: "Tìm hiểu ngành khác 🔍", payload: "hoi_thong_tin_nganh" },
        ];
      } else if (normalized.includes("kỹ thuật phần mềm") || normalized.includes("cn2")) {
        responseText = "Ngành Kỹ thuật phần mềm (CN2) học sâu về quy trình phát triển phần mềm, kiểm thử và thiết kế kiến trúc phần mềm chuyên nghiệp. Điểm chuẩn 2025: 26.85. Bạn muốn đăng ký nguyện vọng vào ngành này chứ?";
        responseButtons = [
          { title: "Đăng ký nguyện vọng 📝", payload: "dang_ky_nguyen_vong" },
          { title: "Tìm hiểu ngành khác 🔍", payload: "hoi_thong_tin_nganh" },
        ];
      } else if (normalized.includes("công nghệ thông tin") || normalized.includes("cn4")) {
        responseText = "Ngành Công nghệ thông tin (CN4) đào tạo về quản trị mạng, hạ tầng CNTT, phát triển web/app di động. Điểm chuẩn 2025: 26.50. Ngành có chỉ tiêu tuyển sinh lớn nhất UET.";
        responseButtons = [{ title: "Đăng ký nguyện vọng 📝", payload: "dang_ky_nguyen_vong" }];
      } else if (normalized.includes("an toàn thông tin") || normalized.includes("cn11")) {
        responseText = "Ngành An toàn thông tin (CN11) học về mật mã học, bảo mật hệ thống mạng, an ninh mạng, chống mã độc hại. Điểm chuẩn 2025: 26.10.";
        responseButtons = [{ title: "Đăng ký nguyện vọng 📝", payload: "dang_ky_nguyen_vong" }];
      } else {
        responseText = "Chào bạn! Mình là Trợ lý tuyển sinh UET. Mình có thể giúp gì cho bạn? Để bắt đầu làm thủ tục đăng ký nguyện vọng trực tuyến, bạn hãy bấm chọn nút bên dưới nhé!";
        responseButtons = [
          { title: "Tìm hiểu ngành học 📚", payload: "hoi_thong_tin_nganh" },
          { title: "Đăng ký nguyện vọng 📝", payload: "dang_ky_nguyen_vong" },
        ];
      }
    }

    // Update state variables
    setSlots(tempSlots);
    setCurrentFlow(tempFlow);
    setNextSlotToCollect(tempNextSlot);

    return {
      text: responseText,
      buttons: responseButtons,
      thinking: thinkingLines.join("\n"),
      callAction,
    };
  }, [slots, currentFlow, nextSlotToCollect]);

  // Live call to Google Gemini API
  const runGeminiAPI = async (userText, history) => {
    if (!apiKey) {
      throw new Error("Vui lòng cấu hình Gemini API Key ở bảng bên trái để gọi mô hình thực.");
    }

    // Construct request history formatted for Gemini
    const contents = [];

    // Filter and format history
    history.forEach((msg) => {
      if (msg.text) {
        contents.push({
          role: msg.from === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      }
    });

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: userText }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: contents,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData?.error?.message || "Không thể kết nối API Gemini.";
      throw new Error(errMsg);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse thinking & response from Gemini text (heuristic or regex)
    // If output matches Agent Thinking format
    let thinking = "Thực hiện cuộc gọi trực tiếp đến mô hình Gemini 1.5 Flash bằng System Prompt đã cấu hình.";
    let cleanText = candidateText;

    const thinkingRegex = /Agent Thinking:\s*([\s\S]*?)\s*Response:\s*([\s\S]*)/i;
    const match = candidateText.match(thinkingRegex);

    if (match) {
      thinking = match[1].trim();
      cleanText = match[2].trim();
    } else {
      // Fallback: search for lines
      if (candidateText.includes("Agent Thinking:")) {
        const parts = candidateText.split("Response:");
        if (parts.length > 1) {
          thinking = parts[0].replace("Agent Thinking:", "").trim();
          cleanText = parts.slice(1).join("Response:").trim();
        }
      }
    }

    // Try parsing CALL_ACTION from text
    let callAction = null;
    const callActionRegex = /\[CALL_ACTION:\s*(\w+)\]\s*(\{[\s\S]*?\})/i;
    const actionMatch = cleanText.match(callActionRegex);

    if (actionMatch) {
      try {
        const actionName = actionMatch[1];
        const actionData = JSON.parse(actionMatch[2]);
        callAction = {
          action: actionName,
          data: actionData,
        };

        // Add to Mock DB Submissions
        const newSubmission = {
          id: `UET-${Math.floor(100000 + Math.random() * 900000)}`,
          fullname: actionData.fullname || "N/A",
          phone_number: actionData.phone_number || "N/A",
          chosen_major: actionData.chosen_major || "N/A",
          admission_method: actionName.replace("action_submit_", "").replace("_form", "").toUpperCase(),
          details: actionData,
          created_at: new Date().toLocaleString("vi-VN"),
        };
        setSubmissions((prev) => [newSubmission, ...prev]);

        // Reset local slots just for visual sync
        setSlots(INITIAL_SLOTS);
        setCurrentFlow(null);
        setNextSlotToCollect(null);
      } catch (e) {
        console.warn("Failed to parse JSON inside CALL_ACTION:", e);
      }
    } else {
      // Try to parse slots from Gemini response implicitly using local heuristics for visualization
      const tempSlots = { ...slots };
      let localStateChanged = false;

      // Extract phone
      const phoneMatch = cleanText.match(/\b(0[35789]\d{8})\b/) || userText.match(/\b(0[35789]\d{8})\b/);
      if (phoneMatch && !tempSlots.phone_number) {
        tempSlots.phone_number = phoneMatch[1];
        localStateChanged = true;
      }

      // Sync local flow based on bot words
      let nextFlow = currentFlow;
      let nextSlot = nextSlotToCollect;

      if (cleanText.includes("phương thức") && cleanText.includes("THPTQG")) {
        nextFlow = "THPTQG";
        nextSlot = "fullname";
        localStateChanged = true;
      } else if (cleanText.includes("phương thức") && cleanText.includes("HSA")) {
        nextFlow = "HSA";
        nextSlot = "fullname";
        localStateChanged = true;
      } else if (cleanText.includes("phương thức") && cleanText.includes("IELTS")) {
        nextFlow = "IELTS";
        nextSlot = "fullname";
        localStateChanged = true;
      } else if (cleanText.includes("phương thức") && cleanText.includes("tuyển thẳng")) {
        nextFlow = "TUYEN_THANG";
        nextSlot = "fullname";
        localStateChanged = true;
      }

      if (localStateChanged) {
        setSlots(tempSlots);
        setCurrentFlow(nextFlow);
        setNextSlotToCollect(nextSlot);
      }
    }

    return {
      text: cleanText,
      thinking: thinking,
      buttons: cleanText.includes("phương thức xét tuyển")
        ? [
          { title: "Xét điểm thi THPTQG 📝", payload: "method_THPTQG" },
          { title: "Xét tuyển HSA (ĐGNL) ⚡", payload: "method_HSA" },
          { title: "Xét tuyển kết hợp IELTS 🇬🇧", payload: "method_IELTS" },
          { title: "Diện Tuyển thẳng 🥇", payload: "method_TUYEN_THANG" },
        ]
        : cleanText.toLowerCase().includes("ngành nào")
          ? majorButtons
          : [],
      callAction,
    };
  };

  const runRasaAPI = async (userText, payloadValue) => {
    const senderId = getSenderId();
    const outgoingMessage = payloadValue || userText || "";

    const response = await fetch("http://localhost:5005/webhooks/rest/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        message: outgoingMessage,
      }),
    });

    if (!response.ok) {
      throw new Error("Không thể kết nối đến Rasa NLU Server. Vui lòng kiểm tra lại tiến trình Rasa.");
    }

    const rasaMessages = await response.json();
    const textParts = rasaMessages.map((m) => m?.text).filter(Boolean);
    const cleanText = textParts.join("\n") || "";
    const buttons = rasaMessages.find((m) => Array.isArray(m?.buttons) && m.buttons.length > 0)?.buttons || [];

    // Sync slots by calling Rasa tracker endpoint
    try {
      const trackerResp = await fetch(`http://localhost:5005/conversations/${encodeURIComponent(senderId)}/tracker`);
      if (trackerResp.ok) {
        const tracker = await trackerResp.json();
        const trackerSlots = tracker?.slots || {};
        const activeLoopName = tracker?.active_loop?.name;

        // Map Rasa slots to local slot visualizer state
        const updatedSlots = { ...INITIAL_SLOTS };
        Object.keys(INITIAL_SLOTS).forEach((key) => {
          if (trackerSlots[key] !== undefined && trackerSlots[key] !== null) {
            updatedSlots[key] = trackerSlots[key];
          }
        });
        setSlots(updatedSlots);

        // Map active loop name to currentFlow
        let flow = null;
        if (activeLoopName === "thptqg_form") flow = "THPTQG";
        else if (activeLoopName === "hsa_form") flow = "HSA";
        else if (activeLoopName === "ielts_form") flow = "IELTS";
        else if (activeLoopName === "direct_form") flow = "TUYEN_THANG";
        setCurrentFlow(flow);

        // Map requested_slot to nextSlotToCollect
        setNextSlotToCollect(trackerSlots["requested_slot"] || null);
      }
    } catch (trackerErr) {
      console.warn("Failed to sync slots with Rasa tracker:", trackerErr);
    }

    // Detect CALL_ACTION and log to mock DB
    let callAction = null;
    const callActionRegex = /\[CALL_ACTION:\s*(\w+)\]\s*(\{[\s\S]*?\})/i;
    const actionMatch = cleanText.match(callActionRegex);

    if (actionMatch) {
      try {
        const actionName = actionMatch[1];
        const actionData = JSON.parse(actionMatch[2]);
        callAction = {
          action: actionName,
          data: actionData,
        };

        // Add to Mock DB Submissions
        const newSubmission = {
          id: `UET-${Math.floor(100000 + Math.random() * 900000)}`,
          fullname: actionData.fullname || "N/A",
          phone_number: actionData.phone_number || "N/A",
          chosen_major: actionData.chosen_major || "N/A",
          admission_method: actionName.replace("action_submit_", "").replace("_form", "").toUpperCase(),
          details: actionData,
          created_at: new Date().toLocaleString("vi-VN"),
        };
        setSubmissions((prev) => [newSubmission, ...prev]);

        // Reset visual slots
        setSlots(INITIAL_SLOTS);
        setCurrentFlow(null);
        setNextSlotToCollect(null);
      } catch (e) {
        console.warn("Failed to parse JSON inside CALL_ACTION:", e);
      }
    }

    return {
      text: cleanText,
      buttons: buttons,
      thinking: `Gửi thông tin đến Rasa NLU Server. Nhận diện phản hồi từ Custom Action Server.`,
      callAction,
    };
  };

  const sendMessage = useCallback(
    async ({ text, payloadValue }) => {
      const trimmed = (text || "").trim();

      if (!trimmed || isSending) {
        return;
      }

      setIsSending(true);
      setError("");

      // Append user message to UI
      const userMsg = createMessage({ from: "user", text: trimmed });
      setMessages((prev) => [...prev, userMsg]);

      // Delay to simulate thinking animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      try {
        let botResponse = null;

        if (chatEngine === "local") {
          // Use Rule-based Local Prompt Simulator
          botResponse = runLocalSimulator(trimmed, payloadValue);
        } else if (chatEngine === "rasa") {
          // Call Real Rasa Webhook Server
          botResponse = await runRasaAPI(trimmed, payloadValue);
        } else {
          // Call Real Gemini API
          botResponse = await runGeminiAPI(trimmed, messages);
        }

        const botMsg = createMessage({
          from: "bot",
          text: botResponse.text,
          buttons: botResponse.buttons,
          thinking: botResponse.thinking,
          callAction: botResponse.callAction,
        });

        setMessages((prev) => [...prev, botMsg]);
      } catch (err) {
        setError(err.message || "Đã xảy ra lỗi khi kết nối mô hình AI.");

        // Push warning message
        setMessages((prev) => [
          ...prev,
          createMessage({
            from: "bot",
            text: `⚠️ Lỗi: ${err.message || "Không thể kết nối. Vui lòng kiểm tra API Key hoặc cổng Rasa 5005."}`,
            thinking: "Gặp sự cố khi gọi API Engine. Kiểm tra cấu hình và trạng thái server.",
          }),
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [messages, isSending, chatEngine, runLocalSimulator, getSenderId, apiKey, systemPrompt]
  );

  const sendText = useCallback((text) => sendMessage({ text, payloadValue: null }), [
    sendMessage,
  ]);

  const sendPayload = useCallback(
    (button) => {
      if (!button) {
        return;
      }
      sendMessage({
        text: button.title || "Select",
        payloadValue: button.payload || null,
      });
    },
    [sendMessage]
  );

  const clearSubmissions = useCallback(() => {
    setSubmissions([]);
  }, []);

  return {
    messages,
    isSending,
    apiStatus: chatEngine === "local" ? "online" : chatEngine === "rasa" ? rasaStatus : apiKey ? "online" : "unknown",
    error,
    newChat,
    startChat,
    sendText,
    sendPayload,

    // Custom Agent state
    slots,
    currentFlow,
    nextSlotToCollect,
    submissions,
    clearSubmissions,
    systemPrompt,
    setSystemPrompt,
    apiKey,
    setApiKey,
    chatEngine,
    setChatEngine,
    useLocalSimulator,
    setUseLocalSimulator,
    getSlotLabel,
  };

}
