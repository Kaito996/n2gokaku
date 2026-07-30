window.N2Settings = {
  render() {
    this.setupEventListeners();
    
    // Load current settings into inputs
    if (window.N2Storage) {
      const settings = window.N2Storage.getSettings();
      
      const morningEl = document.getElementById('morning-notify-time');
      const afternoonEl = document.getElementById('afternoon-notify-time');
      const eveningEl = document.getElementById('evening-notify-time');
      
      if (morningEl) morningEl.value = settings.morningTime;
      if (afternoonEl) afternoonEl.value = settings.afternoonTime;
      if (eveningEl) eveningEl.value = settings.eveningTime;
      
      // Update toggle (already handled in notifications module, but double check)
      const notifToggle = document.getElementById('notification-toggle');
      if (notifToggle) {
        notifToggle.checked = settings.notificationsEnabled;
      }
    }
  },
  
  setupEventListeners() {
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const calendarExportBtn = document.getElementById('calendar-export-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // Save settings on change
    ['morning-notify-time', 'afternoon-notify-time', 'evening-notify-time'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          if (window.N2Notifications && document.getElementById('notification-toggle').checked) {
            window.N2Notifications.saveSettings(true);
            window.N2Notifications.scheduleNotifications();
          }
        });
      }
    });
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }
    
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => this.handleImport(e));
    }
    
    if (calendarExportBtn) {
      calendarExportBtn.addEventListener('click', () => this.handleCalendarExport());
    }
    
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.handleReset());
    }
  },

  handleExport() {
    if (!window.N2Storage) return;
    
    const dataStr = window.N2Storage.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `N2GOKAKU_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const success = window.N2Storage.importData(event.target.result);
        if (success) {
          alert('Nhập dữ liệu thành công! Ứng dụng sẽ tự tải lại.');
          location.reload();
        } else {
          alert('Lỗi: File dữ liệu không hợp lệ!');
        }
      } catch (err) {
        alert('Lỗi: Không thể đọc file!');
        console.error(err);
      }
      
      // Reset input file
      e.target.value = '';
    };
    reader.readAsText(file);
  },

  handleReset() {
    const confirmed = confirm('⚠️ CẢNH BÁO NGUY HIỂM ⚠️\n\nBạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu học tập? Hành động này không thể hoàn tác!');
    
    if (confirmed) {
      const doubleCheck = confirm('Vui lòng xác nhận lại lần nữa. Bạn sẽ mất hết tiến độ và phải học lại từ đầu!');
      if (doubleCheck) {
        localStorage.removeItem('n2gokaku_data');
        localStorage.removeItem('n2gokaku_settings');
        alert('Dữ liệu đã được xóa sạch. Ứng dụng sẽ tải lại.');
        location.reload();
      }
    }
  },

  handleCalendarExport() {
    if (!window.N2Notifications || !window.N2App) return;
    
    const plan = window.N2App.plan;
    
    // Hiển thị lựa chọn cho user (Google Calendar hoặc ICS)
    const choice = confirm('Bạn muốn mở Google Calendar (OK) hay tải file .ics (Cancel)?');
    
    if (choice) {
      // Google Calendar
      const url = window.N2Notifications.generateGoogleCalendarUrl(plan);
      window.open(url, '_blank');
    } else {
      // ICS Download
      window.N2Notifications.downloadICS(plan);
    }
  }
};
