// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== ЛОГИКА ДЛЯ ГЛАВНОЙ СТРАНИЦЫ =====
    const mainVideo = document.getElementById('mainVideo');
    const overlay = document.getElementById('overlay');
    const textBlock = document.getElementById('textBlock');
    
    if (mainVideo) {
        // Пытаемся запустить видео
        let playPromise = mainVideo.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Если автовоспроизведение заблокировано, включаем без звука
                mainVideo.muted = true;
                mainVideo.play();
            });
        }
        
        // Когда видео закончилось
        mainVideo.addEventListener('ended', function() {
            // Показываем затемнение
            if (overlay) {
                overlay.classList.add('show');
            }
            
            // Через 600мс показываем текст
            setTimeout(function() {
                if (textBlock) {
                    textBlock.classList.add('show');
                }
            }, 600);
        });
        
        // На случай, если видео слишком короткое или уже закончилось
        if (mainVideo.readyState >= 4) {
            if (mainVideo.duration === mainVideo.currentTime) {
                overlay.classList.add('show');
                setTimeout(function() {
                    textBlock.classList.add('show');
                }, 600);
            }
        }
    }
    
    // ===== МИНИ-ИГРА =====
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        initGame();
    }
    
    // ===== ПРОВЕРКА ЗАГРУЗКИ ИЗОБРАЖЕНИЙ =====
    const images = document.querySelectorAll('.polaroid img');
    images.forEach(img => {
        img.addEventListener('error', function() {
            // Если фото не загрузилось, показываем заглушку
            this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f0e6f0"/><text x="70" y="115" font-family="Arial" font-size="14" fill="%23997a99">фото</text></svg>';
        });
    });
});

// ===== ИНИЦИАЛИЗАЦИЯ ИГРЫ =====
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const catcher = document.getElementById('catcher');
    const scoreElement = document.getElementById('gameScore');
    const winScreen = document.getElementById('winScreen');
    
    // Размеры
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Переменные игры
    let catcherX = width / 2;
    let score = 0;
    let gameActive = true;
    let items = [];
    let spawnInterval;
    
    // Слова для ловли
    const words = [
        'сплетни',
        '13,5',
        'латяо',
        'ростер',
        'я опаздываю',
        'пошли кошмармить'
    ];
    
    // Настройка размера canvas
    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        
        // Обновляем позицию корзинки
        updateCatcher(catcherX);
    }
    
    // Обновление позиции корзинки
    function updateCatcher(x) {
        // Ограничиваем движение
        const minX = 70;
        const maxX = width - 70;
        catcherX = Math.min(maxX, Math.max(minX, x));
        
        if (catcher) {
            catcher.style.left = catcherX + 'px';
        }
    }
    
    // Класс падающего слова
    class FallingWord {
        constructor(word) {
            this.word = word;
            this.x = 40 + Math.random() * (width - 100);
            this.y = -40;
            this.speed = 1.2 + Math.random() * 1.8;
            this.caught = false;
            this.opacity = 1;
        }
        
        update() {
            if (gameActive && !this.caught) {
                this.y += this.speed;
            }
        }
        
        draw() {
            if (this.caught) return;
            
            ctx.font = '17px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillStyle = '#3a2b4a';
            ctx.globalAlpha = this.opacity;
            ctx.fillText(this.word, this.x, this.y);
            ctx.globalAlpha = 1;
        }
        
        checkCatch() {
            if (this.caught) return false;
            
            const catcherTop = height - 85;
            const catcherBottom = height - 35;
            const catcherLeft = catcherX - 60;
            const catcherRight = catcherX + 60;
            
            const wordWidth = ctx.measureText(this.word).width;
            const wordLeft = this.x - wordWidth / 2;
            const wordRight = this.x + wordWidth / 2;
            
            const caught = (
                this.y > catcherTop &&
                this.y < catcherBottom &&
                wordRight > catcherLeft &&
                wordLeft < catcherRight
            );
            
            if (caught) {
                this.caught = true;
                return true;
            }
            return false;
        }
        
        isOffScreen() {
            return this.y > height + 60;
        }
    }
    
    // Создание нового слова
    function spawnWord() {
        if (!gameActive) return;
        
        // Проверяем, какие слова уже активны
        const activeWords = items.map(item => item.word);
        const availableWords = words.filter(word => !activeWords.includes(word));
        
        if (availableWords.length > 0 && items.length < 8) {
            const randomIndex = Math.floor(Math.random() * availableWords.length);
            items.push(new FallingWord(availableWords[randomIndex]));
        }
    }
    
    // Обновление игры
    function update() {
        if (!gameActive) return;
        
        // Обновляем позиции
        items.forEach(item => item.update());
        
        // Проверяем ловлю
        items.forEach(item => {
            if (item.checkCatch()) {
                score++;
                if (scoreElement) {
                    scoreElement.textContent = `поймано: ${score}/6`;
                }
                
                // Вибрация на iPhone
                if (navigator.vibrate) {
                    navigator.vibrate(15);
                }
                
                // Проверка победы
                if (score === 6) {
                    gameActive = false;
                    if (winScreen) {
                        winScreen.classList.add('show');
                    }
                    if (spawnInterval) {
                        clearInterval(spawnInterval);
                    }
                }
            }
        });
        
        // Удаляем пойманные и упавшие
        items = items.filter(item => {
            if (item.caught) return false;
            if (item.isOffScreen()) return false;
            return true;
        });
    }
    
    // Отрисовка
    function draw() {
        ctx.clearRect(0, 0, width, height);
        items.forEach(item => item.draw());
    }
    
    // Игровой цикл
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    // Сброс игры
    window.resetGame = function() {
        score = 0;
        gameActive = true;
        items = [];
        if (scoreElement) {
            scoreElement.textContent = 'поймано: 0/6';
        }
        if (winScreen) {
            winScreen.classList.remove('show');
        }
        
        // Перезапускаем интервал спавна
        if (spawnInterval) {
            clearInterval(spawnInterval);
        }
        spawnInterval = setInterval(spawnWord, 2000);
    };
    
    // Обработчики событий
    window.addEventListener('resize', function() {
        resizeCanvas();
    });
    
    // Мышь (для компьютера)
    document.addEventListener('mousemove', function(e) {
        updateCatcher(e.clientX);
    });
    
    // Тач (для iPhone)
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            updateCatcher(touch.clientX);
        }
    }, { passive: false });
    
    document.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            updateCatcher(touch.clientX);
        }
    }, { passive: false });
    
    // Запрещаем скролл на странице игры
    document.body.addEventListener('touchmove', function(e) {
        if (window.location.href.includes('game.html')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Инициализация
    resizeCanvas();
    updateCatcher(width / 2);
    
    // Запускаем спавн слов
    spawnInterval = setInterval(spawnWord, 2000);
    
    // Старт игры
    gameLoop();
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function goToPage(url) {
    window.location.href = url;
}