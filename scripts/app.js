// ═══════════════════════════════════════════════════════════════
// N2GOKAKU — App Controller (Điều khiển chính)
// Quản lý: navigation, khởi tạo, auto-refresh, PWA install
// ═══════════════════════════════════════════════════════════════

window.N2App = {
  plan: null,
  currentView: 'dashboard',
  deferredPrompt: null,

  init() {
    // 1. Tạo kế hoạch học tập
    this.plan = window.N2Data.generatePlan();
    
    // 2. Thiết lập điều hướng (tab switching)
    this.setupNavigation();
    
    // 3. Khởi tạo hệ thống thông báo
    if (window.N2Notifications) {
      window.N2Notifications.init();
    }
    
    // 4. Thiết lập tự động làm mới lúc nửa đêm
    this.setupMidnightRefresh();
    
    // 5. Cài đặt PWA install prompt
    this.setupPWAInstall();
    
    // 6. Render view hiện tại
    this.switchTab(this.currentView);
    
    // 7. Setup ICS button
    this.setupICSButton();
    
    // 8. Onboarding
    this.setupOnboarding();
    
    console.log('🎯 N2GOKAKU initialized!', this.plan.length, 'days in plan');
  },

  setupNavigation() {
    const navButtons = document.querySelectorAll('#nav-bar button[data-tab]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });
  },

  switchTab(tabName) {
    this.currentView = tabName;
    
    // Ẩn tất cả các view
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
      view.classList.remove('active');
    });
    
    // Hiện view được chọn
    const targetView = document.getElementById(`${tabName}-view`);
    if (targetView) {
      targetView.classList.add('active');
    }
    
    // Cập nhật trạng thái active cho nút nav
    const navButtons = document.querySelectorAll('#nav-bar button[data-tab]');
    navButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Gọi hàm render tương ứng của view
    this.renderCurrentView();
  },

  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard':
        if (window.N2Dashboard) {
          window.N2Dashboard.render(this.plan);
        }
        break;
      case 'calendar':
        if (window.N2Calendar) {
          window.N2Calendar.render(this.plan);
        }
        break;
      case 'stats':
        if (window.N2WeekSummary) {
          window.N2WeekSummary.render(this.plan);
        }
        break;
      case 'settings':
        if (window.N2Settings) {
          window.N2Settings.render();
        }
        break;
    }
  },

  setupMidnightRefresh() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeToMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.renderCurrentView();
      // Thiết lập lại cho ngày hôm sau
      this.setupMidnightRefresh();
    }, timeToMidnight);
  },

  setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Hiển thị install prompt bar
      const installPrompt = document.getElementById('install-prompt');
      if (installPrompt) {
        installPrompt.style.display = 'flex';
      }
      
      // Hiển thị nút install trong settings
      const pwaSection = document.getElementById('pwa-section');
      if (pwaSection) {
        pwaSection.style.display = 'block';
      }
    });
    
    // Install button (bottom prompt)
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', () => this.handleInstall());
    }
    
    // Install button (settings)
    const settingsInstallBtn = document.getElementById('settings-install-btn');
    if (settingsInstallBtn) {
      settingsInstallBtn.addEventListener('click', () => this.handleInstall());
    }
    
    // Dismiss button
    const dismissBtn = document.getElementById('install-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        const installPrompt = document.getElementById('install-prompt');
        if (installPrompt) installPrompt.style.display = 'none';
      });
    }
  },

  async handleInstall() {
    if (!this.deferredPrompt) return;
    
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    console.log(`PWA install: ${outcome}`);
    this.deferredPrompt = null;
    
    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt) installPrompt.style.display = 'none';
  },

  setupICSButton() {
    const icsBtn = document.getElementById('ics-download-btn');
    if (icsBtn) {
      icsBtn.addEventListener('click', () => {
        if (window.N2Notifications) {
          window.N2Notifications.downloadICS(this.plan);
        }
      });
    }
  },

  setupOnboarding() {
    const onboardingShown = localStorage.getItem('n2g_onboarding_shown');
    if (!onboardingShown) {
      const modal = document.getElementById('onboarding-modal');
      const syncBtn = document.getElementById('onboarding-sync-btn');
      const skipBtn = document.getElementById('onboarding-skip-btn');
      
      if (modal && syncBtn && skipBtn) {
        setTimeout(() => {
          modal.style.display = 'flex';
        }, 1500);
        
        syncBtn.onclick = () => {
          if (window.N2Notifications) {
            window.N2Notifications.exportToGoogleCalendar(this.plan);
          }
          modal.style.display = 'none';
          localStorage.setItem('n2g_onboarding_shown', 'true');
        };
        
        skipBtn.onclick = () => {
          modal.style.display = 'none';
          localStorage.setItem('n2g_onboarding_shown', 'true');
        };
      }
    }
  },

  // Lấy kế hoạch hôm nay
  getTodayPlan() {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return this.plan.find(p => p.date === todayStr) || null;
  },

  // Lấy tuần hiện tại
  getCurrentWeek() {
    const todayPlan = this.getTodayPlan();
    return todayPlan ? todayPlan.week : 1;
  }
};
