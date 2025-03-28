// Получение элементов со страницы
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const maxScoreElement = document.getElementById('maxScore');
const gameOverElement = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const pauseMenu = document.getElementById('pauseMenu');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

// Звуковые эффекты
const jumpSound = new Audio('sounds/jump.mp3');
const superjumpSound = new Audio('sounds/superjump.mp3');
const shootSound = new Audio('sounds/shoot.mp3');
const gameOverSound = new Audio('sounds/gameover.mp3');
const monsterHitSound = new Audio('sounds/monsterhit.mp3');

// Загружаем изображение персонажа (doodle)
const doodleImg = new Image();
doodleImg.src = 'images/doodle.png';
// Флаг паузы
let paused = false;

// Основные переменные игры
let gameRunning = true; // Флаг, что игра запущена
let score = 0;          // Текущий счет
let highestY = 0;       // Самая высокая точка персонажа
let maxScore = 0;       // Максимальный счет

// Параметры платформ
const platformWidth = 40;
const platformHeight = 10;
const platformStart = canvas.height - 50; // Стартовая платформа

// Физика персонажа
const gravity = 0.28;         // Сила гравитации
const drag = 0.3;             // Замедление по горизонтали
const bounceVelocity = -11.5; // Скорость отскока

// Расстояние между платформами
let minPlatformSpace = 15;
let maxPlatformSpace = 20;

// Массив платформ - первая платформа стандартная
let platforms = [{
  x: canvas.width / 2 - platformWidth / 2,
  y: platformStart,
  type: 'normal'
}];

// Массив пуль
let bullets = [];

// Объект персонажа (doodle)
const doodle = {
  width: 40,
  height: 60,
  x: canvas.width / 2 - 20,
  y: platformStart - 60,
  dx: 0,   // Скорость по оси x
  dy: 0    // Скорость по оси y
};

let playerDir = 0;   // Направление движения персонажа (-1 влево, 1 вправо)
let keydown = false; // Флаг, что клавиша нажата
let prevDoodleY = doodle.y; // Предыдущая y-координата персонажа

// Функция для получения случайного числа
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// Функция для определения типа платформы с шансами:
// 10% monster, 10% trampoline, 20% red, 60% normal
function getRandomPlatformType() {
  let r = Math.random();
  if (r < 0.1) return 'monster';
  else if (r < 0.2) return 'trampoline';
  else if (r < 0.4) return 'red';
  else return 'normal';
}

// Функция инициализации игры
function initGame() {
  gameRunning = true;
  score = 0;
  highestY = 0;
  scoreElement.textContent = 'score: 0';
  gameOverElement.style.display = 'none';
  pauseMenu.style.display = 'none';
  bullets = [];

  // Создание первой платформы
  platforms = [{
    x: canvas.width / 2 - platformWidth / 2,
    y: platformStart,
    type: 'normal'
  }];

  // Установка расстояний между платформами
  minPlatformSpace = 15;
  maxPlatformSpace = 20;
  let y = platformStart;
  // Создаем платформы до тех пор, пока y > 0
  while (y > 0) {
    y -= platformHeight + random(minPlatformSpace, maxPlatformSpace);
    let x;
    // Генерируем случайное x до подходящего значения
    do {
      x = random(25, canvas.width - 25 - platformWidth);
    } while (
      y > canvas.height / 2 &&
      x > canvas.width / 2 - platformWidth * 1.5 &&
      x < canvas.width / 2 + platformWidth / 2
    );
    let platformType = getRandomPlatformType();
    platforms.push({ x, y, type: platformType });
  }

  // Сброс позиции персонажа
  doodle.x = canvas.width / 2 - 20;
  doodle.y = platformStart - 60;
  doodle.dx = 0;
  doodle.dy = 0;
  prevDoodleY = doodle.y;

  // Сбрасываем флаг паузы при запуске
  paused = false;
  requestAnimationFrame(loop);
}

// Функция окончания игры
function gameOver() {
  gameRunning = false;
  finalScoreElement.textContent = 'score: ' + score;
  gameOverElement.style.display = 'flex';
  // Проигрываем звук поражения
  gameOverSound.currentTime = 0;
  gameOverSound.play();
  if (score > maxScore) {
    maxScore = score;
    maxScoreElement.textContent = 'max score: ' + maxScore;
  }
}

// Функция создания пули с эффектом
function shootBullet() {
  // Создаем объект пули, вылетающей из центра персонажа
  bullets.push({
    x: doodle.x + doodle.width / 2 - 2.5,
    y: doodle.y,
    width: 5,
    height: 10,
    dy: -8
  });
  // Проигрываем звук выстрела
  shootSound.currentTime = 0;
  shootSound.play();
}

// Основной игровой цикл
function loop() {
  // Если игра поставлена на паузу, просто вызываем loop заново
  if (paused) {
    requestAnimationFrame(loop);
    return;
  }
  if (!gameRunning) return; // Если игра не запущена, выходим

  requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Обновляем и отрисовываем пули
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.y += bullet.dy; // Пуля летит вверх
    // Если пуля вышла за верх, удаляем её
    if (bullet.y + bullet.height < 0) {
      bullets.splice(i, 1);
      continue;
    }
    // Создаем градиент для пули
    let grad = context.createRadialGradient(
      bullet.x + bullet.width / 2,
      bullet.y + bullet.height / 2,
      1,
      bullet.x + bullet.width / 2,
      bullet.y + bullet.height / 2,
      bullet.width
    );
    grad.addColorStop(0, '#ffd700'); // золотой
    grad.addColorStop(1, '#ff8c00'); // темно-оранжевый
    context.fillStyle = grad;
    context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

    // Проверяем столкновение пули с платформами типа monster
    for (let j = 0; j < platforms.length; j++) {
      let platform = platforms[j];
      if (platform.type === 'monster' && !platform.removed) {
        if (
          bullet.x < platform.x + platformWidth &&
          bullet.x + bullet.width > platform.x &&
          bullet.y < platform.y + platformHeight &&
          bullet.y + bullet.height > platform.y
        ) {
          // Проигрываем звук попадания в монстра
          monsterHitSound.currentTime = 0;
          monsterHitSound.play();
          platforms[j].removed = true;
          bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  // Применяем гравитацию к персонажу
  doodle.dy += gravity;

  // Если персонаж выше середины экрана и движется вверх, двигаем платформы вниз
  if (doodle.y < canvas.height / 2 && doodle.dy < 0) {
    const deltaY = -doodle.dy;
    platforms.forEach(platform => {
      platform.y += deltaY;
    });
    score += Math.floor(deltaY);
    if (score > maxScore){
      maxScore = score
    }
    if (doodle.y < highestY) {
      highestY = doodle.y;
      score = Math.floor(-highestY / 10);
    }
    maxScoreElement.textContent = 'max score: ' + maxScore
    scoreElement.textContent = 'score: ' + score;
    // Генерируем новые платформы сверху
    while (platforms[platforms.length - 1].y > 0) {
      let newY = platforms[platforms.length - 1].y - (platformHeight + random(minPlatformSpace, maxPlatformSpace));
      let newX = random(25, canvas.width - 25 - platformWidth);
      let platformType = getRandomPlatformType();
      platforms.push({ x: newX, y: newY, type: platformType });
      minPlatformSpace += 0.5;
      maxPlatformSpace += 0.5;
      maxPlatformSpace = Math.min(maxPlatformSpace, canvas.height / 2);
    }
  } else {
    doodle.y += doodle.dy;
  }

  // Если персонаж упал ниже экрана, игра заканчивается
  if (doodle.y > canvas.height) {
    gameOver();
    return;
  }

  // Если клавиши не нажаты, замедляем горизонтальное движение
  if (!keydown) {
    if (playerDir < 0) {
      doodle.dx += drag;
      if (doodle.dx > 0) {
        doodle.dx = 0;
        playerDir = 0;
      }
    } else if (playerDir > 0) {
      doodle.dx -= drag;
      if (doodle.dx < 0) {
        doodle.dx = 0;
        playerDir = 0;
      }
    }
  }
  doodle.x += doodle.dx;

  // Горизонтальное "заворачивание" персонажа
  if (doodle.x + doodle.width < 0) {
    doodle.x = canvas.width;
  } else if (doodle.x > canvas.width) {
    doodle.x = -doodle.width;
  }

  // Отрисовываем платформы
  platforms.forEach(platform => {
    if (platform.removed) return; // Пропускаем удаленные платформы
    if (platform.type === 'red') {
      context.fillStyle = 'red';
    } else if (platform.type === 'trampoline') {
      context.fillStyle = 'orange';
    } else if (platform.type === 'monster') {
      context.fillStyle = 'black';
    } else {
      context.fillStyle = 'green';
    }
    context.fillRect(platform.x, platform.y, platformWidth, platformHeight);
  });

  // Проверяем столкновение персонажа с платформами
  for (let i = 0; i < platforms.length; i++) {
    let platform = platforms[i];
    if (platform.removed) continue;
    if (
      doodle.dy > 0 &&
      prevDoodleY + doodle.height <= platform.y &&
      doodle.x < platform.x + platformWidth &&
      doodle.x + doodle.width > platform.x &&
      doodle.y < platform.y + platformHeight &&
      doodle.y + doodle.height > platform.y
    ) {
      if (platform.type === 'monster') {
        // Если персонаж касается монстра — игра заканчивается
        gameOver();
        return;
      } else if (platform.type === 'trampoline') {
        // Если платформа-батут, даем сильный отскок
        doodle.y = platform.y - doodle.height;
        doodle.dy = -18;
        superjumpSound.currentTime = 0;
        superjumpSound.play();
      } else {
        // Обычный отскок
        doodle.y = platform.y - doodle.height;
        doodle.dy = bounceVelocity;
        jumpSound.currentTime = 0;
        jumpSound.play();
        // Если красная платформа, удаляем её после отскока
        if (platform.type === 'red') {
          platforms[i].removed = true;
        }
      }
    }
  }

  // Отрисовываем персонажа с использованием изображения
  context.drawImage(doodleImg, doodle.x, doodle.y, doodle.width, doodle.height);

  // Сохраняем предыдущую позицию персонажа
  prevDoodleY = doodle.y;
}

// Обработка клавиатуры: стрелки — движение, пробел — выстрел или перезапуск, Enter — перезапуск
document.addEventListener('keydown', function(e) {
  if (e.which === 27) { // ESC для паузы
    paused = !paused;
    pauseMenu.style.display = paused ? 'flex' : 'none';
  }
  if (e.which === 32) {
    if (gameRunning && !paused) {
      shootBullet();
    } else if (!gameRunning) {
      initGame();
    }
  } else if (e.which === 37) {
    keydown = true;
    playerDir = -1;
    // Скорость перемещения (±6)
    doodle.dx = -6;
  } else if (e.which === 39) {
    keydown = true;
    playerDir = 1;
    doodle.dx = 6;
  } else if (e.which === 13 && !gameRunning) {
    initGame();
  }
});

document.addEventListener('keyup', function(e) {
  if (e.which === 37 || e.which === 39) {
    keydown = false;
  }
});

// Обработка событий для мобильных кнопок
leftButton.addEventListener('mousedown', function(e) {
  keydown = true;
  playerDir = -1;
  doodle.dx = -6;
});
leftButton.addEventListener('mouseup', function(e) {
  keydown = false;
});
leftButton.addEventListener('touchstart', function(e) {
  e.preventDefault();
  keydown = true;
  playerDir = -1;
  doodle.dx = -6;
});
leftButton.addEventListener('touchend', function(e) {
  e.preventDefault();
  keydown = false;
});

rightButton.addEventListener('mousedown', function(e) {
  keydown = true;
  playerDir = 1;
  doodle.dx = 6;
});
rightButton.addEventListener('mouseup', function(e) {
  keydown = false;
});
rightButton.addEventListener('touchstart', function(e) {
  e.preventDefault();
  keydown = true;
  playerDir = 1;
  doodle.dx = 6;
});
rightButton.addEventListener('touchend', function(e) {
  e.preventDefault();
  keydown = false;
});

restartButton.addEventListener('click', initGame);

// Запускаем игру
initGame();
