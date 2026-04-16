const dict = {
    en: {
        btn_choose_board: "[+] Choose board",
        examples_title: "> EXAMPLES",
        examples_desc: "Select an example above or upload your own image via the top menu.",
        template_title: "> TEMPLATE SELECTION",
        test_board_lbl: "Test board:",
        template_desc: "Select a golden template from the database or upload your own:",
        btn_cancel: "< CANCEL",
        btn_upload_custom: "Upload Custom Template",
        btn_start_analysis: "START ANALYSIS >",
        loading_text: "ANALYZING BOARD...",
        results_title: "> ANALYSIS REPORT",
        start_custom: "START ANALYSIS (Custom: {name}) >",
        start_tpl: "START ANALYSIS ({name}) >",
        res_test: "Test Board",
        res_gold: "Golden Template",
        res_compare: "1. Comparison Slider (Test vs Golden)",
        res_heat: "2. Heatmap (Differences)",
        res_mask: "3. Defect Mask",
        res_class: "4. Classification Result",
        res_clean: "Inspection Result",
        alert_error: "Analysis Error: ",
        footer_text: "Created by Efremenko & Mesenyov // Scientific Advisor: Prof. I.N. Glukhikh, Dr.Sc. // 2026",
        verdict_defects: "⚠️ Defects detected: ",
        verdict_clean: "✅ No defects detected",
        tbl_type: "Defect Type",
        tbl_pos: "Position",
        tbl_conf: "Confidence",
        lbl_ood: "UNKNOWN (OOD)",
        lbl_dist: "Dist: ",
        lbl_thresh: "Thresh: ",
        lbl_gold: "GOLDEN TEMPLATE",
        lbl_test: "TEST BOARD",
        toast_lang: "⚠️ To apply language changes to the image report, please refresh the page or run the analysis again."
    },
    ru: {
        btn_choose_board: "[+] Выбрать плату",
        examples_title: "> ПРИМЕРЫ",
        examples_desc: "Выберите пример выше или загрузите своё изображение через меню сверху.",
        template_title: "> ВЫБОР ЭТАЛОНА",
        test_board_lbl: "Тестируемая плата:",
        template_desc: "Выберите эталон из базы знаний или загрузите свой:",
        btn_cancel: "< ОТМЕНА",
        btn_upload_custom: "Загрузить свой эталон",
        btn_start_analysis: "ЗАПУСТИТЬ АНАЛИЗ >",
        loading_text: "АНАЛИЗИРУЕМ ПЛАТУ...",
        results_title: "> ОТЧЕТ АНАЛИЗА",
        start_custom: "ЗАПУСТИТЬ АНАЛИЗ (Свой: {name}) >",
        start_tpl: "ЗАПУСТИТЬ АНАЛИЗ ({name}) >",
        res_test: "Тестируемая плата",
        res_gold: "Эталонная плата",
        res_compare: "1. Интерактивное сравнение (Слайдер)",
        res_heat: "2. Heatmap (Различия)",
        res_mask: "3. Маска дефектов",
        res_class: "4. Результат классификации",
        res_clean: "Результат проверки",
        alert_error: "Ошибка анализа: ",
        footer_text: "Разработано: Ефременко, Месенёв // Науч. рук.: проф., д.т.н. Глухих И.Н. // 2026",
        verdict_defects: "⚠️ Обнаружено дефектов: ",
        verdict_clean: "✅ Дефектов не обнаружено",
        tbl_type: "Тип дефекта",
        tbl_pos: "Позиция",
        tbl_conf: "Уверенность",
        lbl_ood: "НЕИЗВЕСТНО (OOD)",
        lbl_dist: "Дист: ",
        lbl_thresh: "Порог: ",
        lbl_gold: "ЭТАЛОН",
        lbl_test: "ТЕСТОВАЯ ПЛАТА",
        toast_lang: "⚠️ Чтобы изменения вступили в силу на изображениях, необходимо перезагрузить страницу или запустить анализ заново."
    }
};

let currentLang = localStorage.getItem('lang') || 'ru';
let toastTimeout;
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toastMessage');
const toastProg = document.querySelector('.toast-progress');

function hideToast() {
    if (!toast) return;
    toast.classList.remove('show');
    toastProg.style.transition = 'none';
    clearTimeout(toastTimeout);
}

function showToast(message) {
    if(!toast || !toastMsg || !toastProg) return;
    toastMsg.innerHTML = message;
    toast.classList.add('show');

    toastProg.style.transition = 'none';
    toastProg.style.width = '100%';

    setTimeout(() => {
        toastProg.style.transition = 'width 6s linear';
        toastProg.style.width = '0%';
    }, 50);

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(hideToast, 6000);
}

document.addEventListener('click', (e) => {
    if (toast && toast.classList.contains('show') && !e.target.closest('.lang-toggle')) {
        hideToast();
    }
});

function toggleLang() {
    setLang(currentLang === 'ru' ? 'en' : 'ru');
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[lang][key]) el.innerHTML = dict[lang][key];
    });

    const toggleElement = document.querySelector('.lang-toggle');
    if (toggleElement) {
        if (lang === 'en') toggleElement.classList.add('en-active');
        else toggleElement.classList.remove('en-active');
    }
    updateStartButtonText();

    if (!sections.results.classList.contains('hidden')) {
        showToast(dict[lang].toast_lang);
    }
}

function updateStartButtonText() {
    if (!startBtn) return;
    if (startBtn.disabled) startBtn.innerHTML = dict[currentLang].btn_start_analysis;
    else if (currentTemplateFile) startBtn.innerHTML = dict[currentLang].start_custom.replace('{name}', currentTemplateFile.name);
    else if (currentTemplateName) startBtn.innerHTML = dict[currentLang].start_tpl.replace('{name}', currentTemplateName);
}

let currentTestFile = null, currentExampleName = null;
let currentTemplateFile = null, currentTemplateName = null;

const sections = {
    template: document.getElementById('templateArea'),
    loading: document.getElementById('loadingArea'),
    results: document.getElementById('resultsArea')
};
const pcbInput = document.getElementById('pcbInput');
const customTemplateInput = document.getElementById('customTemplateInput');
const startBtn = document.getElementById('startAnalysisBtn');
const templateGrid = document.getElementById('templateGrid');
const examplesGrid = document.getElementById('examplesGrid');

async function loadExamples() {
    try {
        const res = await fetch('/api/examples');
        const data = await res.json();
        examplesGrid.innerHTML = '';
        data.forEach(ex => {
            const card = document.createElement('div');
            card.className = 'example-card';
            card.title = ex.name;
            card.onclick = () => runExample(ex.name);
            card.innerHTML = `<img src="${ex.src}" alt="${ex.name}"><span>${ex.name}</span>`;
            examplesGrid.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

async function loadTemplates() {
    try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        templateGrid.innerHTML = '';
        data.forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.onclick = () => selectTemplate(card, tpl.name);
            card.innerHTML = `<img src="${tpl.src}" alt="${tpl.name}"><div style="text-align:center; padding:5px; color:#888;">${tpl.name}</div>`;
            templateGrid.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

loadExamples();
loadTemplates();
setLang('ru');

pcbInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        currentTestFile = e.target.files[0];
        currentExampleName = null;
        sections.results.classList.add('hidden');
        showTemplateSelection(currentTestFile.name);
    }
});

customTemplateInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        currentTemplateFile = e.target.files[0];
        currentTemplateName = null;
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
        startBtn.disabled = false;
        updateStartButtonText();
    }
});

function hideAllDynamicSections() { Object.values(sections).forEach(el => el.classList.add('hidden')); }

function resetUI() {
    pcbInput.value = ''; customTemplateInput.value = '';
    currentTestFile = null; currentTemplateFile = null;
    currentExampleName = null; currentTemplateName = null;
    hideAllDynamicSections();
}

function showTemplateSelection(filename) {
    hideAllDynamicSections();
    document.getElementById('selectedFileName').textContent = filename;
    sections.template.classList.remove('hidden');
    sections.template.scrollIntoView({ behavior: 'smooth' });
    startBtn.disabled = true;
    updateStartButtonText();
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
}

function selectTemplate(cardElement, templateName) {
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');
    currentTemplateFile = null;
    currentTemplateName = templateName;
    startBtn.disabled = false;
    updateStartButtonText();
}

async function runExample(exampleName) {
    sections.template.classList.add('hidden');
    sections.results.classList.add('hidden');
    sections.loading.classList.remove('hidden');
    sections.loading.scrollIntoView({ behavior: 'smooth' });
    const formData = new FormData();
    formData.append('test_filename', exampleName);
    formData.append('template_filename', 'AUTO_DETECT');
    await sendAnalysisRequest(formData);
}

async function startAnalysis() {
    sections.template.classList.add('hidden');
    sections.loading.classList.remove('hidden');
    const formData = new FormData();
    if (currentTestFile) formData.append('test_image', currentTestFile);
    if (currentTemplateFile) formData.append('template_image', currentTemplateFile);
    else if (currentTemplateName) formData.append('template_filename', currentTemplateName);
    await sendAnalysisRequest(formData);
}

async function sendAnalysisRequest(formData) {
    formData.append('lang', currentLang);
    try {
        const response = await fetch('/api/analyze', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(`Server Error: ${response.statusText}`);
        const result = await response.json();
        showResults(result);
    } catch (error) {
        alert(dict[currentLang].alert_error + error.message);
        sections.loading.classList.add('hidden');
    }
}

function showResults(data) {
    sections.loading.classList.add('hidden');
    const verdictBox = document.getElementById('verdictBox');
    const stack = document.getElementById('imagesStack');
    stack.innerHTML = '';
    const d = dict[currentLang];

    const defectsCount = data.detections ? data.detections.length : 0;
    if (data.has_defects) {
        verdictBox.className = 'verdict-box defects';
        verdictBox.innerHTML = d.verdict_defects + defectsCount;
    } else {
        verdictBox.className = 'verdict-box clean';
        verdictBox.innerHTML = d.verdict_clean;
    }

    const sliderDiv = document.createElement('div');
    sliderDiv.className = 'result-item';
    sliderDiv.innerHTML = `
        <h3>${d.res_compare}</h3>
        <div class="compare-container" id="compareContainer">
            <img src="${data.images.test}" class="compare-img" alt="Test">
            <div class="slider-label right">${d.lbl_test}</div>

            <div class="img-overlay" id="imgOverlay">
                <img src="${data.images.template}" class="compare-img" alt="Gold">
                <div class="slider-label left">${d.lbl_gold}</div>
            </div>

            <div class="slider-handle" id="sliderHandle">
                <div class="slider-button">↔</div>
            </div>
        </div>
    `;
    stack.appendChild(sliderDiv);

    const createStaticCard = (title, url) => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `<h3>${title}</h3><img src="${url}">`;
        return div;
    };

    if (data.has_defects) {
        stack.appendChild(createStaticCard(d.res_heat, data.images.heatmap));
        stack.appendChild(createStaticCard(d.res_mask, data.images.mask_overlay));

        const finalSection = document.createElement('div');
        finalSection.className = 'result-item wide';
        finalSection.innerHTML = `<h3>${d.res_class}</h3>`;

        const layout = document.createElement('div');
        layout.className = 'results-layout';

        const imgWrap = document.createElement('div');
        imgWrap.className = 'image-wrapper';
        imgWrap.innerHTML = `<img src="${data.images.final}" alt="Final Result">`;

        data.detections.forEach((det, idx) => {
            const box = document.createElement('div');
            box.className = 'bbox-overlay';
            box.id = `bbox-${idx}`;
            box.style.left = `${det.box_pct.x * 100}%`;
            box.style.top = `${det.box_pct.y * 100}%`;
            box.style.width = `${det.box_pct.w * 100}%`;
            box.style.height = `${det.box_pct.h * 100}%`;
            imgWrap.appendChild(box);
        });

        const tableWrap = document.createElement('div');
        tableWrap.className = 'table-wrapper';
        let tableHTML = `
            <table class="defect-table">
                <tr><th>#</th><th>${d.tbl_type}</th><th>${d.tbl_conf}</th><th>${d.tbl_pos}</th></tr>
        `;

        data.detections.forEach((det, idx) => {
            let typeHtml = det.class;
            if (det.is_unknown) {
                typeHtml += `<br><span class="tag-ood">${d.lbl_ood}</span>`;
                typeHtml += `<br><span style="font-size:0.75rem; color:#888;">${d.lbl_dist}${det.distance} / ${d.lbl_thresh}${det.threshold}</span>`;
            }

            tableHTML += `
                <tr class="defect-row" data-idx="${idx}">
                    <td>${idx + 1}</td>
                    <td><b>${typeHtml}</b></td>
                    <td style="color:${det.confidence > 80 ? 'var(--accent-color)' : 'var(--warning-color)'}">${det.confidence}%</td>
                    <td style="font-size:0.8rem; color:#888;">X:${det.box_px.x}<br>Y:${det.box_px.y}</td>
                </tr>
            `;
        });
        tableHTML += `</table>`;
        tableWrap.innerHTML = tableHTML;

        layout.appendChild(imgWrap);
        layout.appendChild(tableWrap);
        finalSection.appendChild(layout);
        stack.appendChild(finalSection);

        setTimeout(() => {
            const rows = document.querySelectorAll('.defect-row');
            rows.forEach(row => {
                row.addEventListener('mouseenter', () => {
                    const idx = row.getAttribute('data-idx');
                    document.getElementById(`bbox-${idx}`).classList.add('highlight');
                });
                row.addEventListener('mouseleave', () => {
                    const idx = row.getAttribute('data-idx');
                    document.getElementById(`bbox-${idx}`).classList.remove('highlight');
                });

                row.addEventListener('click', () => {
                    document.querySelectorAll('.bbox-overlay').forEach(b => b.classList.remove('highlight'));
                    const idx = row.getAttribute('data-idx');
                    document.getElementById(`bbox-${idx}`).classList.add('highlight');
                });
            });
        }, 100);

    } else {
        stack.appendChild(createStaticCard(d.res_clean, data.images.final));
    }

    sections.results.classList.remove('hidden');
    sections.results.scrollIntoView({ behavior: 'smooth' });

    setTimeout(initCompareSlider, 100);
}

function initCompareSlider() {
    const container = document.getElementById('compareContainer');
    const overlay = document.getElementById('imgOverlay');
    const handle = document.getElementById('sliderHandle');
    if(!container || !overlay || !handle) return;

    let isDragging = false;
    let labelsHidden = false;
    const labels = container.querySelectorAll('.slider-label');

    const hideLabels = () => {
        if (!labelsHidden) {
            labels.forEach(lbl => lbl.style.opacity = '0');
            labelsHidden = true;
        }
    };

    const moveSlider = (clientX) => {
        const rect = container.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = (x / rect.width) * 100;

        handle.style.left = `${percent}%`;
        overlay.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
    };

    handle.addEventListener('mousedown', (e) => { isDragging = true; hideLabels(); e.preventDefault(); });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        moveSlider(e.clientX);
    });

    handle.addEventListener('touchstart', (e) => { isDragging = true; hideLabels(); }, {passive: true});
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        moveSlider(e.touches[0].clientX);
    }, {passive: true});
}

const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) backToTopBtn.classList.add('visible');
    else backToTopBtn.classList.remove('visible');
});