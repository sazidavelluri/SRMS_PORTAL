// --- Pure Frontend Persistence Layer ---
// Initializes a local "Database" in the browser's localStorage

const INITIAL_DB = {
    students: [],
    tickets: []
};

function getDB() {
    const db = localStorage.getItem('srms_db');
    if (!db) {
        localStorage.setItem('srms_db', JSON.stringify(INITIAL_DB));
        return INITIAL_DB;
    }
    return JSON.parse(db);
}

function saveDB(data) {
    localStorage.setItem('srms_db', JSON.stringify(data));
}

// --- Toast Notification ---
function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(t);
    setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateY(-20px)';
        setTimeout(() => t.remove(), 400);
    }, 3000);
}

// --- Modal System ---
function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
        m.classList.remove('hidden');
        requestAnimationFrame(() => m.classList.add('open'));
    }
}

function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
        m.classList.remove('open');
        setTimeout(() => m.classList.add('hidden'), 300);
    }
}

// --- Auth Handlers ---
async function handleLogin(e, role) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Verifying...';
    submitBtn.disabled = true;

    // Simulate Network Delay
    await new Promise(r => setTimeout(r, 600));

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    let success = false;
    let redirect = '';
    let sessionData = {};

    if (role === 'admin') {
        if (data.id === '90632' && data.pass === '180406') {
            success = true;
            sessionData = { role: 'admin' };
            redirect = 'admin.html';
        } else {
            showToast('Invalid Admin ID or Passcode', 'error');
        }
    }
    else if (role === 'student') {
        const db = getDB();
        const student = db.students.find(s => s.roll === data.roll);

        // Check PASSWORD against DOB
        if (student) {
            if (data.pass === student.dob) {
                success = true;
                sessionData = { role: 'student', roll: student.roll };
                redirect = 'student.html';
            } else {
                showToast('Invalid Password (Use DOB: YYYY-MM-DD)', 'error');
            }
        } else {
            showToast('Student Not Found', 'error');
        }
    }
    else if (role === 'parent') {
        // Parent Login: Find student by Parent Mobile, then check Password (DOB)
        const db = getDB();
        const student = db.students.find(s => s.p_mobile === data.mobile);

        if (student) {
            if (data.pass === student.dob) {
                success = true;
                sessionData = { role: 'parent', child_roll: student.roll };
                redirect = 'parent.html';
            } else {
                showToast('Invalid Password (Use Child DOB)', 'error');
            }
        } else {
            showToast('Mobile Number Not Registered', 'error');
        }
    }

    if (success) {
        showToast('Login Successful!');
        localStorage.setItem('srms_user', JSON.stringify(sessionData));
        setTimeout(() => window.location.href = redirect, 500);
    } else {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

// --- Student Logic ---
async function loadStudentDetails() {
    const user = JSON.parse(localStorage.getItem('srms_user'));
    if (!user) return window.location.href = 'index.html';

    const roll = user.role === 'student' ? user.roll : user.child_roll;
    const db = getDB();
    const data = db.students.find(s => s.roll === roll);

    if (!data) return showToast('User not found in Database', 'error');

    ['name', 'roll', 'branch', 'section', 'sem', 'cgpa'].forEach(id => {
        const el = document.getElementById(`display-${id}`);
        if (el) el.innerText = data[id] || '-';
    });

    const detailsContainer = document.getElementById('details-grid');
    if (detailsContainer) {
        detailsContainer.className = 'details-grid-view';
        detailsContainer.innerHTML = `
            ${createDetailCard('Full Name', data.name)}
            ${createDetailCard('Roll Number', data.roll)}
            ${createDetailCard('Date of Birth', data.dob)}
            ${createDetailCard('Contact Mobile', data.mobile)}
            ${createDetailCard('Branch', data.branch)}
            ${createDetailCard('Program', data.degree)}
            ${createDetailCard('Current Semester', data.sem)}
            ${createDetailCard('CGPA', data.cgpa)}
            ${createDetailCard('Club Activity', data.club)}
            ${createDetailCard("Father's Name", data.father)}
            ${createDetailCard("Mother's Name", data.mother)}
            ${createDetailCard('Parent Mobile', data.p_mobile)}
        `;
    }

    // Pre-fill fields
    const mobileInput = document.getElementById('update-mobile-input');
    if (mobileInput) mobileInput.value = data.mobile;

    // Render Attendance
    const attendanceContainer = document.getElementById('attendance-display');
    if (attendanceContainer) {
        // Attendance Mock Logic (Randomized for demo if not set)
        const att = data.attendance || '85%';
        attendanceContainer.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); padding:1.5rem; border-radius:12px;">
                <div>
                    <h4 style="margin:0;">Overall Attendance</h4>
                    <p style="margin:0; font-size:0.9rem;">Current Semester</p>
                </div>
                <div style="font-size:2.5rem; font-weight:700; color:${parseInt(att) > 75 ? '#4ade80' : '#facc15'};">
                    ${att}
                </div>
            </div>
        `;
    }

    // Render Exam Results
    const resultsContainer = document.getElementById('exam-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                <tr style="background:rgba(255,255,255,0.05); text-align:left;">
                    <th style="padding:12px;">Subject</th>
                    <th style="padding:12px;">Marks</th>
                    <th style="padding:12px;">Grade</th>
                </tr>
                <tr><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">Data Structures</td><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">85/100</td><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); color:#4ade80;">A</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">Operating Systems</td><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">78/100</td><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); color:#a3e635;">B+</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">Database Mgmt</td><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">92/100</td><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); color:#4ade80;">O</td></tr>
                <tr><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">Mathematics III</td><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">65/100</td><td style="padding:12px; border-bottom:1px solid rgba(255,255,255,0.05); color:#facc15;">C</td></tr>
                <tr><td style="padding:12px;">Soft Skills</td><td style="padding:12px;">88/100</td><td style="padding:12px; color:#4ade80;">A</td></tr>
            </table>
        `;
    }
}

function createDetailCard(label, value) {
    return `
        <div class="detail-card">
            <div class="detail-label">${label}</div>
            <div class="detail-value">${value || '-'}</div>
        </div>
    `;
}

async function updateMobile(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('srms_user'));
    const newMobile = document.getElementById('update-mobile-input').value;

    const otp = prompt("Enter Verification OTP:");
    if (otp) {
        const db = getDB();
        const studentIndex = db.students.findIndex(s => s.roll === user.roll);
        if (studentIndex !== -1) {
            db.students[studentIndex].mobile = newMobile;
            saveDB(db);
            showToast('Mobile Number Updated & Saved!');
            loadStudentDetails();
        }
    }
}

async function raiseTicket(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('srms_user'));
    const issue = document.getElementById('ticket-issue').value;

    const db = getDB();
    db.tickets.unshift({
        id: Date.now(),
        type: user.role === 'student' ? 'Student' : 'Parent',
        roll: user.role === 'student' ? user.roll : user.child_roll,
        issue: issue,
        status: 'Open'
    });
    saveDB(db);

    showToast('Ticket Generated Successfully!');
    e.target.reset();
}

// --- Admin Logic ---
async function loadAdmin() {
    const user = JSON.parse(localStorage.getItem('srms_user'));
    if (!user || user.role !== 'admin') return window.location.href = 'index.html';

    const db = getDB();

    // Render Students
    const sContainer = document.getElementById('student-list');
    if (sContainer) {
        if (db.students.length === 0) {
            sContainer.innerHTML = '<div style="padding:1rem; text-align:center;">No students found</div>';
        } else {
            sContainer.innerHTML = db.students.map(s => `
                <div class="list-item">
                    <div>
                        <div style="font-weight:600; font-size:1.1rem;">${s.name}</div>
                        <div style="font-size:0.9rem; color:var(--text-muted);">${s.roll} | ${s.branch}</div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="secondary-btn" style="width:auto; padding:8px 16px; margin:0;" 
                            onclick="openEditStudentModal('${s.roll}', '${s.name}')">Edit</button>
                        <button class="secondary-btn" style="width:auto; padding:8px 16px; margin:0; background:rgba(239, 68, 68, 0.2); color:#ef4444;" 
                            onclick="deleteStudent('${s.roll}')">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Render Tickets
    const tContainer = document.getElementById('ticket-list');
    if (tContainer) {
        if (db.tickets.length === 0) {
            tContainer.innerHTML = '<div style="padding:1rem; text-align:center;">No tickets found</div>';
        } else {
            tContainer.innerHTML = db.tickets.map(t => `
                 <div class="list-item">
                    <div style="width:100%">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:600">${t.type} (${t.roll})</span>
                            <span style="font-size:0.8rem; background: ${t.status === 'Open' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}; color: ${t.status === 'Open' ? '#ef4444' : '#10b981'}; padding: 2px 8px; border-radius:12px;">${t.status}</span>
                        </div>
                        <p style="font-size: 0.95rem;">${t.issue}</p>
                    </div>
                </div>
            `).join('');
        }
    }
}

// --- Admin Actions ---
async function deleteStudent(roll) {
    if (confirm('Are you sure you want to delete this student? This cannot be undone.')) {
        const db = getDB();
        db.students = db.students.filter(s => s.roll !== roll);
        saveDB(db);
        showToast('Student Deleted Successfully');
        loadAdmin();
    }
}

// --- Admin Modals ---
function openAddStudentModal() { openModal('add-student-modal'); }

async function submitAddStudent(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const db = getDB();
    // Basic validation
    if (db.students.find(s => s.roll === data.roll)) {
        showToast('Roll Number already exists!', 'error');
        return;
    }

    const newStudent = {
        ...data, // name, roll, dob, p_mobile, branch, section, fees, cgpa
        sem: '1', mobile: '0000000000',
        degree: 'B.Tech', club: 'None', father: '-', mother: '-',
        fee_status: 'Pending', attendance: '85%'
    };

    db.students.push(newStudent);
    saveDB(db);

    showToast('Student Added Successfully!');
    closeModal('add-student-modal');
    e.target.reset();
    loadAdmin();
}

function openEditStudentModal(roll, name) {
    const db = getDB();
    const student = db.students.find(s => s.roll === roll);
    if (!student) return;

    document.getElementById('edit-roll').value = student.roll;
    document.getElementById('edit-name').value = student.name;
    document.getElementById('edit-dob').value = student.dob || '';
    document.getElementById('edit-p_mobile').value = student.p_mobile || '';
    document.getElementById('edit-branch').value = student.branch || '';
    document.getElementById('edit-section').value = student.section || '';
    document.getElementById('edit-fees').value = student.fees || '';

    // CGPA field might not exist if user didn't refresh or if HTML update failed, check safely
    const cgpaInput = document.getElementById('edit-cgpa');
    if (cgpaInput) cgpaInput.value = student.cgpa || '';

    openModal('edit-student-modal');
}

async function submitEditStudent(e) {
    e.preventDefault();
    const roll = document.getElementById('edit-roll').value;

    // Gather all updated values
    const name = document.getElementById('edit-name').value;
    const dob = document.getElementById('edit-dob').value;
    const p_mobile = document.getElementById('edit-p_mobile').value;
    const branch = document.getElementById('edit-branch').value;
    const section = document.getElementById('edit-section').value;
    const fees = document.getElementById('edit-fees').value;

    const cgpaInput = document.getElementById('edit-cgpa');
    const cgpa = cgpaInput ? cgpaInput.value : '';

    const db = getDB();
    const idx = db.students.findIndex(s => s.roll === roll);
    if (idx !== -1) {
        db.students[idx] = {
            ...db.students[idx],
            name, dob, p_mobile, branch, section, fees, cgpa
        };
        saveDB(db);
        showToast('Student Details Updated!');
        closeModal('edit-student-modal');
        loadAdmin();
    }
}

// --- Payment Logic ---
function openPayFeeModal() {
    // Get current student
    const user = JSON.parse(localStorage.getItem('srms_user'));
    const roll = user.role === 'parent' ? user.child_roll : user.roll;
    const db = getDB();
    const student = db.students.find(s => s.roll === roll);

    if (!student) return;

    // Update Modal Content with Dynamic Info
    const amount = parseInt(student.fees || 45000);
    const gst = Math.round(amount * 0.18);
    const total = amount + gst;

    const container = document.getElementById('fee-breakdown');
    if (container) {
        if (student.fee_status === 'Paid') {
            container.innerHTML = `<div style="text-align:center; padding:1rem; color:#4ade80; font-weight:bold; font-size:1.2rem;">Fees Already Paid! 🎉</div>`;
            document.getElementById('pay-btn').style.display = 'none';
        } else {
            container.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span>Tuition Fee</span>
                    <span style="font-weight:600">₹ ${amount.toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between; color:var(--primary);">
                    <span>GST (18%)</span>
                    <span>₹ ${gst.toLocaleString()}</span>
                </div>
                <hr style="border-color:rgba(255,255,255,0.1); margin:10px 0;">
                <div style="display:flex; justify-content:space-between; font-size:1.2rem; font-weight:700;">
                    <span>Total Payable</span>
                    <span>₹ ${total.toLocaleString()}</span>
                </div>
            `;
            const payBtn = document.getElementById('pay-btn');
            if (payBtn) payBtn.style.display = 'block';
        }
    }

    openModal('pay-fee-modal');
}

function processPayment(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn.style.display === 'none') return;

    btn.innerHTML = 'Processing...';
    btn.disabled = true;

    setTimeout(() => {
        // Update DB status
        const user = JSON.parse(localStorage.getItem('srms_user'));
        const roll = user.role === 'parent' ? user.child_roll : user.roll;

        const db = getDB();
        const idx = db.students.findIndex(s => s.roll === roll);
        if (idx !== -1) {
            db.students[idx].fee_status = 'Paid';
            saveDB(db);
        }

        showToast('Payment Successful! Receipt Sent.', 'success');
        closeModal('pay-fee-modal');
        btn.innerHTML = 'Secure Pay';
        btn.disabled = false;
        e.target.reset();

        // Refresh UI if on parent page
        if (user.role === 'parent') location.reload();
    }, 1500);
}

// --- Init ---
function dataInit(page) {
    if (page === 'student') loadStudentDetails();
    if (page === 'admin') loadAdmin();
}
