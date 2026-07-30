// utils.js
// Module chứa các hàm tiện ích, tính toán ngày tháng và thông điệp động lực/chửi mắng

window.N2Utils = {
  // --- DATE HELPERS ---
  formatDateVN(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },
  
  formatDateFull(dateStr) {
    const dateVN = this.formatDateVN(dateStr);
    const dayOfWeek = this.getDayOfWeekVN(dateStr);
    return `${dayOfWeek}, ${dateVN}`;
  },
  
  getDayOfWeekVN(dateStr) {
    const day = new Date(dateStr).getDay();
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[day];
  },
  
  isToday(dateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr === todayStr;
  },
  
  isPast(dateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr < todayStr;
  },
  
  isFuture(dateStr) {
    const todayStr = new Date().toISOString().split('T')[0];
    return dateStr > todayStr;
  },
  
  daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },
  
  // --- COUNTDOWN ---
  getCountdown() {
    // Sử dụng EXAM_DATE từ N2Data nếu có
    const examDateStr = window.N2Data ? window.N2Data.EXAM_DATE : '2026-12-06';
    const examDate = new Date(`${examDateStr}T09:00:00+09:00`); // Giờ thi ước tính
    const now = new Date();
    
    const diff = examDate - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    
    return { days, hours, minutes };
  },
  
  // --- SCOLDING MESSAGES (HARSH BUT MOTIVATING) ---
  getScoldingMessage(consecutiveMissed, streakBroken, totalMissed) {
    const { days } = this.getCountdown();
    const scoldingList1 = [
      'Hôm qua bạn bỏ học! 1 ngày không học = 3 ngày thụt lùi. Hôm nay phải gỡ lại!',
      'Này, hôm qua lười đúng không? Tiền đăng ký thi không phải lá mít đâu, VÀO BÀN NGAY!',
      'Hôm qua nghỉ ngơi đủ chưa? Hôm nay x2 công suất lên!',
      `Chỉ còn ${days} ngày nữa thôi. Bỏ 1 ngày là mất 1 cơ hội đỗ. Tỉnh ngộ đi!`
    ];
    
    const scoldingList2 = [
      'ĐÃ 2 NGÀY BỎ HỌC! Tiền đăng ký thi JLPT muốn đổ sông đổ biển hả?!',
      '2 ngày rồi không đụng vào sách! Bạn định để người ta lấy hết điểm của bạn sao?',
      `Còn đúng ${days} ngày mà dám nghỉ 2 ngày liên tục? Đứng dậy học ngay!`,
      'Người ta học lòi mắt, bạn thì nằm bấm điện thoại 2 ngày qua. Nhục chưa? Học đi!'
    ];
    
    const scoldingList3 = [
      '3 NGÀY KHÔNG HỌC! Người ta cày ngày cày đêm, còn bạn thì nằm ỳ. N2 không dành cho kẻ lười!',
      'Bạn đang thi xem ai trượt N2 nhanh nhất à? Đã 3 ngày rồi đấy!',
      'Thức tỉnh đi! 3 ngày bỏ phí = rơi vào hố sâu rồi. Còn muốn tờ N2 thì phải cố gấp trăm lần!',
      `Đồng hồ chỉ còn ${days} ngày, bạn định để nước đến mũi mới nhảy à? HỌC!`
    ];
    
    const scoldingListSevere = [
      `BỎ HỌC ${consecutiveMissed} NGÀY?! Thôi bỏ thi đi cho đỡ tốn tiền! ...Hay bạn muốn chứng minh tôi sai? Thì VÀO HỌC ĐI!`,
      `Nếu không định học thì xóa app đi. Đã ${consecutiveMissed} ngày lười biếng. Tương lai của bạn đáng giá bao nhiêu?`,
      'Kẻ bỏ cuộc đã nghỉ ngơi. Kẻ chiến thắng thì KHÔNG. Bạn chọn làm kẻ nào?',
      `Chuông báo động! ${consecutiveMissed} ngày trôi qua không một chữ trong đầu. Bắt đầu ngay, không ngụy biện!`
    ];

    let message = '';
    
    if (consecutiveMissed >= 5) {
      message = scoldingListSevere[Math.floor(Math.random() * scoldingListSevere.length)];
    } else if (consecutiveMissed >= 3) {
      message = scoldingList3[Math.floor(Math.random() * scoldingList3.length)];
    } else if (consecutiveMissed === 2) {
      message = scoldingList2[Math.floor(Math.random() * scoldingList2.length)];
    } else if (consecutiveMissed === 1) {
      message = scoldingList1[Math.floor(Math.random() * scoldingList1.length)];
    }
    
    // Add streak broken attachment
    if (streakBroken > 3 && consecutiveMissed > 0) {
      message += ` (Streak ${streakBroken} ngày vỡ tan tành rồi! Bao nhiêu công sức xây dựng, phá hủy trong 1 ngày lười!)`;
    }
    
    return message;
  },
  
  // --- MOTIVATIONAL MESSAGES ---
  getMotivationalMessage(streak, percentage) {
    if (percentage === 100) {
      const msgs = [
        '🎯 Hoàn hảo! Hôm nay bạn đã chinh phục MỌI task!',
        '👑 N2 không có cửa làm khó bạn. Ngày hôm nay quá xuất sắc!',
        '🚀 Bạn vừa tiến thêm một bước siêu dài đến N2. Tự hào về bạn!',
        '🔥 100% completed. Ngủ ngon với cảm giác của người chiến thắng!'
      ];
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
    
    if (streak >= 30) {
      return `🏆 ${streak} NGÀY LIÊN TỤC! Bạn là chiến binh thực thụ! N2 đang run sợ!`;
    } else if (streak >= 7) {
      return `🔥 Streak ${streak} ngày! Não bạn đang hình thành neural pathway mới, đừng dừng lại!`;
    } else if (streak >= 3) {
      return `💪 Đã duy trì được ${streak} ngày. Đang vào guồng rồi, tiếp tục phát huy!`;
    } else {
      return 'Bắt đầu từ những bước nhỏ nhất. Hôm nay hãy làm tốt nhất có thể!';
    }
  },
  
  // --- DAILY TIPS ---
  getDailyTip(dayNumber) {
    const tips = [
      'Shadowing nhắm mắt giúp tập trung vào âm thanh tốt hơn 40%.',
      'Đọc hiểu N2: Luôn đọc câu hỏi TRƯỚC khi đọc bài.',
      'Khi làm bài Nghe, hãy nhắm mắt lại nếu bạn cảm thấy bị phân tâm bởi hình ảnh xung quanh.',
      'Từ vựng N2 rất thích đánh lừa bằng những từ có trường âm hoặc âm ngắt. Cẩn thận!',
      'Gặp câu dài trong Đọc hiểu: Cắt nhỏ câu ra, tìm Chủ ngữ và Vị ngữ chính trước.',
      'Không bao giờ dịch từng từ. Hãy hiểu theo ngữ cảnh và cụm từ (Collocation).',
      'Kanji có thể đoán nghĩa qua bộ thủ. Nếu không biết đọc, hãy đoán nghĩa!',
      'Đừng ôn lại những từ đã thuộc 100%. Hãy dồn sức cho những flashcard bạn hay sai.',
      'Phần Nghe Mondai 4 rất nhanh. Đừng phân tích, hãy phản xạ theo trực giác.',
      'Làm Đọc hiểu mà quá thời gian quy định? BỎ QUA NGAY. Đừng để mất điểm phần dễ.',
      'Ngủ đủ 7-8 tiếng quan trọng hơn việc thức khuya học thêm 5 từ vựng mới.',
      'Luyện đề: Đừng chỉ xem đúng bao nhiêu câu. Phân tích tại sao sai mới là lúc học hỏi.',
      'Tắm ngôn ngữ: Nghe thụ động trong lúc rửa bát, dọn dẹp cũng giúp tai quen với âm điệu.',
      'Ghi chép lại những bẫy mình hay mắc phải. Chúng sẽ lặp lại trong đề thi thật.',
      'Ăn một chút đồ ngọt trước khi bắt đầu thi giúp não hoạt động năng suất hơn.'
    ];
    // Chọn tip theo ngày để cố định (không bị đổi liên tục nếu load lại trang)
    const index = (dayNumber || 1) % tips.length;
    return tips[index];
  },
  
  // --- PHASE INFO ---
  getPhaseInfo(phaseId) {
    const info = {
      'PHASE_1': { title: 'Tháng 8: Thanh toán N3 - Bơm máu N2', description: 'Vượt qua sức ỳ, ôn lại nền tảng N3 và bắt đầu nạp Kanji/Từ vựng N2.', icon: '🌱', color: '#4caf50' },
      'PHASE_2': { title: 'Tháng 9: Vượt vũ môn', description: 'Giai đoạn nhồi nhét kiến thức cốt lõi. Khá mệt mỏi nhưng đây là lúc tạo ra sự khác biệt.', icon: '🔥', color: '#ff9800' },
      'PHASE_3': { title: 'Tháng 10: Tăng tốc & Phản xạ', description: 'Chuyển từ học sang luyện tốc độ. Ép thời gian và Shadowing cường độ cao.', icon: '⚡', color: '#f44336' },
      'PHASE_4': { title: 'Tháng 11: Tháng sinh tồn', description: 'Luyện đề thực chiến. Phân tích lỗi sai từng li từng tí. Cảm nhận áp lực phòng thi.', icon: '⚔️', color: '#9c27b0' },
      'GOLDEN_WEEK': { title: 'Tháng 12: Tuần Vàng', description: 'Giữ não bộ thư giãn nhưng không lơi lỏng. Chuẩn bị tâm lý vững vàng.', icon: '👑', color: '#ffeb3b' }
    };
    return info[phaseId] || { title: '', description: '', icon: '', color: '' };
  }
};
