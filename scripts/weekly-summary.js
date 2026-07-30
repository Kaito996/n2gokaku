// ═══════════════════════════════════════════════════════════════
// N2GOKAKU — Weekly Summary & Stats (Trang "Thống kê")
// Hiển thị tổng kết tuần, tiến độ tổng, biểu đồ category
// ═══════════════════════════════════════════════════════════════

window.N2WeekSummary = {
  render(plan) {
    const weeklyContainer = document.getElementById('weekly-summary-container');
    const overallContainer = document.getElementById('overall-stats-container');
    
    if (!weeklyContainer || !overallContainer || !window.N2Storage) return;
    
    weeklyContainer.innerHTML = '';
    overallContainer.innerHTML = '';
    
    // 1. Render Overall Stats
    overallContainer.appendChild(this.renderOverallStats(plan));
    
    // 2. Render tuần hiện tại
    const currentWeek = window.N2App.getCurrentWeek();
    
    const weeklyTitle = document.createElement('h2');
    weeklyTitle.className = 'section-title';
    weeklyTitle.textContent = '📊 Tổng kết theo tuần';
    weeklyContainer.appendChild(weeklyTitle);
    
    // Render tuần hiện tại (expanded)
    weeklyContainer.appendChild(this.renderWeekCard(currentWeek, plan, true));
    
    // Render các tuần trước (collapsed)
    for (let w = currentWeek - 1; w >= 1; w--) {
      weeklyContainer.appendChild(this.renderWeekCard(w, plan, false));
    }
  },

  renderWeekCard(weekNumber, plan, isCurrent) {
    // Lưu ý: getWeekStats nhận (weekNumber, plan)
    const weekStats = window.N2Storage.getWeekStats(weekNumber, plan);
    const grade = this.calculateGrade(weekStats.percentage);
    
    const card = document.createElement('div');
    card.className = `week-card ${isCurrent ? 'current-week' : ''}`;
    
    // Header
    const header = document.createElement('div');
    header.className = 'week-header';
    header.innerHTML = `
      <div class="week-title-group">
        <h4>TUẦN ${weekNumber} ${isCurrent ? '<span class="current-badge">Hiện tại</span>' : ''}</h4>
        <span class="week-completion">${weekStats.completedTasks}/${weekStats.totalTasks} nhiệm vụ</span>
      </div>
      <div class="week-grade grade-${grade.toLowerCase()}">${grade}</div>
    `;
    card.appendChild(header);
    
    // Progress bar tổng
    const progressDiv = document.createElement('div');
    progressDiv.className = 'week-progress';
    progressDiv.innerHTML = `
      <div class="week-progress-bar">
        <div class="week-progress-fill" style="width: ${weekStats.percentage}%"></div>
      </div>
      <span class="week-percent">${weekStats.percentage.toFixed(0)}%</span>
    `;
    card.appendChild(progressDiv);
    
    // Stats by category (collapsible for past weeks)
    const statsDiv = document.createElement('div');
    statsDiv.className = 'stats-list';
    if (!isCurrent) {
      statsDiv.style.display = 'none';
    }
    
    const categories = [
      { id: 'kanji', name: '📝 Kanji', color: '#667eea' },
      { id: 'vocabulary', name: '📚 Từ vựng', color: '#764ba2' },
      { id: 'grammar', name: '📖 Ngữ pháp', color: '#e91e63' },
      { id: 'reading', name: '📰 Đọc hiểu', color: '#00bcd4' },
      { id: 'listening', name: '🎧 Nghe hiểu', color: '#ff9800' },
      { id: 'shadowing', name: '🎤 Shadowing', color: '#4caf50' },
      { id: 'passive', name: '🎬 Thụ động', color: '#9c27b0' },
      { id: 'review', name: '📋 Ôn tập', color: '#607d8b' },
      { id: 'test', name: '📄 Kiểm tra', color: '#f44336' }
    ];
    
    const byCategory = weekStats.byCategory || {};
    categories.forEach(cat => {
      const catStat = byCategory[cat.id];
      if (catStat && catStat.total > 0) {
        const pct = Math.round((catStat.completed / catStat.total) * 100);
        const row = document.createElement('div');
        row.className = 'stat-row';
        row.innerHTML = `
          <span class="stat-label">${cat.name}</span>
          <div class="stat-bar-container">
            <div class="stat-bar" style="width: ${pct}%; background: ${cat.color};"></div>
          </div>
          <span class="stat-value">${catStat.completed}/${catStat.total}</span>
        `;
        statsDiv.appendChild(row);
      }
    });
    
    card.appendChild(statsDiv);
    
    // Toggle cho tuần cũ
    if (!isCurrent) {
      card.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const isVisible = statsDiv.style.display !== 'none';
        statsDiv.style.display = isVisible ? 'none' : 'block';
        card.classList.toggle('expanded', !isVisible);
      });
    }
    
    return card;
  },

  renderOverallStats(plan) {
    const overall = window.N2Storage.getOverallProgress(plan);
    const streakInfo = window.N2Storage.getStreak(plan);
    const countdown = window.N2Utils.getCountdown();
    
    const container = document.createElement('div');
    container.className = 'overall-stats';
    
    container.innerHTML = `
      <h2 class="section-title">📈 Tiến độ tổng quan</h2>
      <div class="stats-grid">
        <div class="stat-box">
          <span class="stat-box-value">${overall.percentage}%</span>
          <span class="stat-box-label">Hoàn thành</span>
        </div>
        <div class="stat-box">
          <span class="stat-box-value">${overall.completed}<small>/${overall.total}</small></span>
          <span class="stat-box-label">Tasks xong</span>
        </div>
        <div class="stat-box streak-box">
          <span class="stat-box-value">🔥 ${streakInfo.current}</span>
          <span class="stat-box-label">Streak</span>
        </div>
        <div class="stat-box countdown-box">
          <span class="stat-box-value">${countdown.days}</span>
          <span class="stat-box-label">Ngày tới thi</span>
        </div>
      </div>
      <div class="overall-progress">
        <div class="overall-progress-bar">
          <div class="overall-progress-fill" style="width: ${overall.percentage}%"></div>
        </div>
        <div class="overall-progress-labels">
          <span>01/08</span>
          <span>01/09</span>
          <span>01/10</span>
          <span>01/11</span>
          <span>06/12 🎯</span>
        </div>
      </div>
    `;
    
    return container;
  },

  calculateGrade(percentage) {
    if (percentage >= 95) return 'S';
    if (percentage >= 85) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 55) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }
};
