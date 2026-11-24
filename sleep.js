(() => {
'use strict';

// ================= DOM =================
const $ = id => document.getElementById(id);

const timerDisplay = $('timer');
const startBtn     = $('start');
const resetBtn     = $('reset');
const stopBtn      = $('stop');
const timeButtons  = document.querySelectorAll('.sleep-timechoose button');

const openPlantModalBtn = $('openPlantModal');
const plantModal        = $('plantModal');
const plantImage        = $('plantStage1');
const closeModalBtn     = document.querySelector('.close-modal');
const applyBtn          = $('ApplySelection');

const galleryDiv      = $('gallery');
const fullscreenDiv   = $('fullscreen');
const previewAudio    = $('previewAudio');
const npPlayBtn       = $('npPlayBtn');
const npPlayIcon      = $('npPlayIcon');
const nowPlayingTitle = $('nowPlayingTitle');
const nowPlayingSub   = $('nowPlayingSub');
const npBarFill       = $('npBarFill');
const npTime          = $('npTime');

const page         = $('page');
const timeChooseEl = $('timechoose');
const plantContain = document.querySelector('.plant_container');
const menuf        = $('menuf');
const bmo          = $('message');
const menuHandle   = $('menu_handle');
const menuContent  = $('menu_content');
const handleArrows = document.querySelectorAll('.menu_handle i');
const userBtn      = document.querySelector('#userBtn');
const logoutBtn    = $('logoutBtn');
const langToggleBtn = $('langToggleBtn');

const mobileMenu        = $('mobileMenu');
const mobileMenuHandle  = $('mobileMenuHandle');
const mobileMenuContent = $('mobileMenuContent');
const mobileMq          = window.matchMedia('(max-width: 748px)');

// ================= STATE =================
let currentMusic   = null;
let totalSeconds   = 1800;
let initialTime    = 1800;
let timerInterval  = null;
let isRunning      = false;
let selectedWidget = null;
let selectedMusic  = null;
let menuvisible    = false;
let mobileMenuOpen = false;

// ================= DATA =================
const widgetsData = {
    fish: {
        name: 'Art Deco',
        subtitle: 'A1',
        music: document.getElementById('fishmusic'),
        images: ['img/sleep_helper/art_deco.png', 'img/sleep_helper/Honeymoon.jpg'],
    },
    shark: {
        name: 'Private',
        subtitle: 'A2',
        music: document.getElementById('privatemusic'),
        images: ['img/sleep_helper/private.png', 'img/sleep_helper/private_album.png'],
    },
    scolo: {
        name: 'Your Mother Was Cheaper',
        subtitle: 'A3',
        music: document.getElementById('scolomusic'),
        images: ['img/sleep_helper/scolo.png', 'img/sleep_helper/Fire.jpg'],
    },
    japan: {
        name: '505',
        subtitle: 'A4',
        music: document.getElementById('japanmusic'),
        images: ['img/sleep_helper/505.png', 'img/sleep_helper/505_album.png'],
    },
    raven: {
        name: 'Do You Wanna Come Over',
        subtitle: 'A5',
        music: document.getElementById('ravenmusic'),
        images: ['img/sleep_helper/fish.png', 'img/sleep_helper/Jann.jpg'],
    },
    jellyfish: {
        name: 'Tattoos',
        subtitle: 'A6',
        music: document.getElementById('jellyfishmusic'),
        images: ['img/sleep_helper/tattoos.png', 'img/sleep_helper/SUPERSTAR.jpg'],
    },
    chihiro: {
        name: 'CHIHIRO',
        subtitle: 'A7',
        music: document.getElementById('chihiromusic'),
        images: ['img/sleep_helper/chihiro.png', 'img/sleep_helper/chihiro_cover.jpg'],
    }
};

// ================= GALLERY =================
function updatePlantImages(plantType) {
    if (widgetsData[plantType]) {
        plantImage.src = widgetsData[plantType].images[0];
    }
}

function initializeGallery() {
    galleryDiv.innerHTML = '';

    Object.keys(widgetsData).forEach((key, index) => {
        const widget = widgetsData[key];
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.dataset.music = key;
        albumCard.dataset.index = index;

        const coverImage = widget.images[1];   // ← было без const

        albumCard.innerHTML = `
            <div class="album-cover">
                <div class="ac-inner">
                    <img src="${coverImage}" alt="Album cover for ${widget.name}">
                </div>
            </div>
            <div class="album-label" data-tt="album_${key}">${widget.name}</div>
        `;

        albumCard.addEventListener('click',      () => selectAlbum(index, key, albumCard, true));
        albumCard.addEventListener('mouseenter', () => hoverAlbum(index, key, albumCard));
        albumCard.addEventListener('mouseleave', stopHoverPreview);

        galleryDiv.appendChild(albumCard);
    });

    const firstCard = galleryDiv.querySelector('.album-card');
    if (firstCard) {
        selectAlbum(parseInt(firstCard.dataset.index, 10), firstCard.dataset.music, firstCard, false);
        setTimeout(() => {
            galleryDiv.scrollLeft = Math.max(0, firstCard.offsetLeft - 40);
        }, 50);
    }
    nowPlayingTitle.textContent = 'Select a track';
    nowPlayingTitle.setAttribute('data-tt', 'selectTrack');
}

function applyCoverFlow(selectedIndex) {
    const cards = galleryDiv.querySelectorAll('.album-card');
    cards.forEach(card => {
        card.classList.remove('left-far', 'left', 'center', 'right', 'right-far', 'hidden');
        const index = parseInt(card.dataset.index, 10);
        const diff = index - selectedIndex;

        if (diff === 0)      card.classList.add('center');
        else if (diff === -1) card.classList.add('left');
        else if (diff === 1)  card.classList.add('right');
        else if (diff === -2) card.classList.add('left-far');
        else if (diff === 2)  card.classList.add('right-far');
    });
}

function selectAlbum(index, key, element, playPreview) {
    document.querySelectorAll('.album-card').forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');

    selectedWidget = key;
    selectedMusic  = key;

    applyCoverFlow(index);

    const widget = widgetsData[key];
    nowPlayingTitle.textContent = widget.name;
    nowPlayingTitle.setAttribute('data-tt', `album_${key}`);
    nowPlayingSub.textContent = widget.subtitle;

    const progressEl = document.getElementById('nowPlayingProgress');
    if (progressEl) progressEl.style.display = 'flex';

    updatePreviewButton(key);
    updatePlantImages(key);

    if (playPreview) startPreview(key);
}

function hoverAlbum(index, key, element) {
    selectAlbum(index, key, element, false);
    startPreview(key);
}

let previewToken = 0;   // защита от гонки между hover'ами

function startPreview(key) {
    const widget = widgetsData[key];
    if (!widget || !widget.music) return;

    const myToken = ++previewToken;
    const newSrc  = widget.music.src;

    // Останавливаем текущее воспроизведение перед сменой src
    if (!previewAudio.paused) {
        previewAudio.pause();
    }

    // Меняем src только если он реально другой
    if (previewAudio.src !== newSrc) {
        previewAudio.src = newSrc;
        previewAudio.currentTime = 0;
    }

    const p = previewAudio.play();
    if (p && typeof p.catch === 'function') {
        p.catch(err => {
            // AbortError при быстром переключении треков — норма, игнорируем.
            // Также игнорируем, если за время ожидания уже выбрали другой трек.
            if (err.name === 'AbortError') return;
            if (myToken !== previewToken) return;
            console.warn('Preview error:', err);
        });
    }

    npPlayBtn.style.display = 'block';
    npPlayBtn.classList.add('playing');
    npPlayIcon.className = 'bi bi-pause-fill';
}
function stopHoverPreview() {
    if (!previewAudio.paused) {
        previewAudio.pause();
        npPlayBtn.classList.remove('playing');
        npPlayIcon.className = 'bi bi-play-fill';
    }
}

function updatePreviewButton(key) {
    npPlayBtn.style.display = 'block';
    npPlayBtn.classList.remove('playing');
    npPlayIcon.className = 'bi bi-play-fill';
    npTime.textContent = '0:00';
    npBarFill.style.width = '0%';
}

npPlayBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!selectedMusic) return;

    const widget = widgetsData[selectedMusic];
    if (!widget || !widget.music) return;

    if (npPlayBtn.classList.contains('playing')) {
        previewAudio.pause();
        npPlayBtn.classList.remove('playing');
        npPlayIcon.className = 'bi bi-play-fill';
    } else {
        previewAudio.src = widget.music.src;
        previewAudio.currentTime = 0;
        previewAudio.play().catch(err => console.warn('Preview error:', err));
        npPlayBtn.classList.add('playing');
        npPlayIcon.className = 'bi bi-pause-fill';
    }
});

previewAudio.addEventListener('timeupdate', () => {
    const duration = previewAudio.duration || 30;
    const percent  = (previewAudio.currentTime / duration) * 100;
    npBarFill.style.width = percent + '%';

    const minutes = Math.floor(previewAudio.currentTime / 60);
    const seconds = Math.floor(previewAudio.currentTime % 60);
    npTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

previewAudio.addEventListener('ended', () => {
    npPlayBtn.classList.remove('playing');
    npPlayIcon.className = 'bi bi-play-fill';
});

// ================= TIMER =================
function setPlantRotation(rotate) {
    if (rotate) plantImage.classList.add('rotating');
    else        plantImage.classList.remove('rotating');
}

function updateTimerDisplay() {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timerDisplay.textContent =
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function playMusic() {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
    }

    const song = selectedMusic && widgetsData[selectedMusic] && widgetsData[selectedMusic].music;
    if (!song) {
        console.warn('playMusic: трек не найден для', selectedMusic);
        return;
    }

    currentMusic = song;
    const p = song.play();
    if (p && typeof p.then === 'function') {
        p.then(() => console.log('Music playing:', selectedMusic))
         .catch(err => console.error('Ошибка воспроизведения:', err, song.src));
    }
}

function startTimer() {
    if (isRunning) return;
    if (!selectedWidget || !selectedMusic) {
        alert('Please select a widget and music');
        return;
    }

    isRunning = true;
    startBtn.disabled = true;
    setPlantRotation(true);

    playMusic();

    timerInterval = setInterval(() => {
        totalSeconds--;
        updateTimerDisplay();

        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.disabled = false;
            setPlantRotation(false);
            if (currentMusic) currentMusic.pause();
            alert('Sleep session completed!');
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    setPlantRotation(false);

    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
    }

    const activeTimeBtn = document.querySelector('.sleep-timechoose button.active');
    if (activeTimeBtn) {
        totalSeconds = parseInt(activeTimeBtn.dataset.time);
        initialTime  = totalSeconds;
    } else {
        totalSeconds = 1800;
        initialTime  = 1800;
    }
    updateTimerDisplay();
}

function stopTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    setPlantRotation(false);

    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
    }
}

// ================= TIMER BUTTONS =================
startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);
stopBtn.addEventListener('click',  stopTimer);

timeButtons.forEach(button => {
    button.addEventListener('click', function () {
        if (isRunning) return;
        timeButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        totalSeconds = parseInt(this.dataset.time);
        initialTime  = totalSeconds;
        updateTimerDisplay();
    });
});

// ================= MODAL =================
openPlantModalBtn.addEventListener('click', () => plantModal.showModal());
closeModalBtn.addEventListener('click',     () => plantModal.close());

applyBtn.addEventListener('click', () => {
    if (!selectedWidget || !selectedMusic) {
        alert('Please select a widget and music');
        return;
    }
    const widget = widgetsData[selectedWidget];
    openPlantModalBtn.textContent = widget.name;
    openPlantModalBtn.setAttribute('data-tt', `album_${selectedWidget}`);
    plantModal.close();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && plantModal.open) plantModal.close();
});

// ================= SIDE MENU (desktop) =================
function setMenuOpen(open) {
    menuvisible = open;
    if (menuContent) menuContent.style.display = open ? 'flex' : 'none';
    if (handleArrows.length > 1) {
        handleArrows[0].style.display = open ? 'none'  : 'block';
        handleArrows[1].style.display = open ? 'block' : 'none';
    }
}
if (menuHandle) {
    menuHandle.addEventListener('click', () => setMenuOpen(!menuvisible));
}

// ================= AUTH =================
if (typeof authSystem !== 'undefined' && authSystem.isLoggedIn()) {
    if (userBtn)   userBtn.style.display = 'block';
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authSystem.logout();
            window.location.reload();
        });
    }
} else {
    if (userBtn) userBtn.style.display = 'none';
}

// ================= TRANSLATIONS =================
const translations = {
    en: {
        timer_title: 'Sleep Helper',
        chooseWidget: 'Choose Your Widget',
        sectionMusic: 'Choose Music',
        applyBtn: 'Apply Selection',
        profile: 'Profile',
        productiveMode: 'Productivity Mode',

        album_fish: 'Art Deco',
        album_shark: 'Private',
        album_scolo: 'Your Mother Was Cheaper',
        album_japan: 'White Ferrari',
        album_raven: 'Scream My Name',
        album_jellyfish: 'Tattoos',
        album_chihiro: 'CHIHIRO',

        selectTrack: 'Select a track',
        langBtnLabel: 'Русский',
        bmo: 'Feedback',
    },
    ru: {
        timer_title: 'Помощник сна',
        chooseWidget: 'Выбрать виджет',
        sectionMusic: 'Выберите музыку',
        applyBtn: 'Применить выбор',
        profile: 'Профиль',
        productiveMode: 'Режим продуктивности',

        album_fish: 'Art Deco',
        album_shark: 'Private',
        album_scolo: 'Your Mother Was Cheaper',
        album_japan: 'White Ferrari',
        album_raven: 'Scream My Name',
        album_jellyfish: 'Tattoos',
        album_chihiro: 'CHIHIRO',

        selectTrack: 'Выберите трек',
        langBtnLabel: 'English',
        bmo: 'Обратная связь',
    }
};

let currentLang = localStorage.getItem('pg_lang') || 'en';

function getItemTranslate(item) {
    return translations[currentLang][item] !== undefined
        ? translations[currentLang][item]
        : item;
}

function applyTranslate() {
    document.querySelectorAll('[data-tt]').forEach(element => {
        const item = element.dataset.tt;
        const text = getItemTranslate(item);
        if (text !== undefined) element.textContent = text;
    });
    if (langToggleBtn) langToggleBtn.textContent = getItemTranslate('langBtnLabel');
    document.documentElement.lang = currentLang;
}

function toggleLanguage() {
    currentLang = (currentLang === 'en') ? 'ru' : 'en';
    localStorage.setItem('pg_lang', currentLang);
    applyTranslate();
}

if (langToggleBtn) langToggleBtn.addEventListener('click', toggleLanguage);

// ================= DOUBLE CLICK / TAP =================
function addDoubleTapSupport(element, callback) {
    let lastTap = 0;
    let tapTimeout = null;
    element.addEventListener('touchstart', function (e) {
        const now = Date.now();
        const interval = 300;
        if (now - lastTap < interval) {
            e.preventDefault();
            callback(e);
            lastTap = 0;
            clearTimeout(tapTimeout);
        } else {
            lastTap = now;
            tapTimeout = setTimeout(() => { lastTap = 0; }, interval);
        }
    }, { passive: false });
}

function openJukebox() {
    if (!plantModal.open) plantModal.showModal();
}

// Показать/скрыть панель времени. Работает ТОЛЬКО на мобильных (≤748px).
function toggleTimeChoose() {
    if (!mobileMq.matches) return;
    if (timeChooseEl) timeChooseEl.classList.toggle('show-time');
}

// --- Двойной клик / двойной тап по ТАЙМЕРУ: показать/скрыть выбор времени ---
// Только для мобильных экранов. На десктопе кнопки времени всегда видны,
// и никакого двойного клика по таймеру быть не должно.
if (timerDisplay) {
    timerDisplay.addEventListener('dblclick', (e) => {
        if (!mobileMq.matches) return;   // на десктопе — игнор
        e.stopPropagation();
        e.preventDefault();
        toggleTimeChoose();
    });
    addDoubleTapSupport(timerDisplay, (e) => {
        if (!mobileMq.matches) return;   // на десктопе — игнор
        e.stopPropagation();
        toggleTimeChoose();
    });
}

// --- Двойной клик / двойной тап по РАСТЕНИЮ: открыть джукбокс ---
if (plantContain) {
    plantContain.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        e.preventDefault();
        openJukebox();
    });
    addDoubleTapSupport(plantContain, (e) => {
        e.stopPropagation();
        openJukebox();
    });
}

// Apply → прячем кнопку выбора виджета (has-selection).
// Панель времени не трогаем — на мобильных она управляется двойным тапом,
// на десктопе всегда видна.
if (applyBtn) {
    applyBtn.addEventListener('click', () => {
        if (!selectedWidget || !selectedMusic) return;
        if (page) page.classList.add('has-selection');
    });
}

// ================= MOBILE MENU =================
function setMobileMenuOpen(open) {
    mobileMenuOpen = open;
    if (!mobileMenu) return;
    mobileMenu.classList.toggle('is-open', open);
    if (mobileMenuHandle) mobileMenuHandle.setAttribute('aria-expanded', String(open));
}

function applyLayoutMode() {
    if (!mobileMenu || !mobileMenuContent) return;

    if (mobileMq.matches) {
        mobileMenuContent.append(menuContent, bmo);
    } else {
        if (menuf && menuContent && menuContent.parentElement !== menuf) {
            menuf.append(menuContent);
        }
        if (bmo && bmo.parentElement !== document.body) {
            document.body.append(bmo);
        }
    }
    setMenuOpen(false);
    setMobileMenuOpen(false);
}

if (mobileMenu && mobileMenuHandle && mobileMenuContent && menuContent && bmo) {
    mobileMq.addEventListener('change', applyLayoutMode);
    applyLayoutMode();

    mobileMenuHandle.addEventListener('click', () => setMobileMenuOpen(!mobileMenuOpen));

    document.addEventListener('click', (e) => {
        if (mobileMq.matches && mobileMenuOpen && !mobileMenu.contains(e.target)) {
            setMobileMenuOpen(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenuOpen) setMobileMenuOpen(false);
    });

    let swipeStartY    = null;
    let swipeFromHandle = false;

    mobileMenu.addEventListener('touchstart', (e) => {
        swipeStartY     = e.touches[0].clientY;
        swipeFromHandle = mobileMenuHandle.contains(e.target);
    }, { passive: true });

    mobileMenu.addEventListener('touchend', (e) => {
        if (swipeStartY === null) return;
        const dy = e.changedTouches[0].clientY - swipeStartY;
        swipeStartY = null;

        if (mobileMenuOpen && dy > 60 && (swipeFromHandle || mobileMenuContent.scrollTop === 0)) {
            setMobileMenuOpen(false);
        } else if (!mobileMenuOpen && dy < -30) {
            setMobileMenuOpen(true);
        }
    }, { passive: true });
} else {
    console.warn('Sleep Helper: элементы нижнего меню не найдены');
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
    applyTranslate();
    initializeGallery();
    updateTimerDisplay();

    if (timeButtons.length > 1) timeButtons[1].click();

    const defaultWidget = Object.keys(widgetsData)[0];
    if (defaultWidget && widgetsData[defaultWidget]) {
        selectedWidget = defaultWidget;
        selectedMusic  = defaultWidget;
        updatePlantImages(defaultWidget);
    }
});

window.__sleepReady = true;
})();


