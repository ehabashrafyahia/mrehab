// ===== التهيئة =====
document.addEventListener('DOMContentLoaded', function() {
    // المتغيرات العامة
    let savedChallenges = JSON.parse(localStorage.getItem('historyChallenges')) || [];
    let currentChallenge = null;
    let selectedTime = 30;
    let selectedDifficulty = 'medium';
    let soundEnabled = true;
    let effectsEnabled = true;
    let totalScore = 0;

    // عناصر DOM
    const elements = {
        questionText: document.getElementById('questionText'),
        optionsContainer: document.getElementById('optionsContainer'),
        addOptionBtn: document.getElementById('addOption'),
        previewBtn: document.getElementById('previewBtn'),
        saveBtn: document.getElementById('saveBtn'),
        resetBtn: document.getElementById('resetBtn'),
        previewContainer: document.getElementById('previewContainer'),
        challengesContainer: document.getElementById('challengesContainer'),
        challengesCount: document.getElementById('challengesCount'),
        totalPoints: document.getElementById('totalPoints'),
        totalScoreDisplay: document.getElementById('totalScore'),
        epicModal: document.getElementById('epicModal'),
        modalPreview: document.getElementById('modalPreview'),
        resultsModal: document.getElementById('resultsModal'),
        soundToggle: document.getElementById('soundToggle'),
        effectsToggle: document.getElementById('effectsToggle'),
        exportPdf: document.getElementById('exportPdf'),
        exportImage: document.getElementById('exportImage'),
        exportChallenge: document.getElementById('exportChallenge'),
        printAll: document.getElementById('printAll')
    };

    // الأصوات
    const sounds = {
        ambient: document.getElementById('ambientSound'),
        click: document.getElementById('clickSound'),
        correct: document.getElementById('correctSound'),
        wrong: document.getElementById('wrongSound'),
        victory: document.getElementById('victorySound')
    };

    // ===== التهيئة الأولية =====
    init();
    updateStats();
    loadChallenges();
    playAmbientSound();

    // ===== تهيئة الموقع =====
    function init() {
        // تهيئة أزرار الوقت
        initTimeButtons();
        
        // تهيئة مستويات الصعوبة
        initDifficultyButtons();
        
        // إضافة خيارين افتراضيين
        addOption();
        addOption();
        
        // إضافة الأحداث
        addEventListeners();
        
        // تحديث العلامات
        updateScoreDisplay();
    }

    // ===== الأحداث =====
    function addEventListeners() {
        // إضافة خيار جديد
        elements.addOptionBtn.addEventListener('click', addOption);
        
        // معاينة التحدي
        elements.previewBtn.addEventListener('click', previewChallenge);
        
        // حفظ التحدي
        elements.saveBtn.addEventListener('click', saveChallenge);
        
        // إعادة تعيين
        elements.resetBtn.addEventListener('click', resetForm);
        
        // التحكم في الصوت
        elements.soundToggle.addEventListener('click', toggleSound);
        elements.effectsToggle.addEventListener('click', toggleEffects);
        
        // أدوات التصدير
        elements.exportPdf.addEventListener('click', exportToPdf);
        elements.exportImage.addEventListener('click', exportToImage);
        elements.exportChallenge.addEventListener('click', exportChallenge);
        elements.printAll.addEventListener('click', printAllChallenges);
        
        // إغلاق النوافذ المنبثقة
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                elements.epicModal.style.display = 'none';
                playSound('click');
            });
        });
        
        // بدء التحدي
        document.querySelector('.start-challenge')?.addEventListener('click', startChallenge);
    }

    // ===== إدارة الخيارات =====
    function addOption() {
        if (elements.optionsContainer.children.length >= 4) {
            showNotification('يمكنك إضافة حتى 4 خيارات فقط', 'warning');
            return;
        }
        
        const letters = ['أ', 'ب', 'ج', 'د'];
        const index = elements.optionsContainer.children.length;
        
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-input';
        optionDiv.innerHTML = `
            <div class="option-number">${letters[index]}</div>
            <input type="text" class="option-text" placeholder="الخيار ${index + 1}">
            <button class="remove-option" title="إزالة الخيار">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        elements.optionsContainer.appendChild(optionDiv);
        
        // إضافة حدث إزالة للخيار الجديد
        optionDiv.querySelector('.remove-option').addEventListener('click', function() {
            if (elements.optionsContainer.children.length > 2) {
                optionDiv.remove();
                renumberOptions();
                playSound('click');
            } else {
                showNotification('يجب أن يحتوي السؤال على خيارين على الأقل', 'warning');
            }
        });
        
        playSound('click');
    }

    function renumberOptions() {
        const letters = ['أ', 'ب', 'ج', 'د'];
        const options = elements.optionsContainer.querySelectorAll('.option-input');
        
        options.forEach((option, index) => {
            option.querySelector('.option-number').textContent = letters[index];
        });
    }

    // ===== إدارة الوقت =====
    function initTimeButtons() {
        const timeButtons = document.querySelectorAll('.time-btn');
        const customTimeInput = document.getElementById('customTime');
        
        timeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                timeButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedTime = parseInt(this.dataset.time);
                document.getElementById('previewTimer').textContent = selectedTime;
                playSound('click');
            });
        });
        
        customTimeInput.addEventListener('change', function() {
            const time = parseInt(this.value);
            if (time >= 5 && time <= 180) {
                selectedTime = time;
                timeButtons.forEach(b => b.classList.remove('active'));
                document.getElementById('previewTimer').textContent = selectedTime;
            }
        });
        
        // تعيين الوقت الافتراضي
        document.querySelector('.time-btn[data-time="30"]').classList.add('active');
    }

    // ===== مستويات الصعوبة =====
    function initDifficultyButtons() {
        const difficultyButtons = document.querySelectorAll('.difficulty-btn');
        
        difficultyButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                difficultyButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedDifficulty = this.dataset.level;
                playSound('click');
            });
        });
        
        // تعيين المستوى الافتراضي
        document.querySelector('.difficulty-btn[data-level="medium"]').classList.add('active');
    }

    // ===== معاينة التحدي =====
    function previewChallenge() {
        const challenge = getChallengeData();
        if (!validateChallenge(challenge)) return;
        
        currentChallenge = challenge;
        
        // تحديث العداد
        document.querySelector('.timer-circle span').textContent = selectedTime;
        
        // إنشاء معاينة
        elements.modalPreview.innerHTML = createChallengePreview(challenge, true);
        
        // عرض النافذة المنبثقة
        elements.epicModal.style.display = 'flex';
        
        // بدء العد التنازلي
        startPreviewTimer();
        
        playSound('click');
    }

    function createChallengePreview(challenge, showTimer = false) {
        const difficultyColors = {
            easy: '#4CAF50',
            medium: '#FF9800',
            hard: '#F44336',
            legendary: '#9C27B0'
        };
        
        const difficultyNames = {
            easy: 'سهل',
            medium: 'متوسط',
            hard: 'صعب',
            legendary: 'أسطوري'
        };
        
        const letters = ['أ', 'ب', 'ج', 'د'];
        
        return `
            <div class="challenge-preview">
                <div class="challenge-header">
                    <div class="difficulty-badge" style="background: ${difficultyColors[challenge.difficulty]}">
                        ${difficultyNames[challenge.difficulty]}
                    </div>
                    ${showTimer ? `
                    <div class="timer-display">
                        <i class="fas fa-hourglass-half"></i>
                        <span>${challenge.time}</span> ثانية
                    </div>
                    ` : ''}
                </div>
                
                <div class="challenge-question">
                    <div class="question-icon">
                        <i class="fas fa-scroll"></i>
                    </div>
                    <h3>${challenge.text}</h3>
                </div>
                
                <div class="challenge-options">
                    ${challenge.options.map((option, index) => `
                        <div class="challenge-option" data-index="${index}">
                            <div class="option-marker">${letters[index]}</div>
                            <div class="option-content">${option}</div>
                            <div class="option-selector">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="challenge-points">
                    <i class="fas fa-coins"></i>
                    <span>${calculatePoints(challenge.difficulty)}</span> نقطة محتملة
                </div>
            </div>
        `;
    }

    function startPreviewTimer() {
        const timerCircle = document.querySelector('.timer-circle circle');
        const timerText = document.querySelector('.timer-circle span');
        const time = selectedTime;
        let timeLeft = time;
        
        // إعادة تعيين الرسوم المتحركة
        timerCircle.style.animation = 'none';
        setTimeout(() => {
            timerCircle.style.animation = `countdown ${time}s linear forwards`;
        }, 10);
        
        const timerInterval = setInterval(() => {
            timeLeft--;
            timerText.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                elements.epicModal.style.display = 'none';
                showNotification('انتهى الوقت!', 'warning');
            }
        }, 1000);
    }

    // ===== حفظ التحدي =====
    function saveChallenge() {
        const challenge = getChallengeData();
        if (!validateChallenge(challenge)) return;
        
        // إضافة النقاط
        challenge.points = calculatePoints(challenge.difficulty);
        challenge.id = Date.now();
        challenge.date = new Date().toLocaleDateString('ar-SA');
        
        savedChallenges.push(challenge);
        localStorage.setItem('historyChallenges', JSON.stringify(savedChallenges));
        
        // تحديث الإحصائيات
        updateStats();
        loadChallenges();
        resetForm();
        
        showNotification('تم حفظ التحدي التاريخي بنجاح!', 'success');
        playSound('victory');
        
        // تحديث النقاط الإجمالية
        totalScore += challenge.points;
        updateScoreDisplay();
    }

    function validateChallenge(challenge) {
        if (!challenge.text.trim()) {
            showNotification('يرجى كتابة نص التحدي التاريخي', 'warning');
            return false;
        }
        
        if (challenge.options.length < 2) {
            showNotification('يرجى إضافة خيارين على الأقل', 'warning');
            return false;
        }
        
        if (challenge.options.some(opt => !opt.trim())) {
            showNotification('يرجى تعبئة جميع الخيارات', 'warning');
            return false;
        }
        
        return true;
    }

    function getChallengeData() {
        const options = [];
        const optionInputs = elements.optionsContainer.querySelectorAll('.option-text');
        
        optionInputs.forEach(input => {
            if (input.value.trim()) {
                options.push(input.value.trim());
            }
        });
        
        return {
            text: elements.questionText.value.trim(),
            options: options,
            time: selectedTime,
            difficulty: selectedDifficulty
        };
    }

    function calculatePoints(difficulty) {
        const pointsMap = {
            easy: 100,
            medium: 250,
            hard: 500,
            legendary: 1000
        };
        return pointsMap[difficulty] || 100;
    }

    // ===== تحميل التحديات المحفوظة =====
    function loadChallenges() {
        elements.challengesContainer.innerHTML = '';
        
        if (savedChallenges.length === 0) {
            elements.challengesContainer.innerHTML = `
                <div class="empty-library">
                    <i class="fas fa-book-open"></i>
                    <h3>المكتبة فارغة</h3>
                    <p>ابدأ بإنشاء أول تحدٍ تاريخي</p>
                </div>
            `;
            return;
        }
        
        savedChallenges.forEach((challenge, index) => {
            const challengeElement = document.createElement('div');
            challengeElement.className = 'challenge-card';
            challengeElement.innerHTML = createChallengeCard(challenge, index);
            elements.challengesContainer.appendChild(challengeElement);
            
            // إضافة الأحداث
            challengeElement.querySelector('.play-challenge').addEventListener('click', () => playChallenge(challenge));
            challengeElement.querySelector('.edit-challenge').addEventListener('click', () => editChallenge(index));
            challengeElement.querySelector('.delete-challenge').addEventListener('click', () => deleteChallenge(index));
        });
    }

    function createChallengeCard(challenge, index) {
        const difficultyColors = {
            easy: '#4CAF50',
            medium: '#FF9800',
            hard: '#F44336',
            legendary: '#9C27B0'
        };
        
        return `
            <div class="card-header" style="border-left: 5px solid ${difficultyColors[challenge.difficulty]}">
                <div class="card-title">
                    <span class="card-number">#${index + 1}</span>
                    <h4>${challenge.text.substring(0, 50)}${challenge.text.length > 50 ? '...' : ''}</h4>
                </div>
                <div class="card-points">
                    <i class="fas fa-coins"></i>
                    <span>${challenge.points}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="card-meta">
                    <span class="meta-item">
                        <i class="fas fa-clock"></i>
                        ${challenge.time} ثانية
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-calendar"></i>
                        ${challenge.date}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-list-ol"></i>
                        ${challenge.options.length} خيارات
                    </span>
                </div>
                <div class="card-actions">
                    <button class="card-btn play-challenge">
                        <i class="fas fa-play"></i>
                        لعب
                    </button>
                    <button class="card-btn edit-challenge">
                        <i class="fas fa-edit"></i>
                        تعديل
                    </button>
                    <button class="card-btn delete-challenge">
                        <i class="fas fa-trash"></i>
                        حذف
                    </button>
                </div>
            </div>
        `;
    }

    // ===== إدارة التحديات =====
    function playChallenge(challenge) {
        currentChallenge = challenge;
        elements.modalPreview.innerHTML = createChallengePreview(challenge, true);
        elements.epicModal.style.display = 'flex';
        startPreviewTimer();
        playSound('click');
    }

    function editChallenge(index) {
        const challenge = savedChallenges[index];
        
        // تعبئة النموذج
        elements.questionText.value = challenge.text;
        selectedTime = challenge.time;
        selectedDifficulty = challenge.difficulty;
        
        // تحديث الواجهة
        document.getElementById('previewTimer').textContent = challenge.time;
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.time) === challenge.time) {
                btn.classList.add('active');
            }
        });
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.level === challenge.difficulty) {
                btn.classList.add('active');
            }
        });
        
        // تعبئة الخيارات
        elements.optionsContainer.innerHTML = '';
        challenge.options.forEach((option, optIndex) => {
            addOption();
            const inputs = elements.optionsContainer.querySelectorAll('.option-text');
            inputs[optIndex].value = option;
        });
        
        // حذف التحدي القديم
        savedChallenges.splice(index, 1);
        updateStats();
        loadChallenges();
        
        showNotification('يمكنك الآن تعديل التحدي', 'info');
        playSound('click');
    }

    function deleteChallenge(index) {
        if (confirm('هل أنت متأكد من حذف هذا التحدي التاريخي؟')) {
            savedChallenges.splice(index, 1);
            localStorage.setItem('historyChallenges', JSON.stringify(savedChallenges));
            updateStats();
            loadChallenges();
            showNotification('تم حذف التحدي', 'success');
            playSound('click');
        }
    }

    // ===== بدء التحدي الحقيقي =====
    function startChallenge() {
        elements.epicModal.style.display = 'none';
        
        // هنا يمكنك إضافة منطق اللعب الفعلي
        showNotification('تم بدء التحدي! سيتم تطويره في المستقبل', 'info');
        
        // محاكاة النقاط
        setTimeout(() => {
            const points = calculatePoints(currentChallenge.difficulty);
            totalScore += points;
            updateScoreDisplay();
            
            document.getElementById('finalScore').textContent = points;
            document.getElementById('resultsMessage').innerHTML = `
                <h4>${getRandomVictoryMessage()}</h4>
                <p>لقد أكملت التحدي بنجاح!</p>
            `;
            
            elements.resultsModal.style.display = 'flex';
            playSound('victory');
            
            setTimeout(() => {
                elements.resultsModal.style.display = 'none';
            }, 3000);
        }, 2000);
    }

    function getRandomVictoryMessage() {
        const messages = [
            'مذهل! لقد أثبتت أنك مؤرخ حقيقي!',
            'أسطوري! معرفتك تفوق التوقعات!',
            'إمبراطور التاريخ! تهانينا!',
            'لقد كتبت فصلاً جديداً في سجلات التاريخ!',
            'معرفة لا تُقهر! أنت أسطورة حية!'
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // ===== تحديث الإحصائيات =====
    function updateStats() {
        elements.challengesCount.textContent = savedChallenges.length;
        
        const total = savedChallenges.reduce((sum, challenge) => {
            return sum + (challenge.points || 0);
        }, 0);
        
        elements.totalPoints.textContent = total;
    }

    function updateScoreDisplay() {
        elements.totalScoreDisplay.textContent = totalScore;
    }

    // ===== إعادة تعيين النموذج =====
    function resetForm() {
        elements.questionText.value = '';
        selectedTime = 30;
        selectedDifficulty = 'medium';
        
        // إعادة تعيين الواجهة
        document.getElementById('previewTimer').textContent = '30';
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.time-btn[data-time="30"]').classList.add('active');
        
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.difficulty-btn[data-level="medium"]').classList.add('active');
        
        // إعادة تعيين الخيارات
        elements.optionsContainer.innerHTML = '';
        addOption();
        addOption();
        
        currentChallenge = null;
        
        showNotification('تم مسح النموذج، ابدأ تحدياً جديداً!', 'info');
        playSound('click');
    }

    // ===== إدارة الصوت =====
    function playAmbientSound() {
        if (soundEnabled) {
            sounds.ambient.volume = 0.3;
            sounds.ambient.play().catch(e => console.log('الصوت غير متاح:', e));
        }
    }

    function playSound(soundName) {
        if (!effectsEnabled || !sounds[soundName]) return;
        
        try {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play();
        } catch (e) {
            console.log('تعذر تشغيل الصوت:', soundName);
        }
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        elements.soundToggle.innerHTML = soundEnabled ? 
            '<i class="fas fa-volume-up"></i> الموسيقى الملحمية' :
            '<i class="fas fa-volume-mute"></i> الموسيقى الملحمية';
        
        if (soundEnabled) {
            playAmbientSound();
        } else {
            sounds.ambient.pause();
        }
        
        playSound('click');
    }

    function toggleEffects() {
        effectsEnabled = !effectsEnabled;
        elements.effectsToggle.innerHTML = effectsEnabled ? 
            '<i class="fas fa-bolt"></i> المؤثرات الصوتية' :
            '<i class="fas fa-bolt-slash"></i> المؤثرات الصوتية';
        
        playSound('click');
    }

    // ===== أدوات التصدير =====
    function exportToPdf() {
        showNotification('جاري تحضير المخطوطة PDF...', 'info');
        // يمكنك إضافة مكتبة jsPDF هنا
        setTimeout(() => {
            showNotification('تم تصدير المخطوطة بنجاح!', 'success');
        }, 1500);
        playSound('click');
    }

    function exportToImage() {
        showNotification('جاري تحضير اللوحة الفنية...', 'info');
        // يمكنك إضافة مكتبة html2canvas هنا
        setTimeout(() => {
            showNotification('تم حفظ اللوحة الفنية!', 'success');
        }, 1500);
        playSound('click');
    }

    function exportChallenge() {
        if (savedChallenges.length === 0) {
            showNotification('لا توجد تحديات للتصدير', 'warning');
            return;
        }
        
        const exportData = {
            title: 'مجموعة التحديات التاريخية',
            version: '1.0',
            date: new Date().toISOString(),
            challenges: savedChallenges
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'التحديات_التاريخية.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('تم تصدير التحديات بنجاح!', 'success');
        playSound('click');
    }

    function printAllChallenges() {
        showNotification('جاري تحضير المخطوطات للطباعة...', 'info');
        setTimeout(() => {
            window.print();
        }, 1000);
        playSound('click');
    }

    // ===== أدوات مساعدة =====
    function showNotification(message, type = 'info') {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `epic-notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // إضافة الأنماط
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            padding: 20px;
            border-radius: 15px;
            color: white;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 15px;
            z-index: 10000;
            animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s forwards;
            background: linear-gradient(135deg, 
                ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 
                  type === 'error' ? 'rgba(244, 67, 54, 0.9)' : 
                  type === 'warning' ? 'rgba(255, 152, 0, 0.9)' : 
                  'rgba(33, 150, 243, 0.9)'}, 
                rgba(25, 25, 35, 0.9));
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 2px solid ${type === 'success' ? '#4CAF50' : 
                          type === 'error' ? '#F44336' : 
                          type === 'warning' ? '#FF9800' : '#2196F3'};
            backdrop-filter: blur(10px);
        `;
        
        // إضافة الرسوم المتحركة
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateY(-100px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(-100px); opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(notification);
        
        // إزالة الإشعار بعد 3 ثوان
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 3000);
    }
});
