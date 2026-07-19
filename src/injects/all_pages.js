(() => {
const userDropdownMenu = document.querySelector('.user-popup-items')

if (userDropdownMenu) {
    const existing = document.getElementById('kwork-client-settings-item');
    if (!existing) {
        const settingsItem = [...userDropdownMenu.querySelectorAll('.user-popup-link')]
            .find(el => el.textContent.trim() === 'Настройки');

        const newItem = document.createElement('div');
        newItem.id = 'kwork-client-settings-item';
        newItem.className = 'user-popup-item';
        newItem.innerHTML = '<a href="/settings?client_settings=true" class="user-popup-link">Настройки клиента</a>';

        if (settingsItem) {
            settingsItem.closest('.user-popup-item').after(newItem);
        } else {
            userDropdownMenu.appendChild(newItem);
        }
    }
}

const footer = document.getElementById('app-footer');
if (footer) footer.remove();
})();