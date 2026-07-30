// ═══════════════════════════════════════════════════════════════
// N2GOKAKU — Dashboard (Trang "Hôm nay")
// Hiển thị tasks hàng ngày, streak, progress, scolding/motivation
// ═══════════════════════════════════════════════════════════════

window.N2Dashboard = {
  render(plan) {
    const todayPlan = window.N2App.getTodayPlan();
    
    this.renderHeader(plan);
    this.renderBanners(plan);
    this.checkYesterdayTasks(plan);
    
    if (todayPlan) {
      this.renderPhaseBanner(todayPlan);
      this.renderTasks(todayPlan);
      this.renderDailyTip(todayPlan);
      
      // Hiện/ẩn rest day message
      const restMsg = document.getElementById('rest-day-message');
      if (restMsg) {
        restMsg.style.display = (todayPlan.dayType === 'rest' || todayPlan.tasks.length === 0) ? 'block' : 'none';
      }
    } else {
      this.renderEmptyState(plan);
    }
  },

  checkYesterdayTasks(plan) {
    const banner = document.getElementById('yesterday-banner');
    if (!banner || !window.N2Storage) return;
    
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const yesterdayStr = today.toISOString().split('T')[0];
    
    const yesterdayPlan = plan.find(p => p.date === yesterdayStr);
    const frozenDays = window.N2Storage.getFrozenDays();
    
    if (yesterdayPlan && yesterdayPlan.tasks.length > 0 && !frozenDays.includes(yesterdayStr)) {
      const stats = window.N2Storage.getDayStats(yesterdayStr, plan);
      if (stats.percentage < 100) {
        banner.style.display = 'flex';
        banner.onclick = () => {
          if (window.N2App && window.N2Calendar) {
            window.N2App.switchTab('calendar');
            setTimeout(() => {
              window.N2Calendar.openDayModal(yesterdayPlan);
            }, 50);
          }
        };
        return;
      }
    }
    banner.style.display = 'none';
  },

  renderHeader(plan) {
    if (!window.N2Storage) return;
    
    const todayPlan = window.N2App.getTodayPlan();
    const overall = window.N2Storage.getOverallProgress(plan);
    const streakInfo = window.N2Storage.getStreak(plan);
    const countdown = window.N2Utils.getCountdown();
    
    // Day counter
    const dayCounterEl = document.getElementById('day-counter');
    if (dayCounterEl && todayPlan) {
      dayCounterEl.textContent = `NGÀY ${todayPlan.day}/128`;
    } else if (dayCounterEl) {
      dayCounterEl.textContent = 'CHƯA BẮT ĐẦU';
    }
    
    // Streak
    const streakEl = document.getElementById('streak-counter');
    if (streakEl) {
      const fire = streakEl.querySelector('.streak-fire');
      const num = streakEl.querySelector('.streak-number');
      if (fire && num) {
        num.textContent = streakInfo.current;
        // Thêm animation khi streak > 0
        if (streakInfo.current > 0) {
          streakEl.classList.add('has-streak');
        } else {
          streakEl.classList.remove('has-streak');
        }
      }
    }
    
    // Progress bar
    const progressFill = document.getElementById('progress-bar-fill');
    if (progressFill) {
      progressFill.style.width = `${overall.percentage}%`;
    }
    
    const progressText = document.getElementById('progress-text');
    if (progressText) {
      progressText.textContent = `${overall.percentage}% hoàn thành`;
    }
    
    // Countdown
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
      const countNum = countdownEl.querySelector('.countdown-number');
      if (countNum) {
        countNum.textContent = countdown.days;
      }
    }
  },

  renderBanners(plan) {
    const scoldBanner = document.getElementById('scolding-banner');
    const motivBanner = document.getElementById('motivation-banner');
    
    if (!window.N2Storage || !scoldBanner || !motivBanner) return;
    
    const consecutiveMissed = window.N2Storage.getConsecutiveMissedDays(plan);
    const streakInfo = window.N2Storage.getStreak(plan);
    
    if (consecutiveMissed > 0) {
      // CHỬI MODE
      const msg = window.N2Utils.getScoldingMessage(consecutiveMissed, streakInfo.best, 0);
      const scoldText = document.getElementById('scolding-text');
      if (scoldText) scoldText.textContent = msg;
      
      // FREEZE BUTTON
      const freezeBtn = document.getElementById('btn-freeze');
      const tokensCount = document.getElementById('freeze-tokens-count');
      if (freezeBtn && tokensCount) {
        const tokens = window.N2Storage.getFreezeTokens();
        tokensCount.textContent = tokens;
        if (tokens > 0) {
          freezeBtn.style.display = 'flex';
          freezeBtn.onclick = () => {
            const missedDays = window.N2Storage.getMissedDays(plan);
            if (missedDays.length > 0) {
              const latestMissed = missedDays[missedDays.length - 1]; // Lấy ngày miss gần nhất
              if (window.N2Storage.freezeDay(latestMissed)) {
                this.render(plan); // Re-render to clear scolding and update stats
              }
            }
          };
        } else {
          freezeBtn.style.display = 'none';
        }
      }
      scoldBanner.style.display = 'flex';
      motivBanner.style.display = 'none';
      
      // Thêm class severe nếu >= 3 ngày
      if (consecutiveMissed >= 3) {
        scoldBanner.classList.add('severe');
      } else {
        scoldBanner.classList.remove('severe');
      }
      
      // Dismiss button
      const dismissBtn = document.getElementById('scolding-dismiss');
      if (dismissBtn) {
        dismissBtn.onclick = () => { scoldBanner.style.display = 'none'; };
      }
    } else if (streakInfo.current >= 3) {
      // MOTIVATION MODE
      const msg = window.N2Utils.getMotivationalMessage(streakInfo.current, 0);
      const motivText = document.getElementById('motivation-text');
      if (motivText) motivText.textContent = msg;
      motivBanner.style.display = 'flex';
      scoldBanner.style.display = 'none';
    } else {
      scoldBanner.style.display = 'none';
      motivBanner.style.display = 'none';
    }
  },

  renderPhaseBanner(dayPlan) {
    const phaseBanner = document.getElementById('phase-banner');
    if (!phaseBanner) return;
    
    const phaseInfo = window.N2Utils.getPhaseInfo(dayPlan.phase);
    if (phaseInfo.title) {
      phaseBanner.style.display = 'flex';
      phaseBanner.innerHTML = `
        <span class="phase-icon">${phaseInfo.icon}</span>
        <div class="phase-info">
          <span class="phase-title">${phaseInfo.title}</span>
          <span class="phase-subtitle">${dayPlan.dayType === 'mock_exam' ? '📝 THI THỬ' : dayPlan.dayType === 'error_analysis' ? '🔍 PHÂN TÍCH LỖI' : dayPlan.dayType === 'review' ? '📋 ÔN TẬP' : dayPlan.dayType === 'test' ? '📄 KIỂM TRA' : ''}</span>
        </div>
      `;
      phaseBanner.style.borderLeftColor = phaseInfo.color;
    } else {
      phaseBanner.style.display = 'none';
    }
  },

  renderTasks(dayPlan) {
    const containers = {
      morning: document.getElementById('morning-tasks'),
      afternoon: document.getElementById('afternoon-tasks'),
      evening: document.getElementById('evening-tasks')
    };
    const sessions = {
      morning: document.getElementById('session-morning'),
      afternoon: document.getElementById('session-afternoon'),
      evening: document.getElementById('session-evening')
    };
    
    // Clear containers
    Object.values(containers).forEach(c => { if (c) c.innerHTML = ''; });
    
    // Ẩn tất cả sessions trước
    Object.values(sessions).forEach(s => { if (s) s.style.display = 'none'; });
    
    if (dayPlan.dayType === 'rest' || dayPlan.tasks.length === 0) {
      return;
    }
    
    // Nhóm tasks theo session
    const tasksBySession = { morning: [], afternoon: [], evening: [] };
    dayPlan.tasks.forEach(task => {
      if (tasksBySession[task.session]) {
        tasksBySession[task.session].push(task);
      }
    });
    
    // Render từng session
    Object.entries(tasksBySession).forEach(([session, tasks]) => {
      if (tasks.length > 0 && containers[session] && sessions[session]) {
        sessions[session].style.display = 'block';
        tasks.forEach(task => {
          const card = this.createTaskCard(task, dayPlan.date);
          containers[session].appendChild(card);
        });
      }
    });
    
    // Update session progress
    this.updateSessionProgress(dayPlan);
  },

  createTaskCard(task, dateStr) {
    const isCompleted = window.N2Storage ? window.N2Storage.isTaskCompleted(dateStr, task.id) : false;
    
    const card = document.createElement('div');
    card.className = `task-card category-${task.category} ${isCompleted ? 'completed' : ''}`;
    card.setAttribute('data-task-id', task.id);
    card.setAttribute('data-date', dateStr);
    
    card.innerHTML = `
      <div class="task-checkbox ${isCompleted ? 'checked' : ''}">
        <svg viewBox="0 0 24 24" class="check-svg">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
        </svg>
      </div>
      <div class="task-content">
        <div class="task-time">${task.timeSlot}</div>
        <div class="task-header">
          <span class="task-icon">${task.icon}</span>
          <span class="task-title">${task.title}</span>
        </div>
        <div class="task-desc">${task.description}</div>
      </div>
    `;
    
    // Click toàn bộ card để toggle
    card.addEventListener('click', () => this.handleTaskToggle(dateStr, task.id, card));
    
    return card;
  },

  handleTaskToggle(dateStr, taskId, cardElement) {
    if (!window.N2Storage) return;
    
    const newState = window.N2Storage.toggleTask(dateStr, taskId);
    const checkbox = cardElement.querySelector('.task-checkbox');
    
    if (newState) {
      cardElement.classList.add('completed');
      if (checkbox) checkbox.classList.add('checked');
      
      // Animation nhẹ
      cardElement.style.transform = 'scale(0.97)';
      setTimeout(() => { cardElement.style.transform = ''; }, 200);
      
      // Kiểm tra hoàn thành toàn bộ ngày
      this.checkDayCompletion(dateStr);
    } else {
      cardElement.classList.remove('completed');
      if (checkbox) checkbox.classList.remove('checked');
    }
    
    // Update header và session progress
    this.renderHeader(window.N2App.plan);
    this.updateSessionProgressForDate(dateStr);
  },

  updateSessionProgress(dayPlan) {
    this.updateSessionProgressForDate(dayPlan.date);
  },

  updateSessionProgressForDate(dateStr) {
    if (!window.N2Storage || !window.N2App.plan) return;
    const dayPlan = window.N2App.plan.find(p => p.date === dateStr);
    if (!dayPlan) return;

    ['morning', 'afternoon', 'evening'].forEach(session => {
      const sessionTasks = dayPlan.tasks.filter(t => t.session === session);
      const progressEl = document.getElementById(`${session}-progress`);
      if (progressEl && sessionTasks.length > 0) {
        const done = sessionTasks.filter(t => window.N2Storage.isTaskCompleted(dateStr, t.id)).length;
        progressEl.textContent = `${done}/${sessionTasks.length}`;
        progressEl.className = `session-progress ${done === sessionTasks.length ? 'all-done' : ''}`;
      }
    });
  },

  checkDayCompletion(dateStr) {
    if (!window.N2Storage || !window.N2App.plan) return;
    const dayPlan = window.N2App.plan.find(p => p.date === dateStr);
    if (!dayPlan || dayPlan.tasks.length === 0) return;
    
    const allDone = dayPlan.tasks.every(t => window.N2Storage.isTaskCompleted(dateStr, t.id));
    if (allDone) {
      this.fireConfetti();
      // Hiện motivation banner
      const motivBanner = document.getElementById('motivation-banner');
      const motivText = document.getElementById('motivation-text');
      if (motivBanner && motivText) {
        motivText.textContent = window.N2Utils.getMotivationalMessage(0, 100);
        motivBanner.style.display = 'flex';
      }
    }
  },

  fireConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    
    const ctx = canvas.getContext('2d');
    const particles = [];
    const colors = ['#ff4b4b', '#4caf50', '#2196f3', '#ffeb3b', '#9c27b0', '#ff9800', '#00bcd4'];
    
    // Tạo 80 hạt confetti
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 100,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 4,
        speedY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
    
    let frame = 0;
    const maxFrames = 120;
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
        
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.05; // gravity
        p.rotation += p.rotationSpeed;
      });
      
      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
      }
    }
    
    animate();
  },

  renderDailyTip(dayPlan) {
    const tipText = document.getElementById('tip-text');
    if (tipText) {
      tipText.textContent = window.N2Utils.getDailyTip(dayPlan.day);
    }
  },

  renderEmptyState(plan) {
    const morningEl = document.getElementById('session-morning');
    const afternoonEl = document.getElementById('session-afternoon');
    const eveningEl = document.getElementById('session-evening');
    
    if (afternoonEl) afternoonEl.style.display = 'none';
    if (eveningEl) eveningEl.style.display = 'none';
    
    if (morningEl) {
      morningEl.style.display = 'block';
      const tasksEl = document.getElementById('morning-tasks');
      if (tasksEl) {
        const now = new Date();
        const startDate = new Date('2026-08-01');
        const countdown = window.N2Utils.daysBetween(now, startDate);
        
        if (now < startDate) {
          tasksEl.innerHTML = `
            <div class="empty-state">
              <div class="empty-emoji">⏳</div>
              <h3>Chưa đến ngày bắt đầu!</h3>
              <p>Kế hoạch sẽ bắt đầu vào <strong>01/08/2026</strong></p>
              <p class="empty-countdown">Còn ${countdown} ngày nữa. Hãy chuẩn bị giáo trình!</p>
            </div>
          `;
        } else {
          tasksEl.innerHTML = `
            <div class="empty-state">
              <div class="empty-emoji">🏁</div>
              <h3>Kế hoạch đã kết thúc!</h3>
              <p>Chúc bạn thi tốt JLPT N2! 頑張れ！</p>
            </div>
          `;
        }
      }
    }
  },

  // Cho phép calendar.js gọi để render task trong modal
  renderTaskCard(task, dateStr) {
    return this.createTaskCard(task, dateStr);
  }
};
