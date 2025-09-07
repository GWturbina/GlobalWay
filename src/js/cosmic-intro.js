// cosmic-intro.js - УЛУЧШЕННАЯ ВЕРСИЯ
class CosmicIntro {
  constructor() {
    this.currentLang = this.getDefaultLanguage();
    this.autoHideTimer = null;
    this.animationFrameId = null;
    this.planets = [];
    this.loadTranslations();
    this.init();
  }
  
  getDefaultLanguage() {
    const saved = localStorage.getItem('selectedLanguage');
    return saved || 'en';
  }
  
  loadTranslations() {
    if (typeof cosmicIntroTranslations !== 'undefined') {
      this.introData = cosmicIntroTranslations[this.currentLang] || cosmicIntroTranslations.en;
    } else {
      this.introData = this.getDefaultTexts();
    }
  }
  
  getDefaultTexts() {
    return {
      club: { title: 'GlobalWay Club', text: 'Living ecosystem where generations connect...' },
      mission: { title: 'Our Mission', text: 'Building fair economy for everyone...' },
      goals: { title: 'Club Goals', text: 'Creating personal income sources...' },
      roadmap: { title: 'Roadmap', text: '2025 — platform launch and 8 projects...' },
      projects: { title: 'Our Projects', text: 'CardGift, GlobalTub, GlobalMarket...' },
      skipButton: { text: 'Go to DApp' }
    };
  }
  
  init() {
    this.createLanguageSelector();
    this.createCosmicPlanets();
    this.updateButtonTexts();
    this.bindEvents();
    this.startPlanetAnimation();
    this.checkWalletConnection();
  }

  // НОВОЕ: Проверка подключения кошелька
  checkWalletConnection() {
    if (window.web3Manager?.isConnected) {
      // Если кошелек уже подключен, скрываем интро через 5 секунд
      this.autoHideTimer = setTimeout(() => {
        this.hideIntro();
      }, 5000);
    } else {
      // Если не подключен, показываем на 8 секунд
      this.startAutoHideTimer();
    }
  }

  // НОВОЕ: Создание космических планет
  createCosmicPlanets() {
    const intro = document.getElementById('cosmic-intro');
    if (!intro) return;

    // Удаляем старые карточки
    const oldCards = intro.querySelectorAll('.cosmic-card');
    oldCards.forEach(card => card.remove());

    // Создаем контейнер для планет
    const planetsContainer = document.createElement('div');
    planetsContainer.className = 'cosmic-planets-container';
    intro.appendChild(planetsContainer);

    const planetData = [
      { id: 'club', color: '#4CAF50', size: 120, emoji: '🌍' },
      { id: 'mission', color: '#2196F3', size: 100, emoji: '🚀' },
      { id: 'goals', color: '#FF9800', size: 110, emoji: '⭐' },
      { id: 'roadmap', color: '#9C27B0', size: 95, emoji: '🛣️' },
      { id: 'projects', color: '#F44336', size: 105, emoji: '🔮' }
    ];

    planetData.forEach((planet, index) => {
      const planetEl = this.createPlanet(planet, index);
      planetsContainer.appendChild(planetEl);
      this.planets.push({
        element: planetEl,
        x: 0,
        y: 0,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        angle: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        ...planet
      });
    });

    this.positionPlanets();
  }

  createPlanet(planet, index) {
    const planetEl = document.createElement('div');
    planetEl.className = 'cosmic-planet';
    planetEl.dataset.topic = planet.id;
    planetEl.style.cssText = `
      width: ${planet.size}px;
      height: ${planet.size}px;
      background: radial-gradient(circle at 30% 30%, ${planet.color}dd, ${planet.color}66, ${planet.color}33);
      border-radius: 50%;
      position: absolute;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      box-shadow: 
        0 0 20px ${planet.color}66,
        inset 0 0 20px rgba(255,255,255,0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      user-select: none;
      z-index: 100;
    `;

    planetEl.innerHTML = `
      <div class="planet-emoji" style="font-size: ${planet.size * 0.3}px; margin-bottom: 5px;">
        ${planet.emoji}
      </div>
      <div class="planet-title" style="
        color: white;
        font-size: ${planet.size * 0.12}px;
        font-weight: bold;
        text-align: center;
        text-shadow: 0 0 10px rgba(0,0,0,0.8);
        line-height: 1.2;
      ">
        ${this.introData[planet.id]?.title || planet.id}
      </div>
    `;

    // Hover эффекты
    planetEl.addEventListener('mouseenter', () => {
      planetEl.style.transform = 'scale(1.1)';
      planetEl.style.boxShadow = `
        0 0 40px ${planet.color}aa,
        inset 0 0 30px rgba(255,255,255,0.2)
      `;
    });

    planetEl.addEventListener('mouseleave', () => {
      planetEl.style.transform = 'scale(1)';
      planetEl.style.boxShadow = `
        0 0 20px ${planet.color}66,
        inset 0 0 20px rgba(255,255,255,0.1)
      `;
    });

    return planetEl;
  }

  positionPlanets() {
    const container = document.querySelector('.cosmic-planets-container');
    if (!container) return;

    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    this.planets.forEach((planet, index) => {
      // Позиционируем планеты по кругу с небольшим хаосом
      const angle = (index / this.planets.length) * Math.PI * 2;
      const radius = Math.min(containerWidth, containerHeight) * 0.25;
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      planet.x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100;
      planet.y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100;

      // Ограничиваем позицию границами экрана
      planet.x = Math.max(planet.size/2, Math.min(containerWidth - planet.size/2, planet.x));
      planet.y = Math.max(planet.size/2, Math.min(containerHeight - planet.size/2, planet.y));

      planet.element.style.left = (planet.x - planet.size/2) + 'px';
      planet.element.style.top = (planet.y - planet.size/2) + 'px';
    });
  }

  // НОВОЕ: Анимация планет
  startPlanetAnimation() {
    const animate = () => {
      this.planets.forEach(planet => {
        // Обновляем позицию
        planet.x += planet.vx;
        planet.y += planet.vy;

        // Отражение от границ
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;

        if (planet.x <= planet.size/2 || planet.x >= containerWidth - planet.size/2) {
          planet.vx *= -1;
        }
        if (planet.y <= planet.size/2 || planet.y >= containerHeight - planet.size/2) {
          planet.vy *= -1;
        }

        // Ограничиваем позицию
        planet.x = Math.max(planet.size/2, Math.min(containerWidth - planet.size/2, planet.x));
        planet.y = Math.max(planet.size/2, Math.min(containerHeight - planet.size/2, planet.y));

        // Вращение
        planet.angle += planet.rotationSpeed;

        // Применяем трансформации
        planet.element.style.left = (planet.x - planet.size/2) + 'px';
        planet.element.style.top = (planet.y - planet.size/2) + 'px';
        planet.element.style.transform = `rotate(${planet.angle}rad)`;
      });

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  stopPlanetAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  updateButtonTexts() {
    // Обновляем заголовки планет
    this.planets.forEach(planet => {
      const titleEl = planet.element.querySelector('.planet-title');
      if (titleEl && this.introData[planet.id]) {
        titleEl.textContent = this.introData[planet.id].title;
      }
    });
    
    // Обновляем кнопку "Перейти к DApp"
    const skipBtn = document.getElementById('skip-intro');
    if (skipBtn) {
      const buttonTexts = {
        en: 'Go to DApp',
        ru: 'Перейти к DApp',
        uk: 'Перейти до DApp'
      };
      skipBtn.textContent = buttonTexts[this.currentLang] || buttonTexts.en;
    }
  }
  
  createLanguageSelector() {
    const intro = document.getElementById('cosmic-intro');
    if (!intro) return;
    
    const langSelector = document.createElement('div');
    langSelector.className = 'intro-language-selector';
    langSelector.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      gap: 10px;
    `;
    
    langSelector.innerHTML = `
      <button class="intro-lang-btn ${this.currentLang === 'en' ? 'active' : ''}" data-lang="en" style="
        padding: 8px 12px;
        border: 2px solid #fff;
        background: ${this.currentLang === 'en' ? '#4CAF50' : 'rgba(255,255,255,0.1)'};
        color: white;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      ">EN</button>
      <button class="intro-lang-btn ${this.currentLang === 'ru' ? 'active' : ''}" data-lang="ru" style="
        padding: 8px 12px;
        border: 2px solid #fff;
        background: ${this.currentLang === 'ru' ? '#4CAF50' : 'rgba(255,255,255,0.1)'};
        color: white;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      ">RU</button>
      <button class="intro-lang-btn ${this.currentLang === 'uk' ? 'active' : ''}" data-lang="uk" style="
        padding: 8px 12px;
        border: 2px solid #fff;
        background: ${this.currentLang === 'uk' ? '#4CAF50' : 'rgba(255,255,255,0.1)'};
        color: white;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      ">UK</button>
    `;
    
    intro.appendChild(langSelector);
    
    langSelector.querySelectorAll('.intro-lang-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const newLang = e.target.dataset.lang;
        this.switchLanguage(newLang);
      });

      btn.addEventListener('mouseenter', () => {
        if (!btn.classList.contains('active')) {
          btn.style.background = 'rgba(255,255,255,0.2)';
        }
      });

      btn.addEventListener('mouseleave', () => {
        if (!btn.classList.contains('active')) {
          btn.style.background = 'rgba(255,255,255,0.1)';
        }
      });
    });
  }
  
  switchLanguage(newLang) {
    this.currentLang = newLang;
    localStorage.setItem('selectedLanguage', newLang);
    this.loadTranslations();
    this.updateButtonTexts();
    
    // Обновляем активную кнопку
    document.querySelectorAll('.intro-lang-btn').forEach(btn => {
      const isActive = btn.dataset.lang === newLang;
      btn.classList.toggle('active', isActive);
      btn.style.background = isActive ? '#4CAF50' : 'rgba(255,255,255,0.1)';
    });
    
    this.updateModalIfOpen();
  }
  
  updateModalIfOpen() {
    const modal = document.getElementById('cosmic-modal');
    if (modal && modal.classList.contains('active')) {
      const currentTopic = modal.dataset.currentTopic;
      if (currentTopic) {
        this.showModal(currentTopic);
      }
    }
  }
  
  startAutoHideTimer() {
    this.autoHideTimer = setTimeout(() => {
      this.hideIntro();
    }, 8000);
  }
  
  clearAutoHideTimer() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }
  
  bindEvents() {
    // События для планет
    document.addEventListener('click', (e) => {
      const planet = e.target.closest('.cosmic-planet');
      if (planet) {
        this.clearAutoHideTimer();
        const topic = planet.dataset.topic;
        this.showModal(topic);
      }
    });
    
    document.getElementById('skip-intro')?.addEventListener('click', () => {
      this.clearAutoHideTimer();
      this.hideIntro();
    });
    
    document.querySelector('.modal-close')?.addEventListener('click', () => {
      this.hideModal();
    });
    
    document.getElementById('modal-back')?.addEventListener('click', () => {
      this.hideModal();
    });
    
    document.getElementById('cosmic-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });
    
    document.getElementById('cosmic-intro')?.addEventListener('click', () => {
      this.clearAutoHideTimer();
    });

    // Пересчет позиций при изменении размера окна
    window.addEventListener('resize', () => {
      this.positionPlanets();
    });
  }
  
  showModal(topic) {
    const data = this.introData[topic];
    if (!data) return;
    
    this.clearAutoHideTimer();
    
    const titleElement = document.getElementById('modal-title');
    const textElement = document.getElementById('modal-text');
    const modalElement = document.getElementById('cosmic-modal');
    
    if (titleElement) titleElement.textContent = data.title;
    if (textElement) textElement.textContent = data.text;
    if (modalElement) {
      modalElement.classList.add('active');
      modalElement.dataset.currentTopic = topic;
    }
  }
  
  hideModal() {
    const modalElement = document.getElementById('cosmic-modal');
    if (modalElement) {
      modalElement.classList.remove('active');
      delete modalElement.dataset.currentTopic;
    }
    this.checkWalletConnection(); // Перезапускаем таймер с учетом кошелька
  }
  
  hideIntro() {
    const intro = document.getElementById('cosmic-intro');
    if (intro) {
      // Останавливаем анимацию
      this.stopPlanetAnimation();
      
      intro.classList.add('hidden');
      
      setTimeout(() => {
        intro.style.display = 'none';
        
        const appContainer = document.querySelector('.app-container');
        if (appContainer) {
          appContainer.style.display = 'block';
        }
        
        // Правильный метод навигации
        if (window.globalWayApp && window.globalWayApp.navigateToPage) {
         window.globalWayApp.navigateToPage('dashboard');
        }
        
        // Обновляем язык в основном приложении
        if (window.globalWayApp && window.globalWayApp.switchLanguage) {
          window.globalWayApp.switchLanguage(this.currentLang);
        }
      }, 1000);
    }
  }

  // Метод для принудительного скрытия (для отладки)
  forceHide() {
    this.clearAutoHideTimer();
    this.hideIntro();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cosmic-intro')) {
    window.cosmicIntro = new CosmicIntro();
  }
});
