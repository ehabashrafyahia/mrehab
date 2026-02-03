let questions = JSON.parse(localStorage.getItem('pharaoh_db')) || [
    {q: "السؤال الأول؟", options: ["خيار 1", "خيار 2", "خيار 3", "خيار 4"], correct: 0}
];

function save() { 
    localStorage.setItem('pharaoh_db', JSON.stringify(questions)); 
}

function renderAdmin() {
    const list = document.getElementById('questions-list');
    list.innerHTML = questions.map((q, i) => `
        <div style="background:rgba(255,255,255,0.05); padding:15px; margin-bottom:15px; border-right:4px solid gold;">
            <input type="text" style="width:100%; padding:10px; margin-bottom:10px;" value="${q.q}" onchange="questions[${i}].q = this.value; save()" placeholder="نص السؤال">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                ${q.options.map((opt, oi) => `<input type="text" style="padding:8px;" value="${opt}" onchange="questions[${i}].options[${oi}] = this.value; save()">`).join('')}
            </div>
            <select style="width:100%; margin-top:10px; padding:8px;" onchange="questions[${i}].correct = this.value; save()">
                ${q.options.map((_, oi) => `<option value="${oi}" ${q.correct == oi ? 'selected' : ''}>الإجابة الصحيحة رقم ${oi+1}</option>`).join('')}
            </select>
        </div>
    `).join('');
}

function addQuestion() {
    questions.push({q: "", options: ["", "", "", ""], correct: 0});
    save(); renderAdmin();
}

function startWorld() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    loadQuestion(0);
}

function loadQuestion(idx) {
    if(idx >= questions.length) {
        alert("انتهت الأسئلة! لقد نلت رضا الآلهة.");
        location.reload();
        return;
    }
    const q = questions[idx];
    document.getElementById('q-text').innerText = q.q;
    const grid = document.getElementById('options-grid');
    grid.innerHTML = q.options.map((opt, i) => `
        <button class="ancient-btn" onclick="check(${idx}, ${i})">${opt}</button>
    `).join('');
}

function check(qIdx, optIdx) {
    if(optIdx == questions[qIdx].correct) {
        loadQuestion(qIdx + 1);
    } else {
        alert("إجابة خاطئة! حاول مرة أخرى.");
        location.reload();
    }
}

renderAdmin();
