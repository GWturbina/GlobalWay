/**
 * ID Generator для GlobalWay
 * Генерирует уникальные 7-значные ID для пользователей
 * Интегрируется с другими проектами экосистемы
 */

class IDGenerator {
  constructor() {
    this.usedIds = new Set();
    this.projectPrefixes = new Map();
    this.initialized = false;
    this.maxAttempts = 100;
    this.idLength = 7;
    this.storageKey = 'globalway_used_ids';
    this.projectStorageKey = 'globalway_project_prefixes';
  }

  /**
   * Инициализация генератора ID
   */
  async initialize() {
    try {
      await this.loadUsedIds();
      this.setupProjectPrefixes();
      this.initialized = true;
      console.log('🆔 ID Generator initialized');
      console.log(`📊 Loaded ${this.usedIds.size} existing IDs`);
    } catch (error) {
      console.error('❌ Failed to initialize ID Generator:', error);
    }
  }

  /**
   * Настройка префиксов проектов согласно ТЗ
   */
  setupProjectPrefixes() {
    // Проекты экосистемы из ТЗ
    this.projectPrefixes.set('globalway', ''); // Без префикса - основной проект
    this.projectPrefixes.set('cardgift', 'CG');
    this.projectPrefixes.set('globaltub', 'GT');
    this.projectPrefixes.set('globalmarket', 'GM');
    this.projectPrefixes.set('globalgame', 'GG');
    this.projectPrefixes.set('globaledu', 'GE');
    this.projectPrefixes.set('globalbank', 'GB');
    this.projectPrefixes.set('globalai', 'GA');

    // Сохранение в localStorage
    localStorage.setItem(
      this.projectStorageKey, 
      JSON.stringify(Array.from(this.projectPrefixes.entries()))
    );
  }

  /**
   * Загрузка использованных ID из localStorage и контракта
   */
  async loadUsedIds() {
    try {
      // Загрузка из localStorage
      const localIds = this.loadLocalUsedIds();
      
      // Загрузка из смарт-контракта
      const contractIds = await this.loadContractUsedIds();
      
      // Объединение и удаление дубликатов
      this.usedIds = new Set([...localIds, ...contractIds]);
      
      console.log(`📥 Loaded ${localIds.length} local IDs and ${contractIds.length} contract IDs`);
    } catch (error) {
      console.error('Error loading used IDs:', error);
      // Fallback к локальному хранилищу
      this.usedIds = new Set(this.loadLocalUsedIds());
    }
  }

  /**
   * Загрузка ID из localStorage
   */
  loadLocalUsedIds() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading local IDs:', error);
      return [];
    }
  }

  /**
   * Загрузка ID из смарт-контракта
   */
  async loadContractUsedIds() {
    try {
      if (window.contractManager && window.contractManager.isReady()) {
        // Получение всех зарегистрированных пользователей
        const users = await window.contractManager.getAllUsers();
        return users.map(user => user.id).filter(id => id && id.length === this.idLength);
      }
      return [];
    } catch (error) {
      console.error('Error loading contract IDs:', error);
      return [];
    }
  }

  /**
   * Генерация базового 7-значного ID
   */
  generateBaseId() {
    const min = Math.pow(10, this.idLength - 1); // 1000000
    const max = Math.pow(10, this.idLength) - 1; // 9999999
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Проверка уникальности ID
   */
  async isIdUnique(id) {
    // Проверка в локальном кеше
    if (this.usedIds.has(id.toString())) {
      return false;
    }

    // Проверка в смарт-контракте
    try {
      if (window.contractManager && window.contractManager.isReady()) {
        const exists = await window.contractManager.userExists(id);
        return !exists;
      }
      return true;
    } catch (error) {
      console.error('Error checking ID uniqueness in contract:', error);
      return true; // Fallback к локальной проверке
    }
  }

  /**
   * Генерация уникального ID для GlobalWay (без префикса)
   */
  async generateUniqueId() {
    if (!this.initialized) {
      await this.initialize();
    }

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const id = this.generateBaseId().toString();
      
      if (await this.isIdUnique(id)) {
        // Сохранение в кеш
        this.usedIds.add(id);
        this.saveUsedIds();
        
        console.log(`✅ Generated unique ID: ${id} (attempt ${attempt + 1})`);
        return id;
      }
    }

    throw new Error(`Failed to generate unique ID after ${this.maxAttempts} attempts`);
  }

  /**
   * Генерация ID с префиксом для других проектов
   */
  async generateProjectId(projectName) {
    const prefix = this.projectPrefixes.get(projectName.toLowerCase());
    
    if (prefix === undefined) {
      throw new Error(`Unknown project: ${projectName}`);
    }

    // Для GlobalWay (без префикса)
    if (prefix === '') {
      return await this.generateUniqueId();
    }

    // Для других проектов с префиксом
    const baseId = await this.generateUniqueId();
    return `${prefix}${baseId}`;
  }

  /**
   * Валидация ID
   */
  validateId(id) {
    const validation = {
      isValid: false,
      project: null,
      baseId: null,
      errors: []
    };

    if (!id || typeof id !== 'string') {
      validation.errors.push('ID must be a non-empty string');
      return validation;
    }

    // Проверка на GlobalWay ID (только цифры)
    if (/^\d{7}$/.test(id)) {
      validation.isValid = true;
      validation.project = 'globalway';
      validation.baseId = id;
      return validation;
    }

    // Проверка на проектные ID с префиксами
    for (const [projectName, prefix] of this.projectPrefixes.entries()) {
      if (prefix && id.startsWith(prefix) && id.length === prefix.length + 7) {
        const baseId = id.substring(prefix.length);
        if (/^\d{7}$/.test(baseId)) {
          validation.isValid = true;
          validation.project = projectName;
          validation.baseId = baseId;
          return validation;
        }
      }
    }

    validation.errors.push('Invalid ID format');
    return validation;
  }

  /**
   * Резервирование ID
   */
  async reserveId(id) {
    const validation = this.validateId(id);
    
    if (!validation.isValid) {
      throw new Error(`Invalid ID: ${validation.errors.join(', ')}`);
    }

    if (this.usedIds.has(validation.baseId)) {
      throw new Error(`ID ${id} is already reserved`);
    }

    // Проверка в контракте
    if (!(await this.isIdUnique(validation.baseId))) {
      throw new Error(`ID ${id} is already used in contract`);
    }

    // Резервирование
    this.usedIds.add(validation.baseId);
    this.saveUsedIds();
    
    console.log(`🔒 Reserved ID: ${id} for project: ${validation.project}`);
    return true;
  }

  /**
   * Освобождение зарезервированного ID
   */
  releaseId(id) {
    const validation = this.validateId(id);
    
    if (!validation.isValid) {
      throw new Error(`Invalid ID: ${validation.errors.join(', ')}`);
    }

    if (this.usedIds.has(validation.baseId)) {
      this.usedIds.delete(validation.baseId);
      this.saveUsedIds();
      console.log(`🔓 Released ID: ${id}`);
      return true;
    }

    return false;
  }

  /**
   * Получение информации об ID
   */
  getIdInfo(id) {
    const validation = this.validateId(id);
    
    if (!validation.isValid) {
      return { error: validation.errors.join(', ') };
    }

    return {
      id: id,
      project: validation.project,
      baseId: validation.baseId,
      prefix: this.projectPrefixes.get(validation.project),
      isReserved: this.usedIds.has(validation.baseId),
      isGlobalWay: validation.project === 'globalway'
    };
  }

  /**
   * Добавление нового проекта
   */
  addProject(projectName, prefix) {
    if (this.projectPrefixes.has(projectName.toLowerCase())) {
      throw new Error(`Project ${projectName} already exists`);
    }

    // Проверка уникальности префикса
    for (const [, existingPrefix] of this.projectPrefixes.entries()) {
      if (existingPrefix === prefix) {
        throw new Error(`Prefix ${prefix} is already used`);
      }
    }

    // Валидация префикса
    if (prefix && !/^[A-Z]{2}$/.test(prefix)) {
      throw new Error('Prefix must be 2 uppercase letters');
    }

    this.projectPrefixes.set(projectName.toLowerCase(), prefix || '');
    
    // Сохранение
    localStorage.setItem(
      this.projectStorageKey,
      JSON.stringify(Array.from(this.projectPrefixes.entries()))
    );

    console.log(`➕ Added project: ${projectName} with prefix: ${prefix || 'none'}`);
    return true;
  }

  /**
   * Получение статистики
   */
  getStatistics() {
    const stats = {
      totalUsedIds: this.usedIds.size,
      availableIds: Math.pow(10, this.idLength) - Math.pow(10, this.idLength - 1) - this.usedIds.size,
      projects: Array.from(this.projectPrefixes.entries()).map(([name, prefix]) => ({
        name,
        prefix: prefix || 'none',
        exampleId: prefix ? `${prefix}1234567` : '1234567'
      })),
      utilizationPercentage: (this.usedIds.size / (Math.pow(10, this.idLength) - Math.pow(10, this.idLength - 1)) * 100).toFixed(2)
    };

    return stats;
  }

  /**
   * Массовая генерация ID
   */
  async generateBatchIds(count, projectName = 'globalway') {
    if (count <= 0 || count > 1000) {
      throw new Error('Count must be between 1 and 1000');
    }

    const generatedIds = [];
    const errors = [];

    for (let i = 0; i < count; i++) {
      try {
        const id = await this.generateProjectId(projectName);
        generatedIds.push(id);
      } catch (error) {
        errors.push(`Failed to generate ID ${i + 1}: ${error.message}`);
      }
    }

    return {
      success: generatedIds,
      errors: errors,
      successCount: generatedIds.length,
      errorCount: errors.length
    };
  }

  /**
   * Поиск ID по базовому номеру
   */
  findIdsByBase(baseId) {
    const results = [];
    
    for (const [projectName, prefix] of this.projectPrefixes.entries()) {
      if (prefix === '') {
        // GlobalWay ID
        if (this.usedIds.has(baseId)) {
          results.push({
            project: projectName,
            fullId: baseId,
            prefix: 'none'
          });
        }
      } else {
        // Проектные ID
        const fullId = `${prefix}${baseId}`;
        results.push({
          project: projectName,
          fullId: fullId,
          prefix: prefix,
          potential: true
        });
      }
    }

    return results;
  }

  /**
   * Создание реферальной ссылки
   */
  createReferralLink(id, baseUrl = 'https://www.globalway.club') {
    const validation = this.validateId(id);
    
    if (!validation.isValid) {
      throw new Error(`Invalid ID: ${validation.errors.join(', ')}`);
    }

    return `${baseUrl}/ref/${validation.baseId}`;
  }

  /**
   * Парсинг реферальной ссылки
   */
  parseReferralLink(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      if (pathParts[1] === 'ref' && pathParts[2]) {
        const id = pathParts[2];
        return this.getIdInfo(id);
      }
      
      return { error: 'Invalid referral link format' };
    } catch (error) {
      return { error: 'Invalid URL' };
    }
  }

  /**
   * Сохранение использованных ID
   */
  saveUsedIds() {
    try {
      const idsArray = Array.from(this.usedIds);
      localStorage.setItem(this.storageKey, JSON.stringify(idsArray));
    } catch (error) {
      console.error('Error saving used IDs:', error);
    }
  }

  /**
   * Экспорт данных
   */
  exportData() {
    return {
      usedIds: Array.from(this.usedIds),
      projects: Array.from(this.projectPrefixes.entries()),
      statistics: this.getStatistics(),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Импорт данных
   */
  importData(data) {
    try {
      if (data.usedIds && Array.isArray(data.usedIds)) {
        this.usedIds = new Set(data.usedIds);
      }
      
      if (data.projects && Array.isArray(data.projects)) {
        this.projectPrefixes = new Map(data.projects);
      }

      // Сохранение
      this.saveUsedIds();
      localStorage.setItem(
        this.projectStorageKey,
        JSON.stringify(Array.from(this.projectPrefixes.entries()))
      );

      console.log('📥 Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Очистка всех данных (осторожно!)
   */
  clearAllData() {
    if (confirm('Are you sure you want to clear all ID data? This action cannot be undone.')) {
      this.usedIds.clear();
      localStorage.removeItem(this.storageKey);
      console.log('🗑️ All ID data cleared');
      return true;
    }
    return false;
  }

  /**
   * Проверка готовности
   */
  isReady() {
    return this.initialized;
  }

  /**
   * Получение версии
   */
  getVersion() {
    return '1.0.0';
  }

  /**
   * Очистка ресурсов
   */
  destroy() {
    this.saveUsedIds();
    this.usedIds.clear();
    this.projectPrefixes.clear();
    this.initialized = false;
    console.log('🗑️ ID Generator destroyed');
  }
}

// Создание глобального экземпляра
const idGenerator = new IDGenerator();

// Автоматическая инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    idGenerator.initialize();
  });
} else {
  idGenerator.initialize();
}

// Глобальная доступность
window.idGenerator = idGenerator;

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
  module.exports = idGenerator;
}
