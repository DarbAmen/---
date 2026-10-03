// البيانات الأساسية وحالة النظام
let driverData = JSON.parse(localStorage.getItem('driverData')) || null;
let activeIncident = JSON.parse(localStorage.getItem('activeIncident')) || null;
let closedIncidents = JSON.parse(localStorage.getItem('closedIncidents')) || [];

document.addEventListener("DOMContentLoaded", () => {
    checkDriverStatus();
    renderRescueView();
    renderCompanyView();
    renderProfileView();

    setInterval(() => {
        activeIncident = JSON.parse(localStorage.getItem('activeIncident')) || null;
        closedIncidents = JSON.parse(localStorage.getItem('closedIncidents')) || [];
        renderDriverTimeline();
        renderRescueView();
        renderCompanyView();
    }, 1000);
});

// التنقل بين الأقسام
function switchTab(tab) {
    document.getElementById('btnDriverTab').classList.toggle('active', tab === 'driver');
    document.getElementById('btnRescueTab').classList.toggle('active', tab === 'rescue');
    document.getElementById('btnCompanyTab').classList.toggle('active', tab === 'company');

    document.getElementById('driverView').classList.toggle('hidden', tab !== 'driver' && tab !== 'profile');
    document.getElementById('rescueView').classList.toggle('hidden', tab !== 'rescue');
    document.getElementById('companyView').classList.toggle('hidden', tab !== 'company');
    document.getElementById('profileView').classList.toggle('hidden', tab !== 'profile');

    if (tab === 'company') renderCompanyView();
    if (tab === 'profile') renderProfileView();
    if (tab === 'rescue') renderRescueView();
}

// حفظ بيانات السائق (تمت إضافة رقم الهاتف هنا)
function saveDriverInfo(e) {
    e.preventDefault();
    driverData = {
        name: document.getElementById('driverNameInput').value,
        phone: document.getElementById('driverPhoneInput').value,
        plate: document.getElementById('plateInput').value,
        truck: document.getElementById('truckInput').value
    };
    localStorage.setItem('driverData', JSON.stringify(driverData));
    checkDriverStatus();
}

// التحقق من حالة السائق
function checkDriverStatus() {
    if (!driverData) {
        document.getElementById('setupFormCard').classList.remove('hidden');
        document.getElementById('driverDashboard').classList.add('hidden');
        return;
    }

    document.getElementById('setupFormCard').classList.add('hidden');
    document.getElementById('driverDashboard').classList.remove('hidden');

    const firstName = driverData.name.split(' ')[0];
    document.getElementById('welcomeDriverName').innerText = `مرحباً، ${firstName}`;
    document.getElementById('welcomeTruckInfo').innerText = `${driverData.truck} — 6 ساعات قيادة اليوم`;
    document.getElementById('displayPlateTag').innerHTML = driverData.plate.replace(' ', '<br>');

    renderDriverTimeline();
}

// التحكم بالنافذة المنبثقة
function openEmergencyModal() {
    document.getElementById('emergencyModal').classList.remove('hidden');
}

function closeEmergencyModal() {
    document.getElementById('emergencyModal').classList.add('hidden');
}

// إنشاء بلاغ جديد
function createReport(title, severity) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    activeIncident = {
        id: Date.now(),
        driverName: driverData.name,
        driverPhone: driverData.phone || '',
        plate: driverData.plate,
        truck: driverData.truck,
        title: title,
        severity: severity,
        statusStep: 1, 
        assignedUnit: '',
        history: [{ step: 'بانتظار فريق', time: timeStr }]
    };

    localStorage.setItem('activeIncident', JSON.stringify(activeIncident));
    closeEmergencyModal();
    renderDriverTimeline();
    renderRescueView();
    renderCompanyView();
}

// عرض الخط الزمني للبلاغ النشط
function renderDriverTimeline() {
    const sosArea = document.getElementById('sosButtonArea');
    const tracker = document.getElementById('activeIncidentTracker');

    if (!activeIncident) {
        sosArea.classList.remove('hidden');
        tracker.classList.add('hidden');
        return;
    }

    sosArea.classList.add('hidden');
    tracker.classList.remove('hidden');

    document.getElementById('incidentTitle').innerText = activeIncident.title;
    
    const tagPill = document.getElementById('incidentTag');
    const badgeSeverity = document.getElementById('incidentStatusBadge');

    badgeSeverity.innerText = activeIncident.severity;
    badgeSeverity.className = `status-badge ${activeIncident.severity === 'حرجة' ? 'critical' : (activeIncident.severity === 'عالية' ? 'high' : 'normal')}`;

    if (activeIncident.statusStep === 1) {
        tagPill.innerText = "بانتظار فريق";
        tagPill.className = "status-pill orange";
    } else if (activeIncident.statusStep === 2) {
        tagPill.innerText = "تم قبول المهمة";
        tagPill.className = "status-pill orange";
    } else if (activeIncident.statusStep === 3) {
        tagPill.innerText = "الفريق في الطريق";
        tagPill.className = "status-pill orange";
    } else if (activeIncident.statusStep === 4) {
        tagPill.innerText = "وصل الفريق للموقع";
        tagPill.className = "status-pill green";
    }

    const unitEl = document.getElementById('assignedUnitText');
    if (activeIncident.assignedUnit) {
        unitEl.classList.remove('hidden');
        unitEl.innerText = `— تم التكليف: ${activeIncident.assignedUnit}`;
    } else {
        unitEl.classList.add('hidden');
    }

    const timelineContainer = document.getElementById('driverTimeline');
    timelineContainer.innerHTML = activeIncident.history.map((item, index) => {
        const isLast = index === activeIncident.history.length - 1;
        return `
            <div class="timeline-step">
                <div class="timeline-step-info">
                    <h4>${item.step}</h4>
                    <span>${item.time}</span>
                </div>
                <div class="timeline-marker">
                    <div class="dot-green"></div>
                    ${!isLast ? '<div class="line-connector"></div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// دالة عرض محطة ساسكو
function findNearestGasStation() {
    const resultBox = document.getElementById('gasResultBox');
    const statusText = document.getElementById('gasStatusText');

    resultBox.classList.remove('hidden');
    statusText.style.color = "#2ec4b6";
    statusText.innerHTML = `📍 <strong>أقرب محطة:</strong> محطة ساسكو 1 كم`;
}

// عرض واجهة الإنقاذ
function renderRescueView() {
    const activeList = document.getElementById('rescueActiveList');
    const closedList = document.getElementById('rescueClosedList');
    
    document.getElementById('activeCount').innerText = activeIncident ? 1 : 0;

    if (!activeIncident) {
        activeList.innerHTML = `<p style="color: #6c7a89; font-size: 13px; text-align: center;">لا توجد بلاغات نشطة حالياً.</p>`;
    } else {
        let actionBtnHTML = '';
        if (activeIncident.statusStep === 1) {
            actionBtnHTML = `<button class="action-btn yellow" onclick="updateRescueStatus(2, 'تم قبول المهمة', 'أمن الطرق — الوحدة 1')">قبول المهمة</button>`;
        } else if (activeIncident.statusStep === 2) {
            actionBtnHTML = `<button class="action-btn yellow" onclick="updateRescueStatus(3, 'الفريق في الطريق')">تحديث: الفريق في الطريق</button>`;
        } else if (activeIncident.statusStep === 3) {
            actionBtnHTML = `<button class="action-btn yellow" onclick="updateRescueStatus(4, 'وصل الفريق للموقع')">تحديث: وصلت إلى الموقع</button>`;
        } else if (activeIncident.statusStep === 4) {
            actionBtnHTML = `<button class="action-btn red" onclick="closeIncident()">إغلاق البلاغ</button>`;
        }

        const phoneCallTarget = activeIncident.driverPhone ? activeIncident.driverPhone : activeIncident.driverName;

        activeList.innerHTML = `
            <div class="rescue-card" style="background-color: #1e2229; border: 1px solid #2a2f38; border-radius: 12px; padding: 16px; margin-bottom: 15px;">
                <div style="text-align: center; margin-bottom: 12px;">
                    <span style="font-size: 13px; color: ${activeIncident.severity === 'حرجة' ? '#ff6b6b' : '#fca311'}; font-weight: bold;">
                        مهمة نشطة — ${activeIncident.severity} الأولوية
                    </span>
                    <h2 style="font-size: 18px; font-weight: bold; color: #fff; margin-top: 4px;">
                        ${activeIncident.title} • ${activeIncident.truck}
                    </h2>
                </div>

                <div style="background-color: #121418; border: 1px solid #2a2f38; border-radius: 10px; height: 140px; position: relative; margin-bottom: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; width: 100%; height: 1px; background: #22262e;"></div>
                    <div style="position: absolute; height: 100%; width: 1px; background: #22262e;"></div>
                    <div style="position: absolute; top: 30px; right: 90px; width: 12px; height: 12px; background-color: #2ec4b6; border-radius: 50%; box-shadow: 0 0 8px #2ec4b6;"></div>
                    <div style="position: absolute; bottom: 35px; left: 110px; width: 12px; height: 12px; background-color: #ff4d4d; border-radius: 50%; box-shadow: 0 0 8px #ff4d4d;"></div>
                </div>

                <div style="background-color: #16181c; border: 1px solid #2a2f38; border-radius: 8px; padding: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <strong style="display: block; font-size: 14px; color: #fff;">${activeIncident.driverName} ${activeIncident.driverPhone ? '— ' + activeIncident.driverPhone : ''}</strong>
                        <span style="font-size: 12px; color: #8b98a5;">${activeIncident.truck} — لوحة ${activeIncident.plate}</span>
                    </div>
                    <a href="tel:${phoneCallTarget}" style="color: #2ec4b6; font-size: 13px; text-decoration: none; font-weight: bold;">اتصال 📞</a>
                </div>

                <div style="margin-top: 15px;">
                    ${actionBtnHTML}
                </div>
            </div>
        `;
    }

    if (closedIncidents.length === 0) {
        closedList.innerHTML = `<p style="color: #6c7a89; font-size: 13px; text-align: center;">لا توجد بلاغات مغلقة مؤخراً.</p>`;
    } else {
        closedList.innerHTML = closedIncidents.map(inc => `
            <div class="closed-item">
                <span style="font-size: 14px; font-weight: bold; color: #fff;">${inc.title} — ${inc.driverName.split(' ')[0]}</span>
                <span class="closed-badge">تم إغلاق البلاغ</span>
            </div>
        `).join('');
    }
}

// تحديث حالة البلاغ
function updateRescueStatus(step, stepText, unit = '') {
    if (!activeIncident) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    activeIncident.statusStep = step;
    if (unit) activeIncident.assignedUnit = unit;
    
    activeIncident.history.push({ step: stepText, time: timeStr });
    localStorage.setItem('activeIncident', JSON.stringify(activeIncident));

    renderDriverTimeline();
    renderRescueView();
    renderCompanyView();
}

// إغلاق وتخزين البلاغ
function closeIncident() {
    if (!activeIncident) return;

    closedIncidents.unshift(activeIncident);
    localStorage.setItem('closedIncidents', JSON.stringify(closedIncidents));

    activeIncident = null;
    localStorage.removeItem('activeIncident');

    renderDriverTimeline();
    renderRescueView();
    renderCompanyView();
}

// عرض واجهة الشركة
function renderCompanyView() {
    document.getElementById('companyActiveCount').innerText = activeIncident ? 1 : 0;
    document.getElementById('companyClosedCount').innerText = closedIncidents.length;

    const companyViewContainer = document.getElementById('companyView');
    
    // التحقق من وجود الحاوية أو إنشائها داخل اللوحة بشكل صحيح
    let companyContentBox = document.getElementById('companyContentBox');
    if (!companyContentBox) {
        companyContentBox = document.createElement('div');
        companyContentBox.id = 'companyContentBox';
        companyContentBox.style.cssText = "margin-top: 15px;";
        companyViewContainer.appendChild(companyContentBox);
    }

    let driverRowHTML = '';
    if (driverData) {
        let statusHTML = activeIncident ? 
            `<span style="background-color: #5c1d1d; color: #ff8b8b; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">بلاغ نشط</span>` : 
            `<span style="background-color: #1b4d3e; color: #2ec4b6; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">متحرك</span>`;

        driverRowHTML = `
            <tr style="border-bottom: 1px solid #262a33;">
                <td style="padding: 12px 0; font-weight: bold;">${driverData.name}</td>
                <td style="padding: 12px 0; color: #8b98a5; line-height: 1.2;">${driverData.truck}</td>
                <td style="padding: 12px 0;">${statusHTML}</td>
                <td style="padding: 12px 0; color: #8b98a5;">الآن</td>
            </tr>
        `;
    } else {
        driverRowHTML = `
            <tr>
                <td colspan="4" style="padding: 15px 0; text-align: center; color: #8b98a5; font-size: 13px;">لم يتم تسجيل أي سائق بعد.</td>
            </tr>
        `;
    }

    companyContentBox.innerHTML = `
        <div style="background-color: #1e2229; border: 1px solid #2a2f38; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: bold; color: #fff; margin-bottom: 12px;">مواقع الأسطول المباشرة</div>
            <div style="background-color: #121418; border: 1px solid #2a2f38; border-radius: 10px; height: 160px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <div style="position: absolute; width: 100%; height: 1px; background: #22262e;"></div>
                <div style="position: absolute; height: 100%; width: 1px; background: #22262e;"></div>
                <div style="position: absolute; top: 35px; left: 40px; width: 10px; height: 10px; background-color: #2ec4b6; border-radius: 50%; box-shadow: 0 0 6px #2ec4b6;"></div>
                <div style="position: absolute; top: 85px; right: 70px; width: 10px; height: 10px; background-color: #2ec4b6; border-radius: 50%; box-shadow: 0 0 6px #2ec4b6;"></div>
            </div>
        </div>

        <div style="background-color: #1e2229; border: 1px solid #2a2f38; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 14px; font-weight: bold; color: #fff; margin-bottom: 12px;">حالة السائقين والأسطول</div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: right; color: #fff; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 1px solid #2a2f38; color: #8b98a5; font-size: 12px;">
                            <th style="padding-bottom: 10px; font-weight: normal;">السائق</th>
                            <th style="padding-bottom: 10px; font-weight: normal;">الشاحنة</th>
                            <th style="padding-bottom: 10px; font-weight: normal;">الحالة</th>
                            <th style="padding-bottom: 10px; font-weight: normal;">آخر تحديث</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${driverRowHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
// عرض الملف الشخصي
function renderProfileView() {
    if (!driverData) return;
    document.getElementById('profName').innerText = driverData.name;
    document.getElementById('profPlate').innerText = driverData.plate;
    document.getElementById('profTruck').innerText = driverData.truck;
}

// مسح البيانات
function resetDriverData() {
    if (confirm("هل أنت متأكد من مسح البيانات وإعادة التجربة من جديد؟")) {
        localStorage.clear();
        driverData = null;
        activeIncident = null;
        closedIncidents = [];
        switchTab('driver');
        checkDriverStatus();
    }
}