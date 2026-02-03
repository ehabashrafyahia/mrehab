document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM الرئيسية
    const questionText = document.getElementById('questionText');
    const optionsContainer = document.getElementById('optionsContainer');
    const addOptionBtn = document.getElementById('addOption');
    const previewBtn = document.getElementById('previewBtn');
    const saveBtn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    const previewContainer = document.getElementById('previewContainer');
    const savedQuestionsContainer = document.getElementById('savedQuestionsContainer');
    const questionCount = document.getElementById('questionCount');
    const exportHtmlBtn = document.getElementById('exportHtml');
    const exportJsonBtn = document.getElementById('exportJson');
    const previewModal = document.getElementById('previewModal');
    const closeModal = document.querySelector('.close-modal');
    const modalPreview = document.getElementById('modalPreview');

    // المتغيرات العامة
    let selectedTemplate = 'default';
    let savedQuestions = JSON.parse(localStorage.getItem('savedQuestions')) || [];
    let currentQuestionIndex = null; // لتتبع التعديل

    // تهيئة القوالب
    initTemplateSelection();
    loadSavedQuestions();

    // تعريف قوالب CSS مخصصة لكل نوع
    const templateStyles = {
        default: {
            questionClass: 'template-default',
            badgeColor: '#4361ee',
            optionHover: '#e9ecef'
        },
        modern: {
            questionClass: 'template-modern',
            badgeColor: '#764ba2',
            optionHover: 'rgba(255,255,255,0.2)'
        },
        elegant: {
            questionClass: 'template-elegant',
            badgeColor: '#d4af37',
            optionHover: '#fff9db'
        },
        minimal: {
            questionClass: 'template-minimal',
            badgeColor: '#6c757d',
            optionHover: '#f8f9fa'
        }
    };

    // تعريف ألوان الخيارات
    const optionColors = ['#4361ee', '#3a0ca3', '#2ec4b6', '#ff9f1c', '#e71d36'];

    // === أحداث القوالب ===
    function initTemplateSelection() {
        const templateOptions = document.querySelectorAll('.template-option');
        templateOptions.forEach(option => {
            option.addEventListener('click', function() {
                // إزالة النشط من الجميع
                templateOptions.forEach(opt => opt.classList.remove('active'));
                // إضافة النشط للعنصر المحدد
                this.classList.add('active');
                selectedTemplate = this.dataset.template;
            });
        });
        
        // تعيين القالب الافتراضي كنشط
        document.querySelector('.template-option[data-template="default"]').classList.add('active');
    }

    // === إضافة خيارات جديدة ===
    addOptionBtn.addEventListener('click', function() {
        if (optionsContainer.children.length >= 5) {
            alert('يمكنك إضافة حتى 5 خيارات فقط');
            return;
        }
        
        const optionCount = optionsContainer.children.length;
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-input';
        optionDiv.innerHTML = `
            <input type="text" class="option-text" placeholder="النص ${optionCount + 1}">
            <label class="correct-checkbox">
                <input type="radio" name="correct" value="${optionCount}"> صحيح
            </label>
        `;
        optionsContainer.appendChild(optionDiv);
    });

    // === معاينة السؤال ===
    previewBtn.addEventListener('click', function() {
        const questionData = getQuestionData();
        if (!validateQuestion(questionData)) return;
        
        const previewHTML = createQuestionPreview(questionData, true);
        modalPreview.innerHTML = previewHTML;
        previewModal.style.display = 'flex';
    });

    // === حفظ السؤال ===
    saveBtn.addEventListener('click', function() {
        const questionData = getQuestionData();
        if (!validateQuestion(questionData)) return;
        
        // التحقق مما إذا كان هناك سؤال يتم تعديله
        if (currentQuestionIndex !== null) {
            savedQuestions[currentQuestionIndex] = questionData;
            currentQuestionIndex = null;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ السؤال';
        } else {
            savedQuestions.push(questionData);
        }
        
        // حفظ في localStorage
        localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
        
        // تحديث العرض
        loadSavedQuestions();
        resetForm();
        
        // عرض رسالة نجاح
        showNotification('تم حفظ السؤال بنجاح!', 'success');
    });

    // === إعادة تعيين النموذج ===
    resetBtn.addEventListener('click', resetForm);

    // === تصدير HTML ===
    exportHtmlBtn.addEventListener('click', function() {
        if (savedQuestions.length === 0) {
            alert('لا توجد أسئلة لتصديرها');
            return;
        }
        
        let htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>الاختبار النهائي</title>
    <style>
        body {
            font-family: 'Cairo', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f7fa;
            direction: rtl;
        }
        .question-container {
            margin-bottom: 40px;
            padding: 25px;
            border-radius: 12px;
            background: white;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e1e5eb;
        }
        .question-number {
            background-color: #4361ee;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        .question-text {
            font-size: 1.2rem;
            margin-bottom: 20px;
            color: #333;
        }
        .options-container {
            display: grid;
            gap: 15px;
        }
        .option {
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #e1e5eb;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.3s ease;
        }
        .option:hover {
            background-color: #f8f9fa;
        }
        .option.correct {
            background-color: rgba(46, 196, 182, 0.1);
            border-color: #2ec4b6;
        }
        .option-label {
            width: 35px;
            height: 35px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            background-color: #e9ecef;
        }
        .option.correct .option-label {
            background-color: #2ec4b6;
            color: white;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #4361ee, #3a0ca3);
            color: white;
            border-radius: 12px;
        }
        @media print {
            body {
                background: white;
            }
            .question-container {
                break-inside: avoid;
                box-shadow: none;
                border: 1px solid #ddd;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>الاختبار النهائي</h1>
        <p>عدد الأسئلة: ${savedQuestions.length}</p>
        <p>تاريخ الإنشاء: ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
`;
        
        savedQuestions.forEach((question, index) => {
            const template = templateStyles[question.template] || templateStyles.default;
            
            htmlContent += `
    <div class="question-container" style="border-left: 5px solid ${template.badgeColor};">
        <div class="question-header">
            <div class="question-number">${index + 1}</div>
            <div style="color: ${template.badgeColor}; font-weight: bold;">
                ${getTemplateName(question.template)}
            </div>
        </div>
        <div class="question-text">${question.text}</div>
        <div class="options-container">`;
            
            question.options.forEach((option, optIndex) => {
                const isCorrect = optIndex === parseInt(question.correct);
                htmlContent += `
            <div class="option ${isCorrect ? 'correct' : ''}">
                <div class="option-label">${String.fromCharCode(1632 + optIndex)}</div>
                <div>${option}</div>
            </div>`;
            });
            
            htmlContent += `
        </div>
    </div>`;
        });
        
        htmlContent += `
</body>
</html>`;
        
        downloadFile(htmlContent, 'الاختبار.html', 'text/html');
        showNotification('تم تصدير الاختبار كملف HTML', 'success');
    });

    // === تصدير JSON ===
    exportJsonBtn.addEventListener('click', function() {
        if (savedQuestions.length === 0) {
            alert('لا توجد أسئلة لتصديرها');
            return;
        }
        
        const jsonContent = JSON.stringify(savedQuestions, null, 2);
        downloadFile(jsonContent, 'الأسئلة.json', 'application/json');
        showNotification('تم تصدير الأسئلة كملف JSON', 'success');
    });

    // === إغلاق النافذة المنبثقة ===
    closeModal.addEventListener('click', function() {
        previewModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });

    // === الدوال المساعدة ===
    function getQuestionData() {
        const options = [];
        const optionInputs = optionsContainer.querySelectorAll('.option-text');
        const correctInput = optionsContainer.querySelector('input[name="correct"]:checked');
        
        optionInputs.forEach(input => {
            if (input.value.trim()) {
                options.push(input.value.trim());
            }
        });
        
        return {
            text: questionText.value.trim(),
            options: options,
            correct: correctInput ? correctInput.value : '',
            template: selectedTemplate,
            date: new Date().toISOString()
        };
    }

    function validateQuestion(question) {
        if (!question.text) {
            showNotification('يرجى إدخال نص السؤال', 'error');
            return false;
        }
        
        if (question.options.length < 2) {
            showNotification('يرجى إدخال خيارين على الأقل', 'error');
            return false;
        }
        
        if (question.correct === '') {
            showNotification('يرجى تحديد الإجابة الصحيحة', 'error');
            return false;
        }
        
        return true;
    }

    function createQuestionPreview(question, showCorrect = true) {
        const template = templateStyles[question.template] || templateStyles.default;
        
        let html = `
            <div class="question-preview ${template.questionClass}">
                <div class="question-header">
                    <div class="question-number">${savedQuestions.length + 1}</div>
                    <div class="template-badge" style="background-color: ${template.badgeColor}20; color: ${template.badgeColor};">
                        ${getTemplateName(question.template)}
                    </div>
                </div>
                <div class="question-text">${question.text}</div>
                <div class="options-container">`;
        
        question.options.forEach((option, index) => {
            const isCorrect = index === parseInt(question.correct);
            const color = optionColors[index % optionColors.length];
            
            html += `
                    <div class="option ${showCorrect && isCorrect ? 'correct' : ''}" 
                         style="border-color: ${isCorrect ? template.badgeColor : '#e1e5eb'}; 
                                background-color: ${isCorrect ? template.badgeColor + '10' : '#f8f9fa'};">
                        <div class="option-label" style="background-color: ${isCorrect ? template.badgeColor : color}">
                            ${String.fromCharCode(1632 + index)}
                        </div>
                        <div class="option-text-preview">${option}</div>
                        ${showCorrect && isCorrect ? '<i class="fas fa-check" style="color: ' + template.badgeColor + '"></i>' : ''}
                    </div>`;
        });
        
        html += `
                </div>
            </div>`;
        
        return html;
    }

    function loadSavedQuestions() {
        savedQuestionsContainer.innerHTML = '';
        questionCount.textContent = savedQuestions.length;
        
        if (savedQuestions.length === 0) {
            savedQuestionsContainer.innerHTML = '<p class="empty-message">لا توجد أسئلة محفوظة</p>';
            return;
        }
        
        savedQuestions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'saved-question-item';
            
            const template = templateStyles[question.template] || templateStyles.default;
            
            questionDiv.innerHTML = `
                <div class="saved-question-header">
                    <div>
                        <strong>السؤال ${index + 1}:</strong> ${question.text.substring(0, 80)}${question.text.length > 80 ? '...' : ''}
                    </div>
                    <div class="question-actions">
                        <button class="edit-btn" data-index="${index}">
                            <i class="fas fa-edit"></i> تعديل
                        </button>
                        <button class="delete-btn" data-index="${index}">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                    <span style="background-color: ${template.badgeColor}20; color: ${template.badgeColor}; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem;">
                        ${getTemplateName(question.template)}
                    </span>
                    <span style="background-color: #e9ecef; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem;">
                        ${question.options.length} خيارات
                    </span>
                </div>
            `;
            
            savedQuestionsContainer.appendChild(questionDiv);
        });
        
        // إضافة أحداث للأزرار
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
                    savedQuestions.splice(index, 1);
                    localStorage.setItem('savedQuestions', JSON.stringify(savedQuestions));
                    loadSavedQuestions();
                    showNotification('تم حذف السؤال', 'success');
                }
            });
        });
        
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                editQuestion(index);
            });
        });
    }

    function editQuestion(index) {
        const question = savedQuestions[index];
        
        // تعبئة النموذج
        questionText.value = question.text;
        
        // تعيين القالب
        document.querySelectorAll('.template-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.dataset.template === question.template) {
                opt.classList.add('active');
                selectedTemplate = question.template;
            }
        });
        
        // تعبئة الخيارات
        optionsContainer.innerHTML = '';
        question.options.forEach((option, optIndex) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-input';
            const isCorrect = optIndex === parseInt(question.correct);
            optionDiv.innerHTML = `
                <input type="text" class="option-text" value="${option}">
                <label class="correct-checkbox">
                    <input type="radio" name="correct" value="${optIndex}" ${isCorrect ? 'checked' : ''}> صحيح
                </label>
            `;
            optionsContainer.appendChild(optionDiv);
        });
        
        // تحديث زر الحفظ
        currentQuestionIndex = index;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> تحديث السؤال';
        
        // التمرير لأعلى
        questionText.scrollIntoView({ behavior: 'smooth' });
        showNotification('يمكنك الآن تعديل السؤال', 'info');
    }

    function resetForm() {
        questionText.value = '';
        optionsContainer.innerHTML = `
            <div class="option-input">
                <input type="text" class="option-text" placeholder="النص الأول">
                <label class="correct-checkbox">
                    <input type="radio" name="correct" value="0"> صحيح
                </label>
            </div>
            <div class="option-input">
                <input type="text" class="option-text" placeholder="النص الثاني">
                <label class="correct-checkbox">
                    <input type="radio" name="correct" value="1"> صحيح
                </label>
            </div>
        `;
        
        // إعادة تعيين القالب الافتراضي
        document.querySelectorAll('.template-option').forEach(opt => {
            opt.classList.remove('active');
        });
        document.querySelector('.template-option[data-template="default"]').classList.add('active');
        selectedTemplate = 'default';
        
        currentQuestionIndex = null;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> حفظ السؤال';
    }

    function getTemplateName(templateKey) {
        const names = {
            default: 'قالب قياسي',
            modern: 'قالب حديث',
            elegant: 'قالب أنيق',
            minimal: 'قالب بسيط'
        };
        return names[templateKey] || 'قالب';
    }

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function showNotification(message, type) {
        // إنشاء عنصر الإشعار
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // إضافة أنماط للإشعار
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
            background-color: ${type === 'success' ? '#2ec4b6' : '#e71d36'};
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        
        // إضافة keyframes للرسوم المتحركة
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // إضافة الإشعار وإزالته بعد 3 ثوانٍ
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 3000);
    }

    // تهيئة أولية لعرض الأسئلة المحفوظة
    updatePreview();
    
    function updatePreview() {
        previewContainer.innerHTML = '';
        
        if (savedQuestions.length === 0) {
            previewContainer.innerHTML = '<p class="empty-message">لم تقم بإضافة أي أسئلة بعد. ابدأ بإضافة سؤال جديد!</p>';
            return;
        }
        
        // عرض آخر 3 أسئلة محفوظة
        const recentQuestions = savedQuestions.slice(-3);
        recentQuestions.forEach((question, index) => {
            const previewHTML = createQuestionPreview(question, false);
            previewContainer.innerHTML += previewHTML;
        });
        
        if (savedQuestions.length > 3) {
            const moreCount = savedQuestions.length - 3;
            const moreDiv = document.createElement('div');
            moreDiv.className = 'more-questions';
            moreDiv.innerHTML = `
                <p style="text-align: center; color: var(--gray-color); margin-top: 20px;">
                    + ${moreCount} أسئلة أخرى محفوظة
                </p>
            `;
            previewContainer.appendChild(moreDiv);
        }
    }
});
