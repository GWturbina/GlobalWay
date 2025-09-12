(function () {
  const GLUE = {
    // точка входа для каждой страницы
    wireCurrentPage(route, root) {
      switch (route) {
        case "/dashboard": return this._wireDashboard(root);
        case "/partners":  return this._wirePartners(root);
        case "/matrix":    return this._wireMatrix(root);
        case "/tokens":    return;
        case "/projects":  return;
        case "/settings":  return;
        case "/admin":     return this._wireAdmin(root);
      }
    },

    // -------- DASHBOARD --------
    _wireDashboard(root) {
      this._renderQuarterReminder(root);
    },

    // баннер «до квартальной оплаты N дней»
    async _renderQuarterReminder(root) {
      const box  = root.querySelector("#quarterReminder");
      const addr = window.web3Manager.getAddress();
      if (!addr) { if (box) box.innerHTML = ""; return; }

      try {
        const data = await window.contractManager.getUserData(addr);
        const last = Number(data.lastActivity || 0); // unixtime (sec)
        if (!last) { if (box) box.innerHTML = ""; return; }

        const MS = 1000, DAY = 86400000;
        const nextDueMs = last * MS + 90 * DAY;
        const daysLeft  = Math.ceil((nextDueMs - Date.now()) / DAY);

        const html = (daysLeft <= 10)
          ? `<div class="card" style="border:1px solid #e0a800;background:rgba(224,168,0,.08)">
               <b>Внимание:</b> до квартальной оплаты осталось <b>${Math.max(0, daysLeft)}</b> дн.
               <div><small>Нажмите «Оплатить квартал», чтобы избежать остановки начислений.</small></div>
             </div>`
          : "";

        if (box) box.innerHTML = html;
        else if (html) {
          const host = document.getElementById("app");
          const div = document.createElement("div");
          div.innerHTML = html;
          host.prepend(div.firstElementChild);
        }
      } catch (e) {
        console.warn("quarter reminder error", e);
      }
    },

    // -------- PARTNERS --------
    _wirePartners(root) {
      const tabs = root.querySelectorAll(".level-tab");
      tabs.forEach((tab) => {
        tab.addEventListener("click", async () => {
          tabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          const level = Number(tab.getAttribute("data-level")) || 1;
          await this._loadPartners(level, root);
        });
      });

      const first = root.querySelector('.level-tab[data-level="1"]') || tabs[0];
      if (first) first.click();
    },

    async _loadPartners(level, root) {
      const addr = window.web3Manager.getAddress();
      const tbody = root.querySelector("#partnersTableBody");
      if (!tbody) return;

      try {
        const stats = await window.contractManager.getMatrixStats(addr, level);
        const nodes = stats?.positions || stats?.nodes || stats?.slots || [];

        const rows = (nodes || []).map((n, i) => {
          const id  = n.userId || n.id || (n.addr ? n.addr.slice(2, 8) : `#${i + 1}`);
          const a   = n.addr || n.wallet || n.account || "";
          const sId = n.sponsorId || n.parentId || "-";
          const act = n.active ? "yes" : (n.isActive ? "yes" : "no");
          const lvl = n.level || level;
          return `
            <tr>
              <td>${i + 1}</td>
              <td>${id}</td>
              <td>${a ? a.slice(0, 6) + "…" + a.slice(-4) : "-"}</td>
              <td>${sId}</td>
              <td>${act}</td>
              <td>${lvl}</td>
            </tr>`;
        }).join("");

        tbody.innerHTML = rows || `<tr><td colspan="6">No data</td></tr>`;
      } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:#d33">Ошибка загрузки уровня L${level}</td></tr>`;
        console.error(e);
      }
    },

    // -------- MATRIX (заглушка под ваш рендер) --------
    _wireMatrix(_root) {
      // если потребуется JS для визуализации — добавлю здесь
    },

    // -------- ADMIN --------
    _wireAdmin(root) {
      (async () => {
        const isOwner = await window.contractManager.isOwner(
          window.web3Manager.getAddress()
        );
        if (!isOwner) {
          root.innerHTML = '<div class="cosmic-card">Owner only</div>';
          return;
        }

        // Free Activate
        const faBtn = root.querySelector("#activateUserBtn");
        if (faBtn) {
          faBtn.addEventListener("click", async () => {
            const user    = root.querySelector("#fa_user")?.value.trim();
            const sponsor = root.querySelector("#fa_sponsor")?.value.trim();
            const maxL    = Number(root.querySelector("#fa_level")?.value || 3);

            const rx = /^0x[a-fA-F0-9]{40}$/;
            if (!rx.test(user) || !rx.test(sponsor))
              return window.uiManager.showNotification("Введите корректные адреса", "error");

            try {
              window.uiManager.showNotification("Free activate...", "info");
              await window.contractManager.admin_freeActivate({ user, sponsor, maxLevel: maxL });
              window.uiManager.showNotification("Готово", "success");
            } catch (e) {
              window.uiManager.showNotification("Ошибка freeActivate", "error");
              console.error(e);
            }
          });
        }

        // Batch Activate
        const baBtn = root.querySelector("#batchActivateBtn");
        if (baBtn) {
          baBtn.addEventListener("click", async () => {
            const ta = root.querySelector("#ba_list");
            if (!ta) return;

            // формат строк: user,sponsor,maxLevel
            const lines = ta.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            const users = [], sponsors = [], maxLevels = [];
            const rx = /^0x[a-fA-F0-9]{40}$/;

            for (const line of lines) {
              const [u, s, l] = line.split(",").map(x => x.trim());
              if (!rx.test(u) || !rx.test(s) || !Number(l)) {
                return window.uiManager.showNotification("Неверная строка: " + line, "error");
              }
              users.push(u); sponsors.push(s); maxLevels.push(Number(l));
            }

            try {
              window.uiManager.showNotification("Batch activate...", "info");
              await window.contractManager.admin_batchActivate({ users, sponsors, maxLevels });
              window.uiManager.showNotification("Batch готово", "success");
            } catch (e) {
              window.uiManager.showNotification("Ошибка batchActivate", "error");
              console.error(e);
            }
          });
        }

        // Authorization toggle
        const authBtn = root.querySelector("#authSubmit");
        if (authBtn) {
          authBtn.addEventListener("click", async () => {
            const addr = root.querySelector("#authAddress")?.value.trim();
            const en   = root.querySelector("#authToggle")?.checked;

            const rx = /^0x[a-fA-F0-9]{40}$/;
            if (!rx.test(addr))
              return window.uiManager.showNotification("Некорректный адрес", "error");

            try {
              window.uiManager.showNotification("Authorization...", "info");
              await window.contractManager.admin_setAuthorization({ addr, enabled: !!en });
              window.uiManager.showNotification("Готово", "success");
            } catch (e) {
              window.uiManager.showNotification("Ошибка authorization", "error");
              console.error(e);
            }
          });
        }

        // Pause / Unpause
        const pauseBtn = root.querySelector("#pauseBtn");
        if (pauseBtn) pauseBtn.addEventListener("click", async () => {
          try {
            await window.contractManager.admin_pause();
            window.uiManager.showNotification("Paused", "success");
          } catch (e) {
            window.uiManager.showNotification("Ошибка pause", "error");
          }
        });
        const unpauseBtn = root.querySelector("#unpauseBtn");
        if (unpauseBtn) unpauseBtn.addEventListener("click", async () => {
          try {
            await window.contractManager.admin_unpause();
            window.uiManager.showNotification("Unpaused", "success");
          } catch (e) {
            window.uiManager.showNotification("Ошибка unpause", "error");
          }
        });

        // Connect Project
        const cpBtn = root.querySelector("#connectProjectBtn");
        if (cpBtn) {
          cpBtn.addEventListener("click", async () => {
            const projectAddress = root.querySelector("#projAddress")?.value.trim();
            const projectName    = root.querySelector("#projName")?.value.trim();

            const rx = /^0x[a-fA-F0-9]{40}$/;
            if (!rx.test(projectAddress) || !projectName) {
              return window.uiManager.showNotification("Укажите адрес и имя проекта", "error");
            }

            try {
              window.uiManager.showNotification("Connect project...", "info");
              await window.contractManager.admin_connectProject({ projectAddress, projectName });
              window.uiManager.showNotification("Проект подключён", "success");
            } catch (e) {
              window.uiManager.showNotification("Ошибка connectProject", "error");
              console.error(e);
            }
          });
        }
      })();
    },
  };

  // Экспорт
  window.GLUE = GLUE;

  // Простой UI-хелпер для уведомлений (если ещё не подключён)
  window.uiManager = window.uiManager || {
    showNotification(msg, type = "info") {
      console.log(`[${type}]`, msg);
    },
  };
})();
