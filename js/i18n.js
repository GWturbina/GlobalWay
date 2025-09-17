/* ========================================
   GlobalWay - Internationalization (i18n)
   ======================================== */

window.i18n = {
    // Текущий язык
    currentLang: 'en',
    
    // Доступные языки
    availableLanguages: {
        en: 'English',
        ru: 'Русский',
        uk: 'Українська'
    },
    
    // Переводы загружаются из JSON файлов
    translations: {},
    
    // Инициализация
    async init() {
        try {
            // Получаем сохраненный язык или язык браузера
            const savedLang = StorageManager.getUserSettings().language;
            const browserLang = navigator.language.split('-')[0];
            
            this.currentLang = savedLang || 
                (this.availableLanguages[browserLang] ? browserLang : 'en');
            
            // Загружаем переводы для всех языков
            await this.loadAllTranslations();
            
            // Применяем текущий язык
            this.applyLanguage(this.currentLang);
            
            return true;
        } catch (error) {
            console.error('i18n initialization error:', error);
            return false;
        }
    },
    
    // Загрузка всех переводов
    async loadAllTranslations() {
        const langs = Object.keys(this.availableLanguages);
        
        try {
            const translations = await Promise.all(
                langs.map(lang => 
                    fetch(`translations/${lang}.json`)
                        .then(r => r.json())
                        .catch(() => null)
                )
            );
            
            langs.forEach((lang, index) => {
                if (translations[index]) {
                    this.translations[lang] = translations[index];
                }
            });
            
            // Если переводы не загрузились, используем встроенные
            if (Object.keys(this.translations).length === 0) {
                this.loadDefaultTranslations();
            }
        } catch (error) {
            console.error('Loading translations error:', error);
            this.loadDefaultTranslations();
        }
    },
    
    // Встроенные переводы (на случай если файлы не загрузятся)
    loadDefaultTranslations() {
        this.translations = {
            en: {
                enterDapp: "Enter Dapp",
                nav: {
                    dashboard: "Dashboard",
                    partners: "Partners",
                    matrix: "Matrix",
                    tokens: "Tokens",
                    projects: "Projects",
                    admin: "Admin"
                },
                dashboard: {
                    connectWallet: "Connect Wallet",
                    walletAddress: "Wallet Address",
                    balance: "Balance",
                    userId: "User ID",
                    rank: "Rank",
                    referralLink: "Referral Link",
                    totalEarned: "Total Earned",
                    copyLink: "Copy Link",
                    levelManagement: "Level Management",
                    quarterlyActivity: "Quarterly Activity",
                    payQuarterly: "Pay Quarterly",
                    daysLeft: "days left",
                    incomeByRanks: "Income by Ranks",
                    transactionHistory: "Transaction History",
                    level: "Level",
                    amount: "Amount",
                    date: "Date",
                    tokens: "Tokens",
                    tokenBalance: "Token Balance",
                    price: "Price",
                    exchange: "Exchange"
                },
                levels: {
                    beginner: "Beginner",
                    explorer: "Explorer",
                    innovator: "Innovator",
                    techEnthusiast: "Tech Enthusiast",
                    cryptoStudent: "Crypto Student",
                    blockchainAdept: "Blockchain Adept",
                    smartContractMaster: "Smart Contract Master",
                    web3Professional: "Web3 Professional",
                    metaArchitect: "Meta Architect",
                    aiVisionary: "AI Visionary",
                    quantumLeader: "Quantum Leader",
                    globalTechTitan: "Global Tech Titan"
                },
                planets: {
                    club: {
                        title: "GlobalWay Club",
                        text: "GlobalWay is not just a platform. It's a living ecosystem where generations connect: experience is passed to children, and the energy and creativity of youth restore faith in the future for elders."
                    },
                    mission: {
                        title: "Our Mission",
                        text: "We build a fair economy where every person can realize themselves, pass on a legacy to their children, and live with dignity — without debt, without fear, with respect for their experience."
                    },
                    goals: {
                        title: "Club Goals",
                        text: "Create personal income sources and provide everyone with self-development tools. Here knowledge and talents become value for society and legacy for family."
                    },
                    roadmap: {
                        title: "Roadmap",
                        text: "2025 — platform launch and 8 projects. 2026 — GWC token enters securities market. 2027 — leadership among global communities. 2028 — building eco-settlements for health and future generations."
                    },
                    projects: {
                        title: "Our Projects",
                        text: "CardGift, GlobalTub, GlobalMarket, GlobalGame, GlobalEdu, GlobalBank — these are not just services, but steps on the path to self-realization and a strong society."
                    }
                },
                buttons: {
                    activate: "Activate",
                    buy: "Buy",
                    sell: "Sell",
                    confirm: "Confirm",
                    cancel: "Cancel",
                    save: "Save",
                    close: "Close",
                    details: "Details",
                    back: "Back"
                },
                messages: {
                    copied: "Copied to clipboard",
                    success: "Success",
                    error: "Error",
                    loading: "Loading...",
                    noWallet: "Please install wallet",
                    wrongNetwork: "Please switch to opBNB network",
                    insufficientFunds: "Insufficient funds"
                }
            },
            ru: {
                enterDapp: "Войти в Dapp",
                nav: {
                    dashboard: "Панель",
                    partners: "Партнёры",
                    matrix: "Матрица",
                    tokens: "Токены",
                    projects: "Проекты",
                    admin: "Админ"
                },
                dashboard: {
                    connectWallet: "Подключить кошелёк",
                    walletAddress: "Адрес кошелька",
                    balance: "Баланс",
                    userId: "ID пользователя",
                    rank: "Ранг",
                    referralLink: "Реферальная ссылка",
                    totalEarned: "Всего заработано",
                    copyLink: "Копировать ссылку",
                    levelManagement: "Управление уровнями",
                    quarterlyActivity: "Квартальная активность",
                    payQuarterly: "Оплатить квартальную",
                    daysLeft: "дней осталось",
                    incomeByRanks: "Доходы по рангам",
                    transactionHistory: "История транзакций",
                    level: "Уровень",
                    amount: "Количество",
                    date: "Дата",
                    tokens: "Токены",
                    tokenBalance: "Баланс токенов",
                    price: "Цена",
                    exchange: "Обменять"
                },
                levels: {
                    beginner: "Новичок",
                    explorer: "Исследователь",
                    innovator: "Инноватор",
                    techEnthusiast: "Техно-энтузиаст",
                    cryptoStudent: "Крипто-ученик",
                    blockchainAdept: "Блокчейн-адепт",
                    smartContractMaster: "Мастер смарт-контрактов",
                    web3Professional: "Web3 Профессионал",
                    metaArchitect: "Мета-архитектор",
                    aiVisionary: "AI-визионер",
                    quantumLeader: "Квантовый лидер",
                    globalTechTitan: "Глобальный тех-титан"
                },
                planets: {
                    club: {
                        title: "Клуб GlobalWay",
                        text: "GlobalWay — это не площадка. Это живая экосистема, где поколения соединяются: опыт передаётся детям, а энергия и креативность молодёжи возвращают старшим веру в будущее."
                    },
                    mission: {
                        title: "Наша Миссия",
                        text: "Мы строим справедливую экономику, где каждый человек может реализовать себя, передать наследие детям и жить достойно — без долгов, без страха, с уважением к своему опыту."
                    },
                    goals: {
                        title: "Цели Клуба",
                        text: "Создавать личные источники дохода и давать каждому инструменты саморазвития. Здесь знания и таланты превращаются в ценность для общества и наследие для семьи."
                    },
                    roadmap: {
                        title: "Дорожная Карта",
                        text: "2025 — запуск платформы и 8 проектов. 2026 — выход с токеном GWC на рынок ценных бумаг. 2027 — лидерство среди мировых сообществ. 2028 — строительство экопоселений для здоровья и будущего поколений."
                    },
                    projects: {
                        title: "Наши Проекты",
                        text: "CardGift, GlobalTub, GlobalMarket, GlobalGame, GlobalEdu, GlobalBank — это не просто сервисы, а ступени на пути к самореализации и сильному обществу."
                    }
                },
                buttons: {
                    activate: "Активировать",
                    buy: "Купить",
                    sell: "Продать",
                    confirm: "Подтвердить",
                    cancel: "Отмена",
                    save: "Сохранить",
                    close: "Закрыть",
                    details: "Подробнее",
                    back: "Назад"
                },
                messages: {
                    copied: "Скопировано в буфер обмена",
                    success: "Успешно",
                    error: "Ошибка",
                    loading: "Загрузка...",
                    noWallet: "Пожалуйста, установите кошелёк",
                    wrongNetwork: "Пожалуйста, переключитесь на сеть opBNB",
                    insufficientFunds: "Недостаточно средств"
                }
            },
            uk: {
                enterDapp: "Увійти в Dapp",
                nav: {
                    dashboard: "Панель",
                    partners: "Партнери",
                    matrix: "Матриця",
                    tokens: "Токени",
                    projects: "Проекти",
                    admin: "Адмін"
                },
                dashboard: {
                    connectWallet: "Підключити гаманець",
                    walletAddress: "Адреса гаманця",
                    balance: "Баланс",
                    userId: "ID користувача",
                    rank: "Ранг",
                    referralLink: "Реферальне посилання",
                    totalEarned: "Всього зароблено",
                    copyLink: "Копіювати посилання",
                    levelManagement: "Управління рівнями",
                    quarterlyActivity: "Квартальна активність",
                    payQuarterly: "Оплатити квартальну",
                    daysLeft: "днів залишилось",
                    incomeByRanks: "Доходи за рангами",
                    transactionHistory: "Історія транзакцій",
                    level: "Рівень",
                    amount: "Кількість",
                    date: "Дата",
                    tokens: "Токени",
                    tokenBalance: "Баланс токенів",
                    price: "Ціна",
                    exchange: "Обміняти"
                },
                levels: {
                    beginner: "Новачок",
                    explorer: "Дослідник",
                    innovator: "Інноватор",
                    techEnthusiast: "Техно-ентузіаст",
                    cryptoStudent: "Крипто-учень",
                    blockchainAdept: "Блокчейн-адепт",
                    smartContractMaster: "Майстер смарт-контрактів",
                    web3Professional: "Web3 Професіонал",
                    metaArchitect: "Мета-архітектор",
                    aiVisionary: "AI-візіонер",
                    quantumLeader: "Квантовий лідер",
                    globalTechTitan: "Глобальний тех-титан"
                },
                planets: {
                    club: {
                        title: "Клуб GlobalWay",
                        text: "GlobalWay — це не майданчик. Це жива екосистема, де покоління з'єднуються: досвід передається дітям, а енергія та креативність молоді повертають старшим віру в майбутнє."
                    },
                    mission: {
                        title: "Наша Місія",
                        text: "Ми будуємо справедливу економіку, де кожна людина може реалізувати себе, передати спадщину дітям і жити гідно — без боргів, без страху, з повагою до свого досвіду."
                    },
                    goals: {
                        title: "Цілі Клубу",
                        text: "Створювати особисті джерела доходу та давати кожному інструменти саморозвитку. Тут знання та таланти перетворюються на цінність для суспільства та спадщину для сім'ї."
                    },
                    roadmap: {
                        title: "Дорожня Карта",
                        text: "2025 — запуск платформи та 8 проектів. 2026 — вихід з токеном GWC на ринок цінних паперів. 2027 — лідерство серед світових спільнот. 2028 — будівництво екопоселень для здоров'я майбутніх поколінь."
                    },
                    projects: {
                        title: "Наші Проекти",
                        text: "CardGift, GlobalTub, GlobalMarket, GlobalGame, GlobalEdu, GlobalBank — це не просто сервіси, а сходинки на шляху до самореалізації та сильного суспільства."
                    }
                },
                buttons: {
                    activate: "Активувати",
                    buy: "Купити",
                    sell: "Продати",
                    confirm: "Підтвердити",
                    cancel: "Скасувати",
                    save: "Зберегти",
                    close: "Закрити",
                    details: "Детальніше",
                    back: "Назад"
                },
                messages: {
                    copied: "Скопійовано в буфер обміну",
                    success: "Успішно",
                    error: "Помилка",
                    loading: "Завантаження...",
                    noWallet: "Будь ласка, встановіть гаманець",
                    wrongNetwork: "Будь ласка, перемкніться на мережу opBNB",
                    insufficientFunds: "Недостатньо коштів"
                }
            }
        };
    },
    
    // Получение перевода
    t(key, params = {}) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                // Если ключ не найден, возвращаем ключ
                return key;
            }
        }
        
        // Замена параметров
        if (typeof value === 'string') {
            Object.keys(params).forEach(param => {
                value = value.replace(`{${param}}`, params[param]);
            });
        }
        
        return value || key;
    },
    
    // Смена языка
    setLanguage(lang) {
        if (!this.availableLanguages[lang]) return;
        
        this.currentLang = lang;
        
        // Сохраняем выбор
        const settings = StorageManager.getUserSettings();
        settings.language = lang;
        StorageManager.saveUserSettings(settings);
        
        // Применяем язык
        this.applyLanguage(lang);
        
        // Вызываем событие смены языка
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    },
    
    // Применение языка к DOM элементам
    applyLanguage(lang) {
        // Обновляем все элементы с data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Обновляем атрибуты HTML
        document.documentElement.lang = lang;
        
        // Обновляем выбранный язык в селекторе
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            langSelect.value = lang;
        }
    },
    
    // Форматирование чисел в соответствии с локалью
    formatNumber(number, decimals = 2) {
        const locale = this.currentLang === 'en' ? 'en-US' : 
                      this.currentLang === 'ru' ? 'ru-RU' : 'uk-UA';
        
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    },
    
    // Форматирование даты
    formatDate(date, options = {}) {
        const locale = this.currentLang === 'en' ? 'en-US' : 
                      this.currentLang === 'ru' ? 'ru-RU' : 'uk-UA';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(date);
    },
    
    // Форматирование валюты
    formatCurrency(amount, currency = 'BNB') {
        return `${this.formatNumber(amount, 4)} ${currency}`;
    }
};
