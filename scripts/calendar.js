// ═══════════════════════════════════════════════════════════════
// N2GOKAKU — Calendar View (Trang "Lịch")
// Hiển thị lịch 4-5 tháng với trạng thái hoàn thành
// ═══════════════════════════════════════════════════════════════

window.N2Calendar = {
  render(plan) {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;
    
    calendarContainer.innerHTML = '';
    
    // Render tháng 8-12
    const monthsToRender = [
      { year: 2026, month: 7 },  // August (0-indexed)
      { year: 2026, month: 8 },  // September
      { year: 2026, month: 9 },  // October
      { year: 2026, month: 10 }, // November
      { year: 2026, month: 11 }  // December
    ];
    
    monthsToRender.forEach(({ year, month }) => {
      const monthEl = this.renderMonth(year, month, plan);
      calendarContainer.appendChild(monthEl);
    });
    
    this.setupModal();
    this.setupFab();
  },

  setupFab() {
    const fab = document.getElementById('fab-today');
    if (fab) {
      fab.onclick = () => {
        const todayCell = document.getElementById('calendar-today-cell');
        if (todayCell) {
          todayCell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };
    }
  },

  renderMonth(year, month, plan) {
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    
    // Tìm phase cho tháng này
    const monthNum = month + 1;
    let phaseInfo = null;
    if (monthNum === 8) phaseInfo = window.N2Utils.getPhaseInfo('PHASE_1');
    else if (monthNum === 9) phaseInfo = window.N2Utils.getPhaseInfo('PHASE_2');
    else if (monthNum === 10) phaseInfo = window.N2Utils.getPhaseInfo('PHASE_3');
    else if (monthNum === 11) phaseInfo = window.N2Utils.getPhaseInfo('PHASE_4');
    else if (monthNum === 12) phaseInfo = window.N2Utils.getPhaseInfo('GOLDEN_WEEK');
    
    const monthDiv = document.createElement('div');
    monthDiv.className = 'calendar-month';
    
    // Header tháng
    const header = document.createElement('div');
    header.className = 'month-header';
    header.innerHTML = `
      <span class="month-name">${monthNames[month]} ${year}</span>
      ${phaseInfo ? `<span class="month-phase" style="color: ${phaseInfo.color}">${phaseInfo.icon} ${phaseInfo.title.split(':')[0]}</span>` : ''}
    `;
    monthDiv.appendChild(header);
    
    // Grid
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    
    // Tiêu đề ngày trong tuần (T2 -> CN)
    ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(wd => {
      const wdEl = document.createElement('div');
      wdEl.className = 'calendar-weekday';
      wdEl.textContent = wd;
      grid.appendChild(wdEl);
    });
    
    // Khoảng trống đầu tháng
    const firstDayDate = new Date(year, month, 1);
    let firstDayIndex = firstDayDate.getDay() - 1; // 0=Monday
    if (firstDayIndex === -1) firstDayIndex = 6; // Sunday = last column
    
    for (let i = 0; i < firstDayIndex; i++) {
      const empty = document.createElement('div');
      empty.className = 'calendar-cell empty';
      grid.appendChild(empty);
    }
    
    // Ngày trong tháng
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayPlan = plan.find(p => p.date === dateStr);
      
      const cell = this.renderDayCell(d, dateStr, dayPlan, plan);
      grid.appendChild(cell);
    }
    
    monthDiv.appendChild(grid);
    return monthDiv;
  },

  renderDayCell(dayNumber, dateStr, dayPlan, plan) {
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';
    cell.innerHTML = `<span class="day-number">${dayNumber}</span>`;
    
    const isToday = window.N2Utils.isToday(dateStr);
    const isPast = window.N2Utils.isPast(dateStr);
    const isFuture = window.N2Utils.isFuture(dateStr);
    const frozenDays = window.N2Storage ? window.N2Storage.getFrozenDays() : [];
    
    if (!dayPlan) {
      // Ngày ngoài kế hoạch
      cell.classList.add('out-of-plan');
      return cell;
    }
    
    // Trạng thái đặc biệt
    if (isToday) {
      cell.classList.add('today');
      cell.id = 'calendar-today-cell';
    }
    
    if (dateStr === '2026-12-06') {
      cell.classList.add('exam');
      cell.innerHTML = `<span class="day-number">${dayNumber}</span><span class="exam-label">THI</span>`;
    } else if (frozenDays.includes(dateStr)) {
      cell.classList.add('frozen');
    } else if (dayPlan.dayType === 'rest') {
      cell.classList.add('rest');
    } else if (dayPlan.phase === 'GOLDEN_WEEK') {
      cell.classList.add('golden');
    } else if (isFuture && !isToday) {
      cell.classList.add('future');
    } else if (dayPlan.tasks && dayPlan.tasks.length > 0) {
      // Tính completion
      if (window.N2Storage) {
        const stats = window.N2Storage.getDayStats(dateStr, plan);
        if (stats.total > 0) {
          if (stats.completed === stats.total) {
            cell.classList.add('completed');
          } else if (stats.completed > 0) {
            cell.classList.add('partial');
          } else if (isPast) {
            cell.classList.add('missed');
          }
        }
      }
    }
    
    // Click để xem chi tiết
    if (dayPlan) {
      cell.style.cursor = 'pointer';
      cell.addEventListener('click', () => this.handleDayClick(dayPlan));
    }
    
    return cell;
  },

  handleDayClick(dayPlan) {
    const modal = document.getElementById('modal-overlay');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalBody) return;
    
    const dayOfWeek = window.N2Utils.getDayOfWeekVN(dayPlan.date);
    const dateVN = window.N2Utils.formatDateVN(dayPlan.date);
    const phaseInfo = window.N2Utils.getPhaseInfo(dayPlan.phase);
    const frozenDays = window.N2Storage ? window.N2Storage.getFrozenDays() : [];
    
    let html = `
      <h3>${dayOfWeek}, ${dateVN} — Ngày ${dayPlan.day}/128</h3>
      <p class="modal-phase" style="color: ${phaseInfo.color}">${phaseInfo.icon} ${phaseInfo.title}</p>
    `;
    
    if (frozenDays.includes(dayPlan.date)) {
      html += '<div class="modal-frozen"><span>❄️</span><p>Ngày này đã được đóng băng bằng Thẻ Miễn Tử.</p></div>';
    } else if (dayPlan.dayType === 'rest') {
      html += '<div class="modal-rest"><span>😴</span><p>Ngày nghỉ ngơi! Nạp lại năng lượng nhé.</p></div>';
    } else if (dayPlan.date === '2026-12-06') {
      html += '<div class="modal-exam"><span>🎯</span><p>NGÀY THI JLPT N2! Chiến đấu hết mình! 頑張れ！</p></div>';
    } else if (dayPlan.tasks && dayPlan.tasks.length > 0) {
      html += '<div class="modal-tasks">';
      dayPlan.tasks.forEach(task => {
        const isCompleted = window.N2Storage ? window.N2Storage.isTaskCompleted(dayPlan.date, task.id) : false;
        html += `
          <div class="modal-task-card ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}" data-date="${dayPlan.date}">
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
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<p>Không có nhiệm vụ cho ngày này.</p>';
    }
    
    modalBody.innerHTML = html;
    
    // Setup click handlers cho task cards trong modal
    const taskCards = modalBody.querySelectorAll('.modal-task-card');
    taskCards.forEach(card => {
      card.addEventListener('click', () => {
        const taskId = card.getAttribute('data-task-id');
        const date = card.getAttribute('data-date');
        if (window.N2Storage) {
          const newState = window.N2Storage.toggleTask(date, taskId);
          const checkbox = card.querySelector('.task-checkbox');
          if (newState) {
            card.classList.add('completed');
            if (checkbox) checkbox.classList.add('checked');
          } else {
            card.classList.remove('completed');
            if (checkbox) checkbox.classList.remove('checked');
          }
        }
      });
    });
    
    // Đóng modal
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
      closeBtn.onclick = () => { 
        modal.style.display = 'none';
        // Re-render calendar to update cell colors
        this.render(window.N2App.plan);
        // Re-render dashboard if today's tasks were changed
        if (window.N2Utils.isToday(dayPlan.date)) {
          window.N2Dashboard.render(window.N2App.plan);
        }
      };
    }
    
    modal.style.display = 'flex';
  },

  setupModal() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          // Re-render when closing
          this.render(window.N2App.plan);
        }
      });
    }
  }
};
