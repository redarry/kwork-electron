(() => {
    const footer = document.getElementById('app-footer');
    if (footer) footer.remove();

    const contentArea = document.querySelector('.all_page.page-flex__content')
        || document.querySelector('.all_page')
        || document.querySelector('#app > div:nth-child(2)');

    if (contentArea) {
        window.api.getHtmlContent('client_settings.html').then(html => {
            if (!html) return;

            const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
            if (styleMatch) {
                const style = document.createElement('style');
                style.textContent = styleMatch[1];
                document.head.appendChild(style);
                html = html.replace(styleMatch[0], '');
            }

            contentArea.innerHTML = html;
            initTabs();
            initSettings();
        });
    }

    async function initSettings() {
        const settings = await window.api.getSettings();
        const proj = settings.projects || {};

        const timeoutInput = document.getElementById('timeout-input');
        const soundInput = document.getElementById('sound-notification');
        const markInput = document.getElementById('mark-as-viewed');

        if (proj.timeout != null) timeoutInput.value = proj.timeout;
        if (proj['sound-notification'] != null) soundInput.checked = proj['sound-notification'];
        if (proj['mark-as-viewed'] != null) markInput.checked = proj['mark-as-viewed'];

        const save = async (section, key, value) => {
            const s = await window.api.getSettings();
            s[section][key] = value;
            await window.api.setSettings(s);
        };

        timeoutInput.addEventListener('change', () => save('projects', 'timeout', parseFloat(timeoutInput.value) || 5));
        soundInput.addEventListener('change', () => save('projects', 'sound-notification', soundInput.checked));
        markInput.addEventListener('change', () => save('projects', 'mark-as-viewed', markInput.checked));
    }

    function moveBorder(tab) {
        const border = document.querySelector('.settings-tabs__border');
        if (!border || !tab) return;
        border.style.width = tab.offsetWidth + 'px';
        border.style.left = tab.offsetLeft + 'px';
    }

    function initTabs() {
        const tabs = document.querySelectorAll('.settings-tabs__item[data-tab]');
        const activeTab = document.querySelector('.settings-tabs__item--active');

        requestAnimationFrame(() => moveBorder(activeTab));

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('settings-tabs__item--active'));
                tab.classList.add('settings-tabs__item--active');

                document.querySelectorAll('.cl-section[id^="tab-"]').forEach(s => s.style.display = 'none');
                document.getElementById('tab-' + tab.dataset.tab).style.display = '';

                moveBorder(tab);
            });
        });
    }

    document.title = 'Настройки клиента — Kwork';
})();
