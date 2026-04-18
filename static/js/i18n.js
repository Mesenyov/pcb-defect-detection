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
        toast_lang: "⚠️ To apply language changes to the image report, please refresh the page or run the analysis again.",
        warn_mismatch: "⚠️ WARNING: Massive discrepancy detected! Are you sure the correct template is selected or this is a PCB?"
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
        res_compare: "1. Интерактивное сравнение",
        res_heat: "2. Тепловая карта",
        res_mask: "3. Маска дефектов на плате",
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
        toast_lang: "⚠️ Чтобы изменения вступили в силу на изображениях, необходимо перезагрузить страницу или запустить анализ заново.",
        warn_mismatch: "⚠️ ВНИМАНИЕ: Аномальное расхождение! Вероятно, выбрана неверная плата или постороннее изображение."
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