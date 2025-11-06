document.addEventListener('DOMContentLoaded', () => {
    const languageIcon = document.getElementById('language-icon');
    const languageDropdown = document.getElementById('language-dropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    const statusElement = document.getElementById('status');
    const flipButton = document.getElementById('flip');
    const countdownElement = document.getElementById('countdown');
    const progressBar = document.getElementById('progress-bar');
    const accuracyElement = document.getElementById('signal-accuracy');
    const gameField = document.getElementById('game-field');
    const leftArrowButton = document.getElementById('left-arrow');
    const rightArrowButton = document.getElementById('right-arrow');

    let currentLanguage = 'cs';
    let isDropdownVisible = false;
    let isCooldownActive = false;
    let isGetSignalActive = false; // Флаг, активен ли процесс после нажатия на "Get Signal"
    let accuracy = '85';
    let activeStars = [];
    let cooldownEndTime = null;
    let currentTrapIndex = 1; // Начальный индекс для "3 BOMBS"
    let currentStarsCount = 0; // Переменная для хранения количества звёзд

    const trapLevels = ["1 BOMB", "3 BOMBS", "5 BOMBS", "7 BOMBS"]; // Уровни ловушек

    const translations = {
        cs: { flip: 'Získat signál', countdown: 'Zbývá:', sec: 'sek', wait: 'HACKOVÁNÍ...', accuracy: 'Přesnost signálu:', stars: 'HVĚZDY', traps: ["1 BOMBA", "3 BOMBY", "5 BOMB", "7 BOMB"], title: 'OPEN AI' },
        en: { flip: 'Get signal', countdown: 'Remaining:', sec: 'sec', wait: 'HACKING...', accuracy: 'Signal accuracy:', stars: 'STARS', traps: ["1 BOMB", "3 BOMBS", "5 BOMBS", "7 BOMBS"], title: 'OPEN AI' }
    };

    // Функция для предзагрузки изображений
    function preloadImages(urls) {
        urls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    // Вызываем предзагрузку изображений при загрузке страницы
    preloadImages([
        'images/cell_1.png',
        'images/cell_2.png',
        'images/star.png',
        'images/minus.png',
        'images/plus.png'
    ]);

    function getStarsText(count) {
        const lang = currentLanguage;
        if (lang === 'cs') {
            if (count === 1) return 'HVĚZDA';
            if ([2, 3, 4].includes(count)) return 'HVĚZDY';
            return 'HVĚZD';
        }
        return translations[lang].stars;
    }

    function updateStatus() {
        if (isGetSignalActive) {
            statusElement.innerText = `${currentStarsCount} ${getStarsText(currentStarsCount)}`;
        } else {
            statusElement.innerText = translations[currentLanguage].traps[currentTrapIndex];
        }
    }

    function updateLanguage(lang) {
        const translation = translations[lang];
        if (translation) {
            flipButton.innerText = translation.flip;
            countdownElement.innerText = `${translation.countdown} 0 ${translation.sec}`;
            accuracyElement.innerText = `${translation.accuracy} ${accuracy}%`;

            // Обновляем элементы с data-i18n атрибутом
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                if (translation[key]) {
                    element.innerText = translation[key];
                }
            });

            if (isGetSignalActive) {
                statusElement.innerText = translation.wait; // Показываем "HACKING..." на выбранном языке
            } else if (isCooldownActive) {
                statusElement.innerText = `${currentStarsCount} ${getStarsText(currentStarsCount)}`;
            } else {
                updateStatus(); // Обновляем статус для ловушек, если взлом не активен
            }
        } else {
            console.error(`No translation found for language: ${lang}`);
        }
    }

    function toggleDropdown() {
        languageDropdown.style.display = isDropdownVisible ? 'none' : 'grid';
        isDropdownVisible = !isDropdownVisible;
    }

    languageIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleDropdown();
    });

    languageOptions.forEach(option => {
        option.addEventListener('click', (event) => {
            event.preventDefault();
            const selectedLang = option.dataset.lang;
            if (translations[selectedLang]) {
                languageIcon.src = option.src;
                currentLanguage = selectedLang;
                updateLanguage(currentLanguage);
                toggleDropdown();
            } else {
                console.error(`No translation found for language: ${selectedLang}`);
            }
        });
    });

    document.addEventListener('click', (event) => {
        if (isDropdownVisible && !languageDropdown.contains(event.target) && event.target !== languageIcon) {
            toggleDropdown();
        }
    });

    const cells = Array.from({ length: 25 }, (_, i) => {
        const cell = document.createElement('div');
        cell.classList.add('cell', i % 2 === 0 ? 'cell-even' : 'cell-odd');
        gameField.appendChild(cell);
        return cell;
    });

    function updateCountdown() {
        const now = Date.now();
        const timeLeft = Math.max(0, cooldownEndTime - now);
        const secondsLeft = Math.ceil(timeLeft / 1000);

        if (timeLeft > 0) {
            const progress = 1 - timeLeft / 15000;
            progressBar.style.width = `${(1 - progress) * 100}%`;
            countdownElement.innerText = `${translations[currentLanguage].countdown} ${secondsLeft} ${translations[currentLanguage].sec}`;
            flipButton.disabled = true;
            flipButton.classList.add('disabled');
            isCooldownActive = true;
        } else {
            progressBar.style.width = '0%';
            countdownElement.innerText = `${translations[currentLanguage].countdown} 0 ${translations[currentLanguage].sec}`;
            flipButton.disabled = false;
            flipButton.classList.remove('disabled');
            isCooldownActive = false;
            if (!isGetSignalActive) { // Обновляем статус, только если взлом не активен
                updateStatus();
            }
        }
    }

    function startCountdown(seconds) {
        cooldownEndTime = Date.now() + seconds * 1000;

        function countdownInterval() {
            updateCountdown();
            if (isCooldownActive) {
                requestAnimationFrame(countdownInterval);
            }
        }

        countdownInterval();
    }

    function resetStarsWithAnimation() {
        const fadeOutDuration = 500;
        const fadeInDuration = 500;

        activeStars.forEach(cell => {
            cell.classList.add('star-fade-out');
            setTimeout(() => {
                cell.classList.remove('star', 'star-fade-out');
                cell.classList.add('fade-in');
                setTimeout(() => {
                    cell.classList.remove('fade-in', 'fade-out');
                }, fadeInDuration);
            }, fadeOutDuration);
        });
        activeStars = [];
    }

    function animateCell(cell, callback) {
        cell.classList.remove('fade-in', 'fade-out');
        cell.classList.add('fade-out');
        setTimeout(() => {
            cell.classList.remove('fade-out');
            callback();
            cell.classList.add('fade-in');
        }, 500);
    }

    function revealCells() {
        currentStarsCount = getRandomStarsForTrapLevel(); // Обновляем количество звёзд
        const randomCells = cells.sort(() => 0.5 - Math.random()).slice(0, currentStarsCount);

        updateStatus(); // Обновляем статус перед началом отображения звёзд

        let revealDelay = 0;
        randomCells.forEach((cell) => {
            setTimeout(() => {
                animateCell(cell, () => {
                    cell.classList.add('star');
                    activeStars.push(cell);
                });
            }, revealDelay);

            revealDelay += 750;
        });

        startCountdown(15);
    }

    function getRandomStarsForTrapLevel() {
        switch (trapLevels[currentTrapIndex]) {
            case "1 BOMB": return Math.floor(Math.random() * 3) + 6; // от 6 до 8 звёзд
            case "3 BOMBS": return Math.floor(Math.random() * 3) + 5; // от 5 до 7 звёзд
            case "5 BOMBS": return Math.floor(Math.random() * 3) + 3; // от 3 до 5 звёзд
            case "7 BOMBS": return Math.floor(Math.random() * 3) + 2; // от 2 до 4 звёзд
        }
    }

    flipButton.addEventListener('click', () => {
        if (isCooldownActive) return;

        flipButton.disabled = true;
        isCooldownActive = true;
        isGetSignalActive = true;
        statusElement.innerText = translations[currentLanguage].wait;

        resetStarsWithAnimation();

        setTimeout(() => {
            revealCells();
            accuracy = Math.floor(Math.random() * 14) + 86;
            accuracyElement.innerText = `${translations[currentLanguage].accuracy} ${accuracy}%`;
            isGetSignalActive = false; // Завершаем процесс "Get Signal"
        }, 1500);
    });

    leftArrowButton.addEventListener('click', () => {
        if (!isCooldownActive && !isGetSignalActive && currentTrapIndex > 0) {
            currentTrapIndex--;
            updateLanguage(currentLanguage);
        }
    });

    rightArrowButton.addEventListener('click', () => {
        if (!isCooldownActive && !isGetSignalActive && currentTrapIndex < trapLevels.length - 1) {
            currentTrapIndex++;
            updateLanguage(currentLanguage);
        }
    });

    updateLanguage(currentLanguage); // Обновляем язык в начале
});