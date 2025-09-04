// cosmic-intro-translations.js
const cosmicIntroTranslations = {
  ru: {
    club: {
      title: 'Клуб GlobalWay',
      text: 'GlobalWay — это не площадка. Это живая экосистема, где поколения соединяются: опыт передаётся детям, а энергия и креативность молодёжи возвращают старшим веру в будущее.'
    },
    mission: {
      title: 'Наша Миссия',
      text: 'Мы строим справедливую экономику, где каждый человек может реализовать себя, передать наследие детям и жить достойно — без долгов, без страха, с уважением к своему опыту.'
    },
    goals: {
      title: 'Цели Клуба',
      text: 'Создавать личные источники дохода и давать каждому инструменты саморазвития. Здесь знания и таланты превращаются в ценность для общества и наследие для семьи.'
    },
    roadmap: {
      title: 'Дорожная Карта',
      text: '2025 — запуск платформы и 8 проектов. 2026 — выход с токеном GWC на рынок ценных бумаг. 2027 — лидерство среди мировых сообществ. 2028 — строительство экопоселений для здоровья и будущего поколений.'
    },
    projects: {
      title: 'Наши Проекты',
      text: 'CardGift, GlobalTub, GlobalMarket, GlobalGame, GlobalEdu, GlobalBank — это не просто сервисы, а ступени на пути к самореализации и сильному обществу.'
    }
  },
  
  en: {
    club: {
      title: 'GlobalWay Club',
      text: 'GlobalWay is not just a platform. It\'s a living ecosystem where generations connect: experience is passed to children, and the energy and creativity of youth restore faith in the future for elders.'
    },
    mission: {
      title: 'Our Mission',
      text: 'We build a fair economy where every person can realize themselves, pass on a legacy to their children, and live with dignity — without debt, without fear, with respect for their experience.'
    },
    goals: {
      title: 'Club Goals',
      text: 'Create personal income sources and provide everyone with self-development tools. Here knowledge and talents become value for society and legacy for family.'
    },
    roadmap: {
      title: 'Roadmap',
      text: '2025 — platform launch and 8 projects. 2026 — GWC token enters securities market. 2027 — leadership among global communities. 2028 — building eco-settlements for health and future generations.'
    },
    projects: {
      title: 'Our Projects',
      text: 'CardGift, GlobalTub, GlobalMarket, GlobalGame, GlobalEdu, GlobalBank — these are not just services, but steps on the path to self-realization and a strong society.'
    }
  },
  
  uk: {
    club: {
      title: 'Клуб GlobalWay',
      text: 'GlobalWay — це не майданчик. Це жива екосистема, де покоління з\'єднуються: досвід передається дітям, а енергія та креативність молоді повертають старшим віру в майбутнє.'
    },
    mission: {
      title: 'Наша Місія',
      text: 'Ми будуємо справедливу економіку, де кожна людина може реалізувати себе, передати спадщину дітям і жити гідно — без боргів, без страху, з повагою до свого досвіду.'
    },
    goals: {
      title: 'Цілі Клубу',
      text: 'Створювати особисті джерела доходу та давати кожному інструменти саморозвитку. Тут знання та таланти перетворюються на цінність для суспільства та спадщину для сім\'ї.'
    },
    roadmap: {
      title: 'Дорожня Карта',
      text: '2025 — запуск платформи та 8 проектів. 2026 — вихід з токеном GWC на ринок цінних паперів. 2027 — лідерство серед світових спільнот. 2028 — будівництво екопоселень для здоров\'я майбутніх поколінь.'
    },
    projects: {
      title: 'Наші Проекти',
      text: 'CardGift, GlobalTub, GlobalMarket, GlobalGame, GlobalEdu, GlobalBank — це не просто сервіси, а сходинки на шляху до самореалізації та сильного суспільства.'
    }
  }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = cosmicIntroTranslations;
} else if (typeof window !== 'undefined') {
  window.cosmicIntroTranslations = cosmicIntroTranslations;
}
