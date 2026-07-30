// storage.js
// Module quản lý việc lưu trữ dữ liệu (LocalStorage)

const SETTINGS_KEY = 'n2g_settings';
const BEST_STREAK_KEY = 'n2g_best_streak';

function getTaskKey(dateStr) {
  return `n2g_tasks_${dateStr}`;
}

window.N2Storage = {
  // Task completion
  toggleTask(dateStr, taskId) {
    const key = getTaskKey(dateStr);
    let completedTasks = JSON.parse(localStorage.getItem(key) || '[]');
    const index = completedTasks.indexOf(taskId);
    let newState = false;
    
    if (index > -1) {
      completedTasks.splice(index, 1);
      newState = false;
    } else {
      completedTasks.push(taskId);
      newState = true;
    }
    
    localStorage.setItem(key, JSON.stringify(completedTasks));
    return newState;
  },
  
  isTaskCompleted(dateStr, taskId) {
    const key = getTaskKey(dateStr);
    const completedTasks = JSON.parse(localStorage.getItem(key) || '[]');
    return completedTasks.includes(taskId);
  },
  
  // Day stats
  getDayStats(dateStr, plan) {
    const dayPlan = plan.find(d => d.date === dateStr);
    if (!dayPlan || dayPlan.tasks.length === 0) {
      return { completed: 0, total: 0, percentage: 100 }; // Ngày nghỉ
    }
    
    const key = getTaskKey(dateStr);
    const completedTasks = JSON.parse(localStorage.getItem(key) || '[]');
    // Filter out valid tasks just in case
    const validCompleted = completedTasks.filter(id => dayPlan.tasks.some(t => t.id === id));
    
    const percentage = Math.round((validCompleted.length / dayPlan.tasks.length) * 100);
    
    return {
      completed: validCompleted.length,
      total: dayPlan.tasks.length,
      percentage: percentage
    };
  },
  
  // Week stats
  getWeekStats(weekNumber, plan) {
    const weekDays = plan.filter(d => d.week === weekNumber);
    let totalTasks = 0;
    let completedTasks = 0;
    let daysCompleted = 0;
    let daysMissed = 0;
    const byCategory = {};
    
    const todayStr = window.N2Utils ? new Date().toISOString().split('T')[0] : '';
    
    weekDays.forEach(day => {
      const stats = this.getDayStats(day.date, plan);
      totalTasks += stats.total;
      completedTasks += stats.completed;
      
      // Xử lý Missed / Completed days
      if (stats.total > 0) {
        if (stats.percentage === 100) daysCompleted++;
        if (stats.percentage === 0 && day.date < todayStr) daysMissed++;
      }
      
      // Category stats
      const key = getTaskKey(day.date);
      const completedIds = JSON.parse(localStorage.getItem(key) || '[]');
      
      day.tasks.forEach(task => {
        if (!byCategory[task.category]) {
          byCategory[task.category] = { completed: 0, total: 0 };
        }
        byCategory[task.category].total++;
        if (completedIds.includes(task.id)) {
          byCategory[task.category].completed++;
        }
      });
    });
    
    return {
      totalTasks,
      completedTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100,
      byCategory,
      daysCompleted,
      daysMissed
    };
  },
  
  // Freeze Tokens & Days
  getFreezeTokens() {
    const tokensStr = localStorage.getItem('n2g_freeze_tokens');
    return tokensStr ? parseInt(tokensStr, 10) : 2;
  },
  
  getFrozenDays() {
    return JSON.parse(localStorage.getItem('n2g_frozen_days') || '[]');
  },
  
  freezeDay(dateStr) {
    const tokens = this.getFreezeTokens();
    if (tokens > 0) {
      const frozenDays = this.getFrozenDays();
      if (!frozenDays.includes(dateStr)) {
        frozenDays.push(dateStr);
        localStorage.setItem('n2g_frozen_days', JSON.stringify(frozenDays));
        localStorage.setItem('n2g_freeze_tokens', (tokens - 1).toString());
        return true;
      }
    }
    return false;
  },

  // Streak
  getStreak(plan) {
    let current = 0;
    let lastActiveDate = null;
    const todayStr = new Date().toISOString().split('T')[0];
    const pastDays = plan.filter(d => d.date <= todayStr).reverse();
    const frozenDays = this.getFrozenDays();
    
    for (const day of pastDays) {
      if (day.tasks.length === 0 || frozenDays.includes(day.date)) continue; // Bỏ qua ngày nghỉ hoặc ngày bị đóng băng
      
      const stats = this.getDayStats(day.date, plan);
      if (stats.percentage > 0) {
        current++;
        if (!lastActiveDate) lastActiveDate = day.date;
      } else if (day.date !== todayStr) {
        // Break streak nếu ngày hôm qua (hoặc trước đó) ko làm gì
        break;
      }
    }
    
    const best = parseInt(localStorage.getItem(BEST_STREAK_KEY) || '0');
    if (current > best) {
      localStorage.setItem(BEST_STREAK_KEY, current.toString());
    }
    
    return { current, best: Math.max(current, best), lastActiveDate };
  },
  
  // Overall progress
  getOverallProgress(plan) {
    let completed = 0;
    let total = 0;
    let daysElapsed = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    
    plan.forEach(day => {
      total += day.tasks.length;
      const key = getTaskKey(day.date);
      const completedIds = JSON.parse(localStorage.getItem(key) || '[]');
      // Gộp các ID hợp lệ
      const validIds = completedIds.filter(id => day.tasks.some(t => t.id === id));
      completed += validIds.length;
      
      if (day.date < todayStr) daysElapsed++;
    });
    
    const daysRemaining = plan.length - daysElapsed;
    
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      daysElapsed,
      daysRemaining
    };
  },
  
  // Missed days
  getMissedDays(plan) {
    const todayStr = new Date().toISOString().split('T')[0];
    const pastDays = plan.filter(d => d.date < todayStr);
    const missed = [];
    const frozenDays = this.getFrozenDays();
    
    pastDays.forEach(day => {
      if (day.tasks.length > 0 && !frozenDays.includes(day.date)) {
        const stats = this.getDayStats(day.date, plan);
        if (stats.percentage === 0) {
          missed.push(day.date);
        }
      }
    });
    
    return missed;
  },
  
  getConsecutiveMissedDays(plan) {
    const todayStr = new Date().toISOString().split('T')[0];
    const pastDays = plan.filter(d => d.date < todayStr).reverse();
    let consecutive = 0;
    const frozenDays = this.getFrozenDays();
    
    for (const day of pastDays) {
      if (day.tasks.length === 0 || frozenDays.includes(day.date)) continue; // Bỏ qua ngày nghỉ hoặc đóng băng
      
      const stats = this.getDayStats(day.date, plan);
      if (stats.percentage === 0) {
        consecutive++;
      } else {
        break; // Dừng lại khi gặp một ngày có học
      }
    }
    return consecutive;
  },
  
  // Export/Import
  exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('n2g_')) {
        data[key] = localStorage.getItem(key);
      }
    }
    return JSON.stringify(data);
  },
  
  importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      for (const key in data) {
        if (key.startsWith('n2g_')) {
          localStorage.setItem(key, data[key]);
        }
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },
  
  // Settings
  getSettings() {
    const defaultSettings = { notificationsEnabled: false, startDate: '2026-08-01', morningTime: '07:45', afternoonTime: '13:45', eveningTime: '19:45' };
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  },
  
  saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
