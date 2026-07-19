(() => {
class WantsUpdater {
    constructor () {
        this.timeout = 5;
        this.running = false;
        this.timer = null;
        this.audioSignal = false;
        this.markAsViewed = true;
        this.audioUrl = 'https://cdn-edge.kwork.ru/js/libs/sounds/new_message.mp3';
        this.lastProjectUrl = null;
        this.wantsView = null;
        this.originalFetch = null;
        this.originalXHROpen = null;
    }

    getVueComponent () {
        const app = document.querySelector('#app');
        if (!app) return null;
        if (app.__vueParentComponent) return app.__vueParentComponent;
        if (app.__vue__) return app.__vue__.$children[0];
        if (app.__vue_app__) {
            const inst = app.__vue_app__._instance;
            if (inst && inst.subTree) return inst;
        }
        return null;
    }

    start () {
        if (this.running) return;
        this.running = true;
        this.timer = setInterval(() => { this.update(); }, this.timeout * 1000);
    }

    stop () {
        if (!this.running) return;
        this.running = false;
        clearInterval(this.timer);
    }

    setTimeout (timeout) {
        if (this.running) {
            this.stop();
            this.running = true;
        }
        this.timeout = timeout;
        if (this.running) {
            this.running = false;
            this.start();
        }
    }

    blockViewedRequests () {
        if (this.originalFetch) return;

        this.originalFetch = window.fetch;
        this.originalXHROpen = XMLHttpRequest.prototype.open;
        this.originalXHRSend = XMLHttpRequest.prototype.send;

        const isViewedRequest = (url) => {
            const str = (typeof url === 'string') ? url : (url instanceof Request ? url.url : '');
            return /addview|\/viewed|\/view[\s\/?]/i.test(str);
        };

        const self = this;

        window.fetch = function (...args) {
            if (!self.markAsViewed && isViewedRequest(args[0])) {
                return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
            }
            return self.originalFetch.apply(window, args);
        };

        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            if (!self.markAsViewed && isViewedRequest(url)) {
                this._blocked = true;
                return;
            }
            return self.originalXHROpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function (...args) {
            if (this._blocked) return;
            return self.originalXHRSend.apply(this, args);
        };
    }

    unblockViewedRequests () {
        if (!this.originalFetch) return;

        window.fetch = this.originalFetch;
        XMLHttpRequest.prototype.open = this.originalXHROpen;
        XMLHttpRequest.prototype.send = this.originalXHRSend;
        this.originalFetch = null;
        this.originalXHROpen = null;
        this.originalXHRSend = null;
    }

    async update() {
        try {
            if (!this.wantsView) {
                this.wantsView = this.getVueComponent();
            }
            if (this.wantsView && typeof this.wantsView.updateParams === 'function') {
                this.wantsView.updateParams({});
            } else {
                window.location.reload();
                return;
            }
        } catch (e) {
            console.error('[KworkClient] update error:', e);
            window.location.reload();
            return;
        }

        if (this.audioSignal) {
            setTimeout(() => {
                const firstTitle = document.querySelector('.wants-card__header-title');
                if (firstTitle) {
                    const link = firstTitle.querySelector('a');
                    if (link && link.href !== this.lastProjectUrl) {
                        if (this.lastProjectUrl !== null) {
                            const audio = new Audio(this.audioUrl);
                            audio.play();
                        }
                        this.lastProjectUrl = link.href;
                    }
                }
            }, 500);
        }
    }
}


const wantsLeftSide = document.querySelector('.wants-left-side')

if (wantsLeftSide && !document.getElementById('auto-update-panel')) {
    wantsLeftSide.insertAdjacentHTML('beforeend', `
        <style>
        .auto-update .k-switch { margin-left: 0; }
        .auto-update .exchange-stats__row { margin-bottom: 8px; }
        .auto-update .projects-filter__input .filter-input {
            width: 60px;
            padding: 4px 8px;
            border: 1px solid var(--color-grayscale-field-border);
            border-radius: 4px;
            font-size: 14px;
        }
        </style>
        <div class="exchange-stats auto-update" id="auto-update-panel">
            <div class="d-flex align-items-center" style="margin-bottom: 12px;">
                <strong style="text-align: center;">Автообновление</strong>
                <label class="k-switch k-switch--lg" style="margin-left: auto;">
                    <input type="checkbox" class="k-switch__input" id="autoupdate-switch">
                    <span class="k-switch__track">
                        <span class="k-switch__thumb"></span>
                    </span>
                </label>
            </div>
            <div class="projects-filter__item">
                <div class="projects-filter__title">Задержка</div>
                <div class="projects-filter__input">
                    <input class="filter-input" placeholder="Сек." value="5" id="timeout-input"></input>
                </div>
            </div>
            <div class="checkbox-after-label mt12"><input id="audio-signal-input" type="checkbox"> 
                <label for="audio-signal-input">Звуковое уведомление</label>
            </div>
            <div class="checkbox-after-label mt12"><input id="mark-as-viewed-input" type="checkbox" checked> 
                <label for="mark-as-viewed-input">Помечать просмотренным</label>
            </div>
        </div>
        `);

    const saveSetting = async (key, value) => {
        try {
            const settings = await window.api.getSettings();
            settings.projects[key] = value;
            await window.api.setSettings(settings);
        } catch (e) {
            console.error('[KworkClient] save settings error:', e);
        }
    };

    const loadSettings = async () => {
        try {
            const settings = await window.api.getSettings();
            return settings.projects || {};
        } catch {
            return {};
        }
    };

    loadSettings().then((projSettings) => {
        const updater = new WantsUpdater();

        const autoupdateSwitch = document.getElementById('autoupdate-switch');
        const timeoutInput = document.getElementById('timeout-input');
        const audioSignalInput = document.getElementById('audio-signal-input');
        const markAsViewedInput = document.getElementById('mark-as-viewed-input');

        if (projSettings.timeout) {
            updater.timeout = projSettings.timeout;
            timeoutInput.value = projSettings.timeout;
        }

        if (projSettings['sound-notification']) {
            audioSignalInput.checked = true;
            updater.audioSignal = true;
        }

        if (projSettings['mark-as-viewed'] === false) {
            markAsViewedInput.checked = false;
            updater.markAsViewed = false;
            updater.blockViewedRequests();
        }

        autoupdateSwitch.addEventListener('change', () => {
            if (autoupdateSwitch.checked) updater.start();
            else updater.stop();
        });

        timeoutInput.addEventListener('change', (event) => {
            let value = parseFloat(event.target.value);
            if (isNaN(value)) {
                timeoutInput.value = updater.timeout;
            } else {
                updater.setTimeout(value);
                saveSetting('timeout', value);
            }
        });

        markAsViewedInput.addEventListener('change', (event) => {
            updater.markAsViewed = event.target.checked;
            if (event.target.checked) {
                updater.unblockViewedRequests();
            } else {
                updater.blockViewedRequests();
            }
            saveSetting('mark-as-viewed', event.target.checked);
        });

        audioSignalInput.addEventListener('change', (event) => {
            updater.audioSignal = event.target.checked;
            saveSetting('sound-notification', event.target.checked);
        });
    });
}
})();
