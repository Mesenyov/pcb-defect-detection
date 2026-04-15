// --- ЛОКАЛИЗАЦИЯ (i18n) ---
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
        res_test: "1. Test Board",
        res_gold: "2. Golden Template",
        res_heat: "3. Heatmap (Differences)",
        res_mask: "4. Defect Mask",
        res_class: "5. Classification (Result)",
        res_class_desc: "Red bounding box = Known defect, Yellow bounding box = Unknown (OOD)",
        res_clean: "Inspection Result",
        alert_error: "Analysis Error: ",
        verdict_defects: "⚠️ Defects detected: ",
        verdict_clean: "✅ No defects detected"
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
        res_test: "1. Тестируемая плата",
        res_gold: "2. Эталонная плата",
        res_heat: "3. Heatmap (Различия)",
        res_mask: "4. Маска дефектов",
        res_class: "5. Классификация (Результат)",
        res_class_desc: "Красная рамка = Известный дефект, Желтая рамка = Неизвестный (OOD)",
        res_clean: "Результат проверки",
        alert_error: "Ошибка анализа: ",
        verdict_defects: "⚠️ Обнаружено дефектов: ",
        verdict_clean: "✅ Дефектов не обнаружено"
    }
};

let currentLang = 'en';

function toggleLang() {
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    setLang(newLang);
}

function setLang(lang) {
    currentLang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[lang][key]) {
            el.innerHTML = dict[lang][key];
        }
    });

    const toggleElement = document.querySelector('.lang-toggle');
    if (lang === 'en') {
        toggleElement.classList.add('en-active');
    } else {
        toggleElement.classList.remove('en-active');
    }

    updateStartButtonText();
}

function updateStartButtonText() {
    if (!startBtn) return;
    if (startBtn.disabled) {
        startBtn.innerHTML = dict[currentLang].btn_start_analysis;
    } else if (currentTemplateFile) {
        startBtn.innerHTML = dict[currentLang].start_custom.replace('{name}', currentTemplateFile.name);
    } else if (currentTemplateName) {
        startBtn.innerHTML = dict[currentLang].start_tpl.replace('{name}', currentTemplateName);
    }
}

let currentTestFile = null;
let currentExampleName = null;

let currentTemplateFile = null;
let currentTemplateName = null;

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
            card.innerHTML = `
                <img src="${ex.src}" alt="${ex.name}">
                <span>${ex.name}</span>
            `;
            examplesGrid.appendChild(card);
        });
    } catch (e) { console.error("Error loading examples:", e); }
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
            card.innerHTML = `
                <img src="${tpl.src}" alt="${tpl.name}">
                <div style="text-align:center; padding:5px; color:#888;">${tpl.name}</div>
            `;
            templateGrid.appendChild(card);
        });
    } catch (e) { console.error("Error loading templates:", e); }
}

loadExamples();
loadTemplates();
setLang('ru'); // Устанавливаем язык по умолчанию

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

function hideAllDynamicSections() {
    Object.values(sections).forEach(el => el.classList.add('hidden'));
}

function resetUI() {
    pcbInput.value = '';
    customTemplateInput.value = '';
    currentTestFile = null;
    currentTemplateFile = null;
    currentExampleName = null;
    currentTemplateName = null;
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
    console.log("Running Example:", exampleName);

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

    if (currentTestFile) {
        formData.append('test_image', currentTestFile);
    }

    if (currentTemplateFile) {
        formData.append('template_image', currentTemplateFile);
    } else if (currentTemplateName) {
        formData.append('template_filename', currentTemplateName);
    }

    await sendAnalysisRequest(formData);
}

async function sendAnalysisRequest(formData) {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        const result = await response.json();
        showResults(result);

    } catch (error) {
        console.error(error);
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

    const createCard = (title, b64, extra = "") => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <h3>${title}</h3>
            <img src="data:image/jpeg;base64,${b64}">
            ${extra ? `<div style="padding:10px; color:#888; font-size:0.8rem">${extra}</div>` : ''}
        `;
        return div;
    };

    stack.appendChild(createCard(d.res_test, data.images.test));
    stack.appendChild(createCard(d.res_gold, data.images.template));

    if (data.has_defects) {
        stack.appendChild(createCard(d.res_heat, data.images.heatmap));
        stack.appendChild(createCard(d.res_mask, data.images.mask_overlay));
        stack.appendChild(createCard(d.res_class, data.images.final, d.res_class_desc));
    } else {
        stack.appendChild(createCard(d.res_clean, data.images.final));
    }

    sections.results.classList.remove('hidden');
    sections.results.scrollIntoView({ behavior: 'smooth' });
}

const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});