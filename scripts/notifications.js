window.N2Notifications = {
  checkInterval: null,

  init() {
    this.setupUI();
    
    const settings = window.N2Storage ? window.N2Storage.getSettings() : null;
    if (settings && settings.notificationsEnabled) {
      this.requestPermission().then(granted => {
        if (granted) {
          this.scheduleNotifications();
        } else {
          // Update setting if permission denied
          if (window.N2Storage) {
            settings.notificationsEnabled = false;
            window.N2Storage.saveSettings(settings);
            this.updateUIToggles(false);
          }
        }
      });
    }
  },

  setupUI() {
    const notifToggle = document.getElementById('notification-toggle');
    if (notifToggle) {
      notifToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const granted = await this.requestPermission();
          if (granted) {
            this.saveSettings(true);
            this.scheduleNotifications();
          } else {
            e.target.checked = false;
            alert('Vui lòng cấp quyền thông báo trong trình duyệt!');
          }
        } else {
          this.saveSettings(false);
          if (this.checkInterval) {
            clearInterval(this.checkInterval);
          }
        }
      });
      
      // Load current state
      const settings = window.N2Storage ? window.N2Storage.getSettings() : { notificationsEnabled: false };
      this.updateUIToggles(settings.notificationsEnabled);
    }
  },
  
  updateUIToggles(enabled) {
    const notifToggle = document.getElementById('notification-toggle');
    if (notifToggle) {
      notifToggle.checked = enabled;
    }
  },
  
  saveSettings(enabled) {
    if (window.N2Storage) {
      const settings = window.N2Storage.getSettings();
      settings.notificationsEnabled = enabled;
      
      const morningEl = document.getElementById('morning-notify-time');
      const afternoonEl = document.getElementById('afternoon-notify-time');
      const eveningEl = document.getElementById('evening-notify-time');
      
      if (morningEl) settings.morningTime = morningEl.value;
      if (afternoonEl) settings.afternoonTime = afternoonEl.value;
      if (eveningEl) settings.eveningTime = eveningEl.value;
      
      window.N2Storage.saveSettings(settings);
    }
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Trình duyệt không hỗ trợ thông báo');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  },

  scheduleNotifications() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(() => {
      this.checkCurrentTimeAndNotify();
    }, 60000); // Check every minute
  },
  
  checkCurrentTimeAndNotify() {
    const settings = window.N2Storage ? window.N2Storage.getSettings() : null;
    if (!settings || !settings.notificationsEnabled) return;
    
    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    
    const todayPlan = window.N2App ? window.N2App.getTodayPlan() : null;
    if (!todayPlan || todayPlan.dayType === 'rest') return; // Không thông báo vào ngày nghỉ
    
    // Check morning
    if (currentTimeStr === settings.morningTime) {
      this.showNotification('N2GOKAKU: Buổi sáng', 'Bắt đầu ngày mới! Cùng xem nhiệm vụ học buổi sáng nhé.', 'morning');
    }
    // Check afternoon
    else if (currentTimeStr === settings.afternoonTime) {
      this.showNotification('N2GOKAKU: Buổi chiều', 'Tiếp tục chuỗi học tập buổi chiều nào!', 'afternoon');
    }
    // Check evening
    else if (currentTimeStr === settings.eveningTime) {
      this.showNotification('N2GOKAKU: Buổi tối', 'Hoàn thành nốt mục tiêu hôm nay nhé!', 'evening');
    }
    // Check 22:00 for incomplete tasks
    else if (currentTimeStr === '22:00') {
      if (window.N2Storage) {
        const stats = window.N2Storage.getDayStats(todayPlan.date, todayPlan.tasks);
        if (stats.completed < stats.total) {
          this.showNotification('CẢNH BÁO N2GOKAKU!', 'Bạn vẫn chưa hoàn thành nhiệm vụ hôm nay! Đừng để đứt chuỗi!', 'alert');
        }
      }
    }
  },

  showNotification(title, body, tag) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body: body,
          icon: '/assets/icon-192.png',
          badge: '/assets/icon-badge.png',
          tag: tag,
          vibrate: [200, 100, 200]
        });
      });
    } else {
      new Notification(title, {
        body: body,
        icon: '/assets/icon-192.png',
        tag: tag
      });
    }
  },

  generateGoogleCalendarUrl(plan) {
    const text = encodeURIComponent('N2GOKAKU: Thời gian học!');
    const details = encodeURIComponent('Hoàn thành mục tiêu học JLPT N2 hôm nay nhé!\nMở app: https://vuong.github.io/N2GOKAKU');
    const dates = '20260801T004500Z/20260801T014500Z'; // 7:45 AM VN time to 8:45 AM VN time in UTC is 00:45 - 01:45
    const ctz = 'Asia/Ho_Chi_Minh';
    const recur = 'RRULE:FREQ=DAILY;UNTIL=20261205T165959Z';
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${dates}&ctz=${ctz}&recur=${recur}`;
  },

  generateICSFile(plan) {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//N2GOKAKU//VN\nCALSCALE:GREGORIAN\n";
    
    // Tạo 3 event lặp lại hàng ngày (Sáng, Chiều, Tối)
    const sessions = [
      { name: "Sáng", time: "004500", uid: "morning" }, // 07:45 VN = 00:45 UTC
      { name: "Chiều", time: "064500", uid: "afternoon" }, // 13:45 VN = 06:45 UTC
      { name: "Tối", time: "124500", uid: "evening" } // 19:45 VN = 12:45 UTC
    ];
    
    const today = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    sessions.forEach(session => {
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `DTSTAMP:${today}\n`;
      icsContent += `UID:n2gokaku-${session.uid}@vuong.github.io\n`;
      icsContent += `DTSTART:20260801T${session.time}Z\n`;
      icsContent += `DTEND:20260801T${(parseInt(session.time) + 10000).toString().padStart(6, '0')}Z\n`;
      icsContent += `RRULE:FREQ=DAILY;UNTIL=20261205T235959Z\n`;
      icsContent += `SUMMARY:N2GOKAKU Học ${session.name}\n`;
      icsContent += `DESCRIPTION:Tới giờ học JLPT N2 buổi ${session.name.toLowerCase()} rồi!\n`;
      
      // Thêm chuông báo trước 15 phút
      icsContent += "BEGIN:VALARM\n";
      icsContent += "ACTION:DISPLAY\n";
      icsContent += `DESCRIPTION:N2GOKAKU Học ${session.name}\n`;
      icsContent += "TRIGGER:-PT15M\n";
      icsContent += "END:VALARM\n";
      
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";
    return icsContent;
  },

  downloadICS(plan) {
    const icsContent = this.generateICSFile(plan);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'N2GOKAKU-LichHoc.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
