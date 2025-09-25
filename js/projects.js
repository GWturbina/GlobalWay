// Данные проектов с иконками
const projectsData = [
  {
    id: 'cardgift',
    name: 'CardGift',
    icon: 'assets/icons/CardGift.png',
    description: 'Digital gift card platform for seamless giving and receiving',
    status: 'development',
    prefix: 'CG',
    requirements: 'Level 1+'
  },
  {
    id: 'globaltub',
    name: 'GlobalTub',
    icon: 'assets/icons/GlobalTub.png',
    description: 'Video streaming platform for creators and viewers',
    status: 'development',
    prefix: 'GT',
    requirements: 'Level 3+'
  },
  {
    id: 'globalmarket',
    name: 'GlobalMarket',
    icon: 'assets/icons/GlobalMarket.png',
    description: 'Decentralized marketplace for goods and services',
    status: 'development',
    prefix: 'GM',
    requirements: 'Level 4+'
  },
  {
    id: 'globalgame',
    name: 'GlobalGame',
    icon: 'assets/icons/GlobalGame.png',
    description: 'Gaming ecosystem with play-to-earn mechanics',
    status: 'development',
    prefix: 'GG',
    requirements: 'Level 5+'
  },
  {
    id: 'globaledu',
    name: 'GlobalEdu',
    icon: 'assets/icons/GlobalEdu.png',
    description: 'Educational platform for skill development and certification',
    status: 'development',
    prefix: 'GE',
    requirements: 'Level 6+'
  },
  {
    id: 'globalbank',
    name: 'GlobalBank',
    icon: 'assets/icons/GlobalBank.png',
    description: 'DeFi banking services and financial tools',
    status: 'development',
    prefix: 'GB',
    requirements: 'Level 7+'
  },
  {
    id: 'globalai',
    name: 'GlobalAI',
    icon: 'assets/icons/GlobalAI.png',
    description: 'AI-powered tools and automation solutions',
    status: 'development',
    prefix: 'GA',
    requirements: 'Level 10+'
  },
  {
    id: 'ecovillages',
    name: 'EcoVillages',
    icon: 'assets/icons/EcoVillages.png',
    description: 'Sustainable eco-settlements for future generations',
    status: 'development',
    prefix: 'EV',
    requirements: 'Level 12+'
  }
];

// Функция рендеринга проектов
function renderProjects() {
  const projectsGrid = document.getElementById('projectsGrid');
  if (!projectsGrid) return;

  projectsGrid.innerHTML = '';

  projectsData.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.dataset.projectId = project.id;
    
    projectCard.innerHTML = `
      <img src="${project.icon}" alt="${project.name}" class="project-icon" 
           onerror="this.src='assets/icons/default-project.png'">
      <h3>${project.name}</h3>
      <p>${project.description}</p>
      <div class="project-details">
        <div class="project-prefix">ID: ${project.prefix}-XXXXXXX</div>
        <div class="project-requirements">${project.requirements}</div>
      </div>
      <div class="project-status status-${project.status}">${getStatusText(project.status)}</div>
    `;

    projectCard.addEventListener('click', () => openProjectModal(project));
    projectsGrid.appendChild(projectCard);
  });
}

// Получить текст статуса
function getStatusText(status) {
  const statusTexts = {
    'active': getTranslation('projects.active'),
    'development': getTranslation('projects.development'),
    'coming': getTranslation('projects.coming'),
    'review': getTranslation('projects.review')
  };
  return statusTexts[status] || status;
}

// Открыть модальное окно проекта
function openProjectModal(project) {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const modalTitle = document.getElementById('projectModalTitle');
  const modalLogo = document.getElementById('projectModalLogo');
  const modalDescription = document.getElementById('projectModalDescription');
  const modalRequirements = document.getElementById('projectModalRequirements');
  const modalPrefix = document.getElementById('projectModalPrefix');
  const modalStatus = document.getElementById('projectModalStatus');
  const modalAction = document.getElementById('projectModalAction');

  if (modalTitle) modalTitle.textContent = project.name;
  if (modalLogo) modalLogo.src = project.icon;
  if (modalDescription) modalDescription.textContent = project.description;
  if (modalRequirements) modalRequirements.textContent = project.requirements;
  if (modalPrefix) modalPrefix.textContent = `${project.prefix}-XXXXXXX`;
  if (modalStatus) {
    modalStatus.textContent = getStatusText(project.status);
    modalStatus.className = `project-status status-${project.status}`;
  }

  if (modalAction) {
    modalAction.disabled = project.status !== 'active';
    modalAction.onclick = () => {
      if (project.status === 'active') {
        // Открыть проект
        window.open(`https://${project.id}.globalway.club`, '_blank');
      }
    };
  }

  modal.style.display = 'block';
}

// Инициализация проектов
function initProjects() {
  renderProjects();
  
  // Закрытие модального окна
  const modal = document.getElementById('projectModal');
  if (modal) {
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
      closeBtn.onclick = () => modal.style.display = 'none';
    }
    
    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
  }

  // Обновление статистики проектов
  updateProjectStats();
}

// Обновление статистики проектов
function updateProjectStats() {
  const totalProjects = projectsData.length;
  const activeProjects = projectsData.filter(p => p.status === 'active').length;
  const devProjects = projectsData.filter(p => p.status === 'development').length;
  const comingProjects = projectsData.filter(p => p.status === 'coming').length;

  const totalEl = document.getElementById('totalProjects');
  const activeEl = document.getElementById('activeProjects');
  const devEl = document.getElementById('devProjects');
  const comingEl = document.getElementById('comingProjects');

  if (totalEl) totalEl.textContent = totalProjects;
  if (activeEl) activeEl.textContent = activeProjects;
  if (devEl) devEl.textContent = devProjects;
  if (comingEl) comingEl.textContent = comingProjects;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  initProjects();
});

// Экспортируем функции для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initProjects, renderProjects, projectsData };
}
