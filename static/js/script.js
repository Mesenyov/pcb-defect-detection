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
        startBtn.innerHTML = `ЗАПУСТИТЬ АНАЛИЗ (Cвой: ${currentTemplateFile.name}) >`;
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
    startBtn.innerHTML = "ЗАПУСТИТЬ АНАЛИЗ >";
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
}

function selectTemplate(cardElement, templateName) {
    document.querySelectorAll('.template-card').forEach(c => c.classList.remove('selected'));
    cardElement.classList.add('selected');

    currentTemplateFile = null;
    currentTemplateName = templateName;
    startBtn.disabled = false;
    startBtn.innerHTML = `ЗАПУСТИТЬ АНАЛИЗ (${templateName}) >`;
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
        alert("Ошибка анализа: " + error.message);
        sections.loading.classList.add('hidden');
    }
}

function showResults(data) {
    sections.loading.classList.add('hidden');

    const verdictBox = document.getElementById('verdictBox');
    const stack = document.getElementById('imagesStack');
    stack.innerHTML = '';

    if (data.has_defects) {
        verdictBox.className = 'verdict-box defects';
        verdictBox.innerHTML = `⚠️ ${data.verdict}`;
    } else {
        verdictBox.className = 'verdict-box clean';
        verdictBox.innerHTML = `✅ ${data.verdict}`;
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

    stack.appendChild(createCard("1. Тестируемая плата", data.images.test));
    stack.appendChild(createCard("2. Эталонная плата", data.images.template));

    if (data.has_defects) {
        stack.appendChild(createCard("3. Heatmap (Различия)", data.images.heatmap));
        stack.appendChild(createCard("4. Маска дефектов", data.images.mask_overlay));
        stack.appendChild(createCard("5. Классификация (Результат)", data.images.final,
            "Красная рамка = Известный дефект, Желтая рамка = Неизвестный"));
    } else {
        stack.appendChild(createCard("Результат проверки", data.images.final));
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