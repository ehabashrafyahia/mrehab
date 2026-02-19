const examsData = {
    grade7: [
        { title: "امتحان الوحدة الأولى", link: "pdfs/g7-u1.pdf" },
        { title: "امتحان الوحدة الثانية", link: "pdfs/g7-u2.pdf" }
    ],
    grade8: [
        { title: "امتحان الوحدة الأولى", link: "pdfs/g8-u1.pdf" },
        { title: "امتحان الوحدة الثالثة", link: "pdfs/g8-u3.pdf" }
    ],
    grade9: [
        { title: "امتحان الفصل الأول", link: "pdfs/g9-final1.pdf" }
    ]
};

function updateUnits() {
    const select = document.getElementById('grade-select');
    const grid = document.getElementById('units-grid');
    const selectedGrade = select.value;

    // مسح المحتوى القديم
    grid.innerHTML = "";

    if (selectedGrade && examsData[selectedGrade]) {
        examsData[selectedGrade].forEach(exam => {
            const card = `
                <div class="card">
                    <h3>${exam.title}</h3>
                    <p>صيغة الملف: PDF</p>
                    <a href="${exam.link}" class="btn-download" download>تحميل الامتحان</a>
                </div>
            `;
            grid.innerHTML += card;
        });
    } else {
        grid.innerHTML = "<p style='text-align:center; width:100%'>برجاء اختيار الصف الدراسي لعرض الوحدات.</p>";
    }
}
