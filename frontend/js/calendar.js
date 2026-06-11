// Check authentication
const token = api.getToken();
const user = api.getUser();

if (!token || !user) {
    window.location.href = 'index.html';
}

// Calendar state
let currentDate = new Date();
let leaveData = [];
let leaveTypes = [];

document.addEventListener('DOMContentLoaded', () => {
    loadCalendar();
});

async function loadCalendar() {
    try {
        await loadLeaveTypes();
        await loadLeaveData();
        renderCalendar();
        updateLegend();
    } catch (error) {
        console.error('Calendar error:', error);
    }
}

async function loadLeaveTypes() {
    try {
        const response = await api.getLeaveTypes();
        leaveTypes = response.types;
    } catch (error) {
        console.error('Load types error:', error);
    }
}

async function loadLeaveData() {
    try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();

        const response = await api.getCalendarData(month, year);
        leaveData = response.leaves;
    } catch (error) {
        console.error('Load calendar data error:', error);
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('monthDisplay').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    let html = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += createDayCell(day, true, false);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === today.getDate();
        html += createDayCell(day, false, isToday);
    }

    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        html += createDayCell(day, true, false);
    }

    document.getElementById('calendarDays').innerHTML = html;
}

function createDayCell(day, isOtherMonth, isToday) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Adjust month for other month days
    let cellMonth = month;
    if (isOtherMonth) {
        cellMonth = day > 15 ? month - 1 : month + 1;
    }

    const dateStr = `${year}-${String(cellMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Find events for this day
    const events = leaveData.filter(leave => {
        const start = new Date(leave.start_date);
        const end = new Date(leave.end_date);
        const current = new Date(dateStr);
        return current >= start && current <= end;
    });

    const eventsHTML = events.map(event => {
        const employeeName = event.employee_name || 'Me';
        const displayName = user.role === 'manager' ? employeeName : event.leave_type_name;

        return `
            <div class="event-item" style="background: ${event.leave_type_color};" 
                 title="${employeeName} - ${event.leave_type_name}">
                ${displayName}
            </div>
        `;
    }).join('');

    const classes = ['calendar-day'];
    if (isOtherMonth) classes.push('other-month');
    if (isToday) classes.push('today');

    return `
        <div class="${classes.join(' ')}">
            <div class="day-number">${day}</div>
            <div class="day-events">${eventsHTML}</div>
        </div>
    `;
}

function updateLegend() {
    const legendContainer = document.getElementById('legend');

    // Get unique leave types from data
    const usedTypes = new Set();
    leaveData.forEach(leave => {
        usedTypes.add(leave.leave_type_name);
    });

    let legendHTML = `
        <div class="legend-item">
            <div class="legend-color" style="background: var(--primary);"></div>
            <span>Today</span>
        </div>
    `;

    leaveTypes.forEach(type => {
        if (usedTypes.has(type.name)) {
            legendHTML += `
                <div class="legend-item">
                    <div class="legend-color" style="background: ${type.color};"></div>
                    <span>${type.name}</span>
                </div>
            `;
        }
    });

    legendContainer.innerHTML = legendHTML;
}

// Navigation functions
async function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    await loadLeaveData();
    renderCalendar();
    updateLegend();
}

async function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    await loadLeaveData();
    renderCalendar();
    updateLegend();
}

async function goToToday() {
    currentDate = new Date();
    await loadLeaveData();
    renderCalendar();
    updateLegend();
}
