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
        });
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
