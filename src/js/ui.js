(function () {
  /**
   * UI Manager
   * - Тосты/уведомления
   * - Модалки (open/close, confirm)
   * - Глобальный лоадер
   * - Копирование в буфер
   */
  class UIManager {
    constructor() {
      this._notifHost = null;
      this._loaderEl = null;
    }

    init() {
      // Узел для тостов
      this._notifHost = document.querySelector(".notifications-container");
      if (!this._notifHost) {
        this._notifHost = document.createElement("div");
        this._notifHost.className = "notifications-container";
        document.body.appendChild(this._notifHost);
      }

      // Глобальный лоадер
      this._loaderEl = document.getElementById("gw-global-loader");
      if (!this._loaderEl) {
        this._loaderEl = document.createElement("div");
        this._loaderEl.id = "gw-global-loader";
        this._loaderEl.style.cssText =
          "display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);z-index:2000;align-items:center;justify-content:center;";
        this._loaderEl.innerHTML =
          '<div class="cosmic-card" style="text-align:center;min-width:220px;"><div class="loading-text" id="gw-loader-text">Loading…</div></div>';
        document.body.appendChild(this._loaderEl);
      }

      // Делегирование кликов по тостам (закрытие по клику)
      this._notifHost.addEventListener("click", (e) => {
        const note = e.target.closest(".notification");
        if (note) this._closeNote(note);
      });
    }

    // ---------------- TOASTS ----------------

    /**
     * Показать уведомление
     * @param {string} message
     * @param {"success"|"error"|"warning"|"info"} [type="info"]
     * @param {number} [ms=2600]
     */
    showNotification(message, type = "info", ms = 2600) {
      if (!this._notifHost) this.init();

      const note = document.createElement("div");
      note.className = `notification ${type} notification-slide-in`;
      note.setAttribute("role", "status");
      note.setAttribute("aria-live", "polite");
      note.style.cursor = "pointer";
      note.innerHTML = this._escapeHtml(String(message));

      this._notifHost.appendChild(note);

      // авто-закрытие
      const timer = setTimeout(() => this._closeNote(note), ms);
      note._timer = timer;

      return note;
    }

    _closeNote(note) {
      if (!note || !note.parentNode) return;
      try {
        if (note._timer) clearTimeout(note._timer);
        note.classList.remove("notification-slide-in");
        note.classList.add("notification-slide-out");
        setTimeout(() => note.parentNode && note.parentNode.removeChild(note), 280);
      } catch {
        note.remove();
      }
    }

    // ---------------- MODALS ----------------

    /**
     * Открыть модал по id элемента .modal
     * @param {string} modalId
     */
    openModal(modalId) {
      const m = document.getElementById(modalId);
      if (!m) return;
      m.classList.add("active");
      m.style.display = "flex";
    }

    /**
     * Закрыть модал по id элемента .modal
     * @param {string} modalId
     */
    closeModal(modalId) {
      const m = document.getElementById(modalId);
      if (!m) return;
      m.classList.remove("active");
      // плавное скрытие совпадает с вашими стилями
      setTimeout(() => (m.style.display = "none"), 200);
    }

    /**
     * Диалог подтверждения (временная простая реализация на базе модалки)
     * Ожидает наличие в DOM разметки:
     * <div id="confirmModal" class="modal">
     *   <div class="modal-content">
     *     <div class="modal-header"><h3 id="confirmTitle">...</h3></div>
     *     <div class="modal-body" id="confirmBody">...</div>
     *     <div class="modal-footer">
     *       <button id="confirmOk"   class="confirm-btn">ОК</button>
     *       <button id="confirmCancel" class="cancel-btn">Отмена</button>
     *     </div>
     *   </div>
     * </div>
     *
     * Если такого блока нет — покажет нативный confirm().
     */
    confirm({ title = "Подтверждение", message = "", onConfirm = () => {} }) {
      const modal = document.getElementById("confirmModal");
      if (!modal) {
        if (window.confirm(`${title}\n\n${message}`)) onConfirm();
        return;
      }
      const t = modal.querySelector("#confirmTitle");
      const b = modal.querySelector("#confirmBody");
      const ok = modal.querySelector("#confirmOk");
      const cc = modal.querySelector("#confirmCancel");

      if (t) t.textContent = title;
      if (b) b.textContent = message;

      const cleanup = () => {
        ok && ok.removeEventListener("click", onOk);
        cc && cc.removeEventListener("click", onCancel);
        this.closeModal("confirmModal");
      };
      const onOk = () => {
        try { onConfirm(); } finally { cleanup(); }
      };
      const onCancel = () => cleanup();

      ok && ok.addEventListener("click", onOk, { once: true });
      cc && cc.addEventListener("click", onCancel, { once: true });

      this.openModal("confirmModal");
    }

    // ---------------- LOADER ----------------

    /**
     * Показать/скрыть глобальный лоадер
     * @param {boolean} on
     * @param {string} [text]
     */
    setLoading(on, text = "") {
      if (!this._loaderEl) this.init();
      const t = this._loaderEl.querySelector("#gw-loader-text");
      if (t && text) t.textContent = text;
      this._loaderEl.style.display = on ? "flex" : "none";
    }

    // ---------------- MISC ----------------

    /**
     * Скопировать текст в буфер обмена и показать тост
     * @param {string} text
     * @param {string} [okMsg="Скопировано"]
     */
    async copy(text, okMsg = "Скопировано") {
      try {
        await navigator.clipboard.writeText(String(text));
        this.showNotification(okMsg, "success");
      } catch (e) {
        this.showNotification("Не удалось скопировать", "error");
      }
    }

    _escapeHtml(s) {
      return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }
  }

  // Экспорт singleton
  window.uiManager = new UIManager();

  // Автоинициализация
  document.addEventListener("DOMContentLoaded", () => {
    window.uiManager.init();

    // Автосвязывание кнопок закрытия модалок вида [data-modal-close="id"]
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-modal-close]");
      if (!btn) return;
      const id = btn.getAttribute("data-modal-close");
      if (id) window.uiManager.closeModal(id);
    });

    // Автосвязывание кнопок открытия модалок вида [data-modal-open="id"]
    document.body.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-modal-open]");
      if (!btn) return;
      const id = btn.getAttribute("data-modal-open");
      if (id) window.uiManager.openModal(id);
    });
  });
})();
