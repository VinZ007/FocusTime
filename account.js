// ===== Локализация (та же схема, что на Productivity_Gainer и Sleep_Helper) =====
const translations = {
    en: {
        backToMain: 'Back To Main',
        profileTitle: 'Profile',
        editBio: 'Edit',
        saveBtn: 'Save',
        cancelBtn: 'Cancel',
        statsTitle: 'Activity Statistics',
        productiveGainer: 'Productive Gainer:',
        totalSessions: 'Total sessions',
        bioPlaceholder: 'Tell us about yourself...',

        // Уведомления
        avatarUpdated: 'Avatar updated!',
        bioUpdated: 'Bio updated!',
        fileTooBig: 'File size must not exceed 5 MB',
        changesSaved: 'Changes saved',

        // Кнопка переключателя
        langBtnLabel: 'Русский',
    },

    ru: {
        backToMain: 'На главную',
        profileTitle: 'Профиль',
        editBio: 'Редактировать',
        saveBtn: 'Сохранить',
        cancelBtn: 'Отмена',
        statsTitle: 'Статистика активности',
        productiveGainer: 'Гейнер Продуктивности:',
        totalSessions: 'Всего сессий',
        bioPlaceholder: 'Расскажите о себе...',

        avatarUpdated: 'Аватар обновлен!',
        bioUpdated: 'Биография обновлена!',
        fileTooBig: 'Размер файла не должен превышать 5 МБ',
        changesSaved: 'Изменения сохранены',

        langBtnLabel: 'English',
    }
};

let currentLang = localStorage.getItem('pg_lang') || 'en';

function getItemTranslate(item) {
    if (translations[currentLang][item] != undefined) {
        return translations[currentLang][item];
    }
    else {
        return item;
    }
}

function applyTranslate() {
    document.querySelectorAll('[data-tt]').forEach(element => {
        const item = element.dataset.tt;
        const text = getItemTranslate(item);
        if (text !== undefined) element.textContent = text;
    });

    // Плейсхолдеры (у textarea нельзя менять textContent)
    document.querySelectorAll('[data-tt-placeholder]').forEach(element => {
        element.placeholder = getItemTranslate(element.dataset.ttPlaceholder);
    });

    // Текст на кнопке переключателя: 'Русский' для en, 'English' для ru
    const langBtn = document.getElementById('langToggleBtn');
    if (langBtn) langBtn.textContent = getItemTranslate('langBtnLabel');

    // Биография: переводим только плейсхолдер, а не текст, написанный пользователем
    const bioText = document.getElementById('bioText');
    if (bioText && bioText.dataset.empty === 'true') {
        bioText.textContent = getItemTranslate('bioPlaceholder');
    }

    document.title = getItemTranslate('profileTitle');
    document.documentElement.lang = currentLang;
}

function toggleLanguage() {
    if (currentLang === 'en') {
        currentLang = 'ru';
    } else {
        currentLang = 'en';
    }
    localStorage.setItem('pg_lang', currentLang);
    applyTranslate();
}

// ===== Страница профиля =====
document.addEventListener('DOMContentLoaded', function () {
    // Проверка авторизации
    if (!authSystem.isLoggedIn()) {
        window.location.href = 'login.html';
    }

    let currentUser = authSystem.getCurrentUser();
    let currentProfile = authSystem.getCurrentUserProfile();

    document.getElementById('langToggleBtn').addEventListener('click', toggleLanguage);

    // Форматирование времени
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    // Загрузка профиля
    function loadProfile() {
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('email').textContent = currentUser.email;

        if (currentProfile) {
            // Аватар
            if (currentProfile.avatar) {
                document.getElementById('avatarImage').src = currentProfile.avatar;
            } else {
                document.getElementById('avatarImage').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=2d572c&color=fff&size=200`;
            }

            // Биография
            if (currentProfile.bio) {
                document.getElementById('bioText').textContent = currentProfile.bio;
                document.getElementById('bioText').dataset.empty = 'false';
            }

            // Статистика
            if (currentProfile.stats && currentProfile.stats.productiveGainer) {
                const stats = currentProfile.stats.productiveGainer;
                document.getElementById('narcissusTime').textContent = formatTime(stats.narcissus);
                document.getElementById('seastonesTime').textContent = formatTime(stats.seastones);
                document.getElementById('runningTime').textContent = formatTime(stats.running);
                document.getElementById('totalSessions').textContent = stats.sessions;
            }


        }
    }

    // Загрузка аватара
    document.getElementById('avatarInput').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showMessage('fileTooBig', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = document.getElementById('avatarImage');
                img.src = event.target.result;

                const result = authSystem.updateUserProfile(currentUser.id, {
                    avatar: event.target.result
                });

                if (result.success) {
                    showMessage('avatarUpdated', 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    });


    // Редактирование биографии
    function toggleBioEdit() {
        const bioText = document.getElementById('bioText');
        document.getElementById('bioDisplay').style.display = 'none';
        document.getElementById('bioEdit').style.display = 'block';
        // Если в блоке показан плейсхолдер — textarea оставляем пустой
        document.getElementById('bioTextarea').value =
            bioText.dataset.empty === 'true' ? '' : bioText.textContent;
    }

    function cancelBioEdit() {
        document.getElementById('bioDisplay').style.display = 'block';
        document.getElementById('bioEdit').style.display = 'none';
    }

    function saveBio() {
        const bioValue = document.getElementById('bioTextarea').value.trim();

        const result = authSystem.updateUserProfile(currentUser.id, {
            bio: bioValue
        });

        if (result.success) {
            const bioText = document.getElementById('bioText');
            bioText.dataset.empty = bioValue ? 'false' : 'true';
            bioText.textContent = bioValue || getItemTranslate('bioPlaceholder');
            cancelBioEdit();
            showMessage('bioUpdated', 'success');
        }
    }

    // text — ключ из translations (если ключа нет, getItemTranslate вернёт саму строку)
    function showMessage(text, type) {
        const msg = document.getElementById('message');
        msg.textContent = getItemTranslate(text);
        msg.className = 'message ' + type;
        msg.style.display = 'block';

        setTimeout(() => {
            msg.style.display = 'none';
        }, 3000);
    }
    function saveProfile() {
        showMessage('changesSaved', 'success');
    }
    window.saveProfile = saveProfile;
    window.toggleBioEdit = toggleBioEdit;
    window.cancelBioEdit = cancelBioEdit;
    window.saveBio = saveBio;
    // Загрузка при старте
    loadProfile();
    applyTranslate();
    // Обновление при изменении localStorage из другой вкладки



});

window.addEventListener('storage', function(e) {
    if (e.key === 'usersXML') {
        currentUser = authSystem.getCurrentUser();
        currentProfile = authSystem.getCurrentUserProfile();
        loadProfile();
    }
});