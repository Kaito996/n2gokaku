// data.js
// Module tạo lịch trình học JLPT N2 trong 128 ngày

const EXAM_DATE = '2026-12-06';
const START_DATE = '2026-08-01';

const PHASES = {
  PHASE_1: { id: 'PHASE_1', title: 'THANH TOÁN N3 - BƠM MÁU N2' },
  PHASE_2: { id: 'PHASE_2', title: 'VƯỢT VŨ MÔN' },
  PHASE_3: { id: 'PHASE_3', title: 'TĂNG TỐC & PHẢN XẠ' },
  PHASE_4: { id: 'PHASE_4', title: 'THÁNG SINH TỒN' },
  GOLDEN_WEEK: { id: 'GOLDEN_WEEK', title: 'TUẦN VÀNG (GOLDEN WEEK)' }
};

const DAY_OF_WEEK_JP = {
  0: '日曜日', // Sunday
  1: '月曜日', // Monday
  2: '火曜日', // Tuesday
  3: '水曜日', // Wednesday
  4: '木曜日', // Thursday
  5: '金曜日', // Friday
  6: '土曜日'  // Saturday
};

const DAY_OF_WEEK_EN = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday'
};

function generatePlan() {
  const plan = [];
  const startDate = new Date(START_DATE);
  
  for (let i = 0; i < 128; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const day = i + 1;
    const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const month = currentDate.getMonth() + 1; // 1-12 (August is 8)
    const dayOfWeekNum = currentDate.getDay(); // 0-6
    const week = Math.floor(i / 7) + 1;
    
    let phase = '';
    let phaseTitle = '';
    
    // Xác định Phase dựa trên tháng (theo format của đề bài)
    if (month === 8) {
      phase = 'PHASE_1';
      phaseTitle = PHASES.PHASE_1.title;
    } else if (month === 9) {
      phase = 'PHASE_2';
      phaseTitle = PHASES.PHASE_2.title;
    } else if (month === 10) {
      phase = 'PHASE_3';
      phaseTitle = PHASES.PHASE_3.title;
    } else if (month === 11) {
      phase = 'PHASE_4';
      phaseTitle = PHASES.PHASE_4.title;
    } else if (month === 12) {
      phase = 'GOLDEN_WEEK';
      phaseTitle = PHASES.GOLDEN_WEEK.title;
    }
    
    const dayPlan = {
      day: day,
      date: dateStr,
      week: week,
      month: month,
      dayOfWeek: DAY_OF_WEEK_EN[dayOfWeekNum],
      dayOfWeekJP: DAY_OF_WEEK_JP[dayOfWeekNum],
      phase: phase,
      phaseTitle: phaseTitle,
      dayType: 'study', // default, ghi đè sau
      tasks: []
    };
    
    // Gắn Tasks dựa trên Phase và Thứ
    if (phase === 'PHASE_1') {
      assignPhase1Tasks(dayPlan, dayOfWeekNum, day);
    } else if (phase === 'PHASE_2') {
      assignPhase2Tasks(dayPlan, dayOfWeekNum, day);
    } else if (phase === 'PHASE_3') {
      assignPhase3Tasks(dayPlan, dayOfWeekNum, day);
    } else if (phase === 'PHASE_4') {
      assignPhase4Tasks(dayPlan, dayOfWeekNum, day);
    } else if (phase === 'GOLDEN_WEEK') {
      assignGoldenWeekTasks(dayPlan, dayOfWeekNum, day, dateStr);
    }
    
    plan.push(dayPlan);
  }
  
  return plan;
}

function assignPhase1Tasks(dayPlan, dayOfWeekNum, day) {
  if (dayOfWeekNum >= 1 && dayOfWeekNum <= 5) {
    dayPlan.dayType = 'study';
    dayPlan.tasks = [
      { id: `d${day}-kanji`, timeSlot: '08:00 - 09:30', session: 'morning', title: 'Kanji & Từ vựng', description: 'Nạp 15 Kanji N2 + 30 Từ vựng N2 mới. Ôn Flashcard cũ.', category: 'kanji', icon: '📝' },
      { id: `d${day}-grammar`, timeSlot: '09:45 - 11:30', session: 'morning', title: 'Ngữ pháp & Đọc hiểu', description: 'Học 3 cấu trúc Ngữ pháp N3. Làm 2 bài Đọc hiểu N3. Dịch kỹ, phân tích câu dài.', category: 'grammar', icon: '📖' },
      { id: `d${day}-listening`, timeSlot: '14:00 - 15:30', session: 'afternoon', title: 'Nghe dài N3', description: 'Nháp từ khóa, bóc phốt bẫy, chép chính tả câu chứa đáp án.', category: 'listening', icon: '🎧' },
      { id: `d${day}-shadowing`, timeSlot: '15:45 - 17:00', session: 'afternoon', title: 'Phản xạ nhanh N3', description: 'Chép chính tả 100% 5-10 câu. Đứng dậy, đi lại và Shadowing nhập vai.', category: 'shadowing', icon: '🎤' },
      { id: `d${day}-passive`, timeSlot: '20:00 - 21:30', session: 'evening', title: 'Tắm ngôn ngữ', description: 'Xem Anime slice-of-life có phụ đề JP (Shirokuma Café, Nichijou). Ghi nhanh từ mới.', category: 'passive', icon: '🎬' }
    ];
  } else if (dayOfWeekNum === 6) {
    dayPlan.dayType = 'review';
    dayPlan.tasks = [
      { id: `d${day}-review-1`, timeSlot: '08:00 - 11:30', session: 'morning', title: 'Ôn tập Kanji & Từ vựng', description: 'Ôn lại toàn bộ 75 Kanji và 150 Từ vựng N2 đã học trong tuần.', category: 'review', icon: '📝' },
      { id: `d${day}-review-2`, timeSlot: '14:00 - 17:00', session: 'afternoon', title: 'Ôn nghe', description: 'Nghe lại (không nhìn kịch bản) tất cả file audio đã Shadowing trong tuần.', category: 'review', icon: '🎧' }
    ];
  } else if (dayOfWeekNum === 0) {
    dayPlan.dayType = 'test';
    dayPlan.tasks = [
      { id: `d${day}-test`, timeSlot: '09:00 - 11:00', session: 'morning', title: 'Mini Test N3', description: 'Làm 1 Mini Test N3 (Nghe + Đọc) để đo lường độ nhạy của tai.', category: 'test', icon: '📄' }
    ];
  }
}

function assignPhase2Tasks(dayPlan, dayOfWeekNum, day) {
  if (dayOfWeekNum >= 1 && dayOfWeekNum <= 5) {
    dayPlan.dayType = 'study';
    dayPlan.tasks = [
      { id: `d${day}-kanji`, timeSlot: '08:00 - 09:30', session: 'morning', title: 'Kanji & Từ vựng', description: 'Nạp 10 Kanji N2 + 25 Từ vựng N2 mới. Ôn Flashcard (lượng review tăng).', category: 'kanji', icon: '📝' },
      { id: `d${day}-grammar`, timeSlot: '09:45 - 11:30', session: 'morning', title: 'Ngữ pháp & Đọc hiểu N2', description: 'Học 4-5 cấu trúc Ngữ pháp N2. Làm 2 bài Đọc hiểu N2. Dịch kỹ từng câu, phân tích chủ ngữ/vị ngữ.', category: 'grammar', icon: '📖' },
      { id: `d${day}-listening`, timeSlot: '14:00 - 15:30', session: 'afternoon', title: 'Nghe N2 Mondai 4', description: 'Shadowing Mondai 4 N2 để quen với từ lóng và cụm từ học thuật.', category: 'listening', icon: '🎧' },
      { id: `d${day}-shadowing`, timeSlot: '15:45 - 17:00', session: 'afternoon', title: 'Nghe N2 Mondai 1', description: 'Tập nháp tốc độ cao. Chép chính tả cục bộ.', category: 'shadowing', icon: '🎤' },
      { id: `d${day}-passive`, timeSlot: '20:00 - 21:30', session: 'evening', title: 'NHK News', description: 'Nghe NHK News Web Easy → nâng lên NHK Radio News. Tập bắt chủ đề chính.', category: 'passive', icon: '📻' }
    ];
  } else if (dayOfWeekNum === 6) {
    dayPlan.dayType = 'error_analysis';
    dayPlan.tasks = [
      { id: `d${day}-review-1`, timeSlot: '08:00 - 11:30', session: 'morning', title: 'Phân tích lỗi sai', description: 'Ghi chú bẫy Đọc hiểu N2 và từ vựng đồng âm/lướt âm N2 làm sai trong tuần.', category: 'review', icon: '📝' },
      { id: `d${day}-review-2`, timeSlot: '14:00 - 17:00', session: 'afternoon', title: 'Flashcard review', description: 'Lặp lại toàn bộ Flashcard từ vựng. Gom nhóm từ dễ nhầm.', category: 'review', icon: '📝' }
    ];
  } else if (dayOfWeekNum === 0) {
    dayPlan.dayType = 'rest';
    dayPlan.tasks = [];
  }
}

function assignPhase3Tasks(dayPlan, dayOfWeekNum, day) {
  if (dayOfWeekNum >= 1 && dayOfWeekNum <= 5) {
    dayPlan.dayType = 'study';
    dayPlan.tasks = [
      { id: `d${day}-vocabulary`, timeSlot: '08:00 - 09:30', session: 'morning', title: 'Từ đồng/trái nghĩa', description: 'Học nhóm từ đồng nghĩa/trái nghĩa N2. 5 Kanji + 15 Từ vựng.', category: 'vocabulary', icon: '📝' },
      { id: `d${day}-reading`, timeSlot: '09:45 - 11:30', session: 'morning', title: 'Đọc hiểu tốc độ', description: 'Ép thời gian: Đoản văn 3 phút, Trung văn 5 phút. Chỉ tìm đoạn chứa đáp án.', category: 'reading', icon: '⏱️' },
      { id: `d${day}-listening`, timeSlot: '14:00 - 15:30', session: 'afternoon', title: 'Băm nát Mondai 2,3 N2', description: 'Chép chính tả cục bộ cho những câu chốt hạ.', category: 'listening', icon: '🎧' },
      { id: `d${day}-shadowing`, timeSlot: '15:45 - 17:00', session: 'afternoon', title: 'Shadowing 1.0x', description: 'Shadowing nhắm mắt tốc độ 1.0x toàn bộ.', category: 'shadowing', icon: '🎤' },
      { id: `d${day}-passive`, timeSlot: '20:00 - 21:30', session: 'evening', title: 'YouTube N2', description: 'Xem video giải đề N2 (日本語の森). Học chiến thuật từ người khác.', category: 'passive', icon: '🎬' }
    ];
  } else if (dayOfWeekNum === 6) {
    dayPlan.dayType = 'review';
    dayPlan.tasks = [
      { id: `d${day}-review-1`, timeSlot: '08:00 - 11:30', session: 'morning', title: 'Gom nhóm Ngữ pháp', description: 'Gom nhóm cấu trúc Ngữ pháp N2 dễ nhầm lẫn. So sánh, lập bảng.', category: 'review', icon: '📖' },
      { id: `d${day}-review-2`, timeSlot: '14:00 - 17:00', session: 'afternoon', title: 'Shadowing marathon', description: 'Shadowing liên tục 15 câu Mondai 4 N2 trong 30 phút. Ôn Flashcard.', category: 'review', icon: '🎤' }
    ];
  } else if (dayOfWeekNum === 0) {
    dayPlan.dayType = 'rest';
    dayPlan.tasks = [];
  }
}

function assignPhase4Tasks(dayPlan, dayOfWeekNum, day) {
  if (dayOfWeekNum === 1 || dayOfWeekNum === 3 || dayOfWeekNum === 5) {
    dayPlan.dayType = 'mock_exam';
    dayPlan.tasks = [
      { id: `d${day}-test-1`, timeSlot: '08:00 - 09:45', session: 'morning', title: 'Thi thử: Từ vựng/Ngữ pháp/Đọc hiểu', description: 'Bấm giờ nghiêm ngặt 105 phút. KHÔNG được dừng.', category: 'test', icon: '📄' },
      { id: `d${day}-test-2`, timeSlot: '10:00 - 10:50', session: 'morning', title: 'Thi thử: Nghe hiểu', description: '50 phút không dừng audio. Mô phỏng phòng thi thật.', category: 'test', icon: '🎧' },
      { id: `d${day}-rest`, timeSlot: '14:00 - 17:00', session: 'afternoon', title: 'Nghỉ nhẹ', description: 'Nghỉ ngơi nhẹ nhàng. Đi dạo, uống trà.', category: 'rest', icon: '😴' }
    ];
  } else if (dayOfWeekNum === 2 || dayOfWeekNum === 4 || dayOfWeekNum === 6) {
    dayPlan.dayType = 'error_analysis';
    dayPlan.tasks = [
      { id: `d${day}-review-1`, timeSlot: '08:00 - 11:30', session: 'morning', title: 'Mổ xẻ lỗi sai (Đọc)', description: 'Tra lại Từ vựng/Kanji sai. Phân tích bẫy Đọc hiểu: tại sao A sai, B đúng.', category: 'review', icon: '🔍' },
      { id: `d${day}-review-2`, timeSlot: '14:00 - 17:00', session: 'afternoon', title: 'Mổ xẻ lỗi sai (Nghe)', description: 'Bóc băng phần Nghe. Chép chính tả cục bộ và Shadowing câu đánh lừa.', category: 'shadowing', icon: '🎤' }
    ];
  } else if (dayOfWeekNum === 0) {
    dayPlan.dayType = 'rest';
    dayPlan.tasks = [];
  }
}

function assignGoldenWeekTasks(dayPlan, dayOfWeekNum, day, dateStr) {
  dayPlan.dayType = 'golden';
  if (dateStr === '2026-12-01') {
    dayPlan.tasks = [{ id: `d${day}-review`, timeSlot: 'Cả ngày', session: 'morning', title: 'Ôn nhẹ', description: 'Ôn nhẹ Flashcard + Nghe thụ động. KHÔNG làm đề mới.', category: 'review', icon: '📝' }];
  } else if (dateStr === '2026-12-02') {
    dayPlan.tasks = [{ id: `d${day}-review`, timeSlot: 'Cả ngày', session: 'morning', title: 'Xem lỗi sai', description: 'Lướt lại sổ ghi chú lỗi sai (chỉ đọc, không giải).', category: 'review', icon: '📖' }];
  } else if (dateStr === '2026-12-03') {
    dayPlan.tasks = [{ id: `d${day}-shadowing`, timeSlot: 'Cả ngày', session: 'morning', title: 'Shadowing & Chuẩn bị', description: 'Shadowing nhẹ 10-15 câu yêu thích. Chuẩn bị đồ thi.', category: 'shadowing', icon: '🎤' }];
  } else if (dateStr === '2026-12-04') {
    dayPlan.tasks = [];
    dayPlan.dayType = 'rest';
  } else if (dateStr === '2026-12-05') {
    dayPlan.tasks = [{ id: `d${day}-passive`, timeSlot: 'Tối', session: 'evening', title: 'Thư giãn', description: 'Nghe 1 Podcast tiếng Nhật nhẹ nhàng. Ngủ trước 22:00.', category: 'passive', icon: '🎧' }];
  } else if (dateStr === '2026-12-06') {
    dayPlan.tasks = [{ id: `d${day}-exam`, timeSlot: 'Cả ngày', session: 'morning', title: 'NGÀY THI JLPT N2', description: 'Chiến đấu hết mình! Cố lên!', category: 'test', icon: '🎯' }];
  }
}

window.N2Data = {
  generatePlan,
  PHASES,
  EXAM_DATE,
  START_DATE
};
