(function () {
  const GLUE = {
    wireCurrentPage(route, root) {
      switch (route) {
        case "/dashboard": return this._wireDashboard(root);
        case "/partners":  return this._wirePartners(root);
        case "/matrix":    return this._wireMatrix(root);
        case "/tokens":    return this._wireTokens(root);
        case "/projects":  return this._wireProjects(root);
        case "/settings":  return this._wireSettings(root);
        case "/admin":     return this._wireAdmin(root);
      }
    },

    // ---------- DASHBOARD ----------
    _wireDashboard(root) {
      this._renderQuarterReminder(root);
      // Подтянем цены и состояния кнопок
      hydrateLevelPrices(root);
      // Пакетные кнопки (1-4 / 1-7 / 1-10 / 1-12)
      hydrateBulkPrices(root, [4,7,10,12]);
    },

    // Квартальный напоминатель
    async _renderQuarterReminder(root) {
      const box  = root.querySelector("#quarterReminder");
      const addr = window.web3Manager.getAddress();
      if (!addr) { if (box) box.innerHTML = ""; return; }

      try {
        const data = await window.contractManager.getUserData(addr);
        const last = Number(data.lastActivity || 0);
        if (!last) { if (box) box.innerHTML = ""; return; }

        const MS = 1000, DAY = 86400000;
        const nextDueMs = last * MS + 90 * DAY;
        const daysLeft  = Math.ceil((nextDueMs - Date.now()) / DAY);

        const html = (daysLeft <= 10)
          ? `<div class="cosmic-card">
               <b>Внимание:</b> до квартальной оплаты осталось <b>${Math.max(0, daysLeft)}</b> дн.
               <div><small>Нажмите «Оплатить квартал», чтобы избежать остановки начислений.</small></div>
               <div class="mt-sm"><button class="activate-btn" data-pay-quarter>Оплатить квартал</button></div>
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

    // ---------- PARTNERS ----------
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

    // ---------- MATRIX (заглушка под ваш рендер) ----------
    _wireMatrix(_root) {},

    // ---------- TOKENS/PROJECTS/SETTINGS (пока без JS) ----------
    _wireTokens(_root) {},
    _wireProjects(_root) {},
    _wireSettings(_root) {},

    // ---------- ADMIN ----------
    _wireAdmin(root) {
      (async () => {
        const isOwner = await window.contractManager.isOwner(
          window.web3Manager.getAddress()
        );
        if (!isOwner) {
          root.innerHTML = '<div class="cosmic-card">Owner only</div>';
          return;
        }

        // --- Free Activate
        const faBtn = root.querySelector("#activateUserBtn");
        if (faBtn) {
          faBtn.addEventListener("click", async () => {
            const user    = root.querySelector("#fa_user")?.value.trim();
            const sponsor = root.querySelector("#fa_sponsor")?.value.trim();
            const maxL    = Number(root.querySelector("#fa_level")?.value || 3);
            const rx = /^0x[a-fA-F0-9]{40}$/;

            if (!rx.test(user) || !rx.test(sponsor))
              return uiManager.showNotification("Введите корректные адреса", "error");

            await withBusy(faBtn, async () => {
              uiManager.setLoading(true, "Free activate…");
              try {
                const receipt = await window.contractManager.admin_freeActivate({ user, sponsor, maxLevel: maxL });
                showTxToast("Готово", receipt);
              } catch (e) {
                uiManager.showNotification("Ошибка freeActivate", "error");
                console.error(e);
              } finally {
                uiManager.setLoading(false);
              }
            });
          });
        }

        // --- Batch Activate
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
                return uiManager.showNotification("Неверная строка: " + line, "error");
              }
              users.push(u); sponsors.push(s); maxLevels.push(Number(l));
            }

            await withBusy(baBtn, async () => {
              uiManager.setLoading(true, "Batch activate…");
              try {
                const receipt = await window.contractManager.admin_batchActivate({ users, sponsors, maxLevels });
                showTxToast("Batch готово", receipt);
              } catch (e) {
                uiManager.showNotification("Ошибка batchActivate", "error");
                console.error(e);
              } finally {
                uiManager.setLoading(false);
              }
            });
          });
        }

        // --- Authorization toggle
        const authBtn = root.querySelector("#authSubmit");
        if (authBtn) {
          authBtn.addEventListener("click", async () => {
            const addr = root.querySelector("#authAddress")?.value.trim();
            const en   = root.querySelector("#authToggle")?.checked;
            const rx = /^0x[a-fA-F0-9]{40}$/;

            if (!rx.test(addr))
              return uiManager.showNotification("Некорректный адрес", "error");

            await withBusy(authBtn, async () => {
              uiManager.setLoading(true, "Authorization…");
              try {
                const receipt = await window.contractManager.admin_setAuthorization({ addr, enabled: !!en });
                showTxToast("Готово", receipt);
              } catch (e) {
                uiManager.showNotification("Ошибка authorization", "error");
                console.error(e);
              } finally {
                uiManager.setLoading(false);
              }
            });
          });
        }

        // Pause/Unpause
        const pauseBtn = root.querySelector("#pauseBtn");
        if (pauseBtn) pauseBtn.addEventListener("click", () =>
          withBusy(pauseBtn, async () => {
            try {
              const r = await window.contractManager.admin_pause();
              showTxToast("Paused", r);
            } catch (e) { uiManager.showNotification("Ошибка pause", "error"); }
          })
        );
        const unpauseBtn = root.querySelector("#unpauseBtn");
        if (unpauseBtn) unpauseBtn.addEventListener("click", () =>
          withBusy(unpauseBtn, async () => {
            try {
              const r = await window.contractManager.admin_unpause();
              showTxToast("Unpaused", r);
            } catch (e) { uiManager.showNotification("Ошибка unpause", "error"); }
          })
        );

        // Connect Project
        const cpBtn = root.querySelector("#connectProjectBtn");
        if (cpBtn) {
          cpBtn.addEventListener("click", async () => {
            const projectAddress = root.querySelector("#projAddress")?.value.trim();
            const projectName    = root.querySelector("#projName")?.value.trim();
            const rx = /^0x[a-fA-F0-9]{40}$/;
            if (!rx.test(projectAddress) || !projectName)
              return uiManager.showNotification("Укажите адрес и имя проекта", "error");

            await withBusy(cpBtn, async () => {
              uiManager.setLoading(true, "Connect project…");
              try {
                const r = await window.contractManager.admin_connectProject({ projectAddress, projectName });
                showTxToast("Проект подключён", r);
              } catch (e) {
                uiManager.showNotification("Ошибка connectProject", "error");
                console.error(e);
              } finally { uiManager.setLoading(false); }
            });
          });
        }
      })();
    },
  };

  // ====== Общие делегирования: покупка уровней/пакетов, квартал ======
  document.addEventListener('click', async (e) => {
    // Одиночный уровень
    const buyBtn = e.target.closest('[data-buy-level]');
    if (buyBtn) {
      e.preventDefault();
      const level = Number(buyBtn.getAttribute('data-buy-level'));
      if (!level) return uiManager.showNotification('Не указан уровень', 'error');

      await withBusy(buyBtn, async () => {
        uiManager.setLoading(true, `Покупка уровня L${level}…`);
        try {
          const receipt = await contractManager.buyLevel(level);
          showTxToast(`Уровень L${level} куплен`, receipt);
          // актуализируем цены/состояние
          const host = document.getElementById("app");
          await hydrateLevelPrices(host);
          await hydrateBulkPrices(host, [4,7,10,12]);
        } catch (err) {
          console.error(err);
          uiManager.showNotification('Ошибка покупки уровня', 'error');
        } finally {
          uiManager.setLoading(false);
        }
      });
      return;
    }

    // Пакеты: 1-4 / 1-7 / 1-10 / 1-12
    const bulkBtn = e.target.closest('[data-buy-bulk]');
    if (bulkBtn) {
      e.preventDefault();
      const targetMax = Number(bulkBtn.getAttribute('data-buy-bulk'));
      if (!targetMax) return uiManager.showNotification('Не указан target level', 'error');

      await withBusy(bulkBtn, async () => {
        uiManager.setLoading(true, `Покупка пакета до L${targetMax}…`);
        try {
          const r = await contractManager.buyLevelsSmart(targetMax);
          showTxToast(`Куплены недостающие уровни до L${targetMax}`, r);
          const host = document.getElementById("app");
          await hydrateLevelPrices(host);
          await hydrateBulkPrices(host, [4,7,10,12]);
        } catch (err) {
          console.error(err);
          uiManager.showNotification('Ошибка покупки пакета уровней', 'error');
        } finally {
          uiManager.setLoading(false);
        }
      });
      return;
    }

    // Квартальный платёж
    const qBtn = e.target.closest('[data-pay-quarter]');
    if (qBtn) {
      e.preventDefault();
      await withBusy(qBtn, async () => {
        uiManager.setLoading(true, 'Оплата квартала…');
        try {
          const r = await contractManager.payQuarterly();
          showTxToast('Квартальный платёж выполнен', r);
        } catch (err) {
          console.error(err);
          uiManager.showNotification('Ошибка квартального платежа', 'error');
        } finally { uiManager.setLoading(false); }
      });
    }
  });

  // ====== Вспомогательные утилиты для UI ======
  function bnb(wei) {
    try { return (Number(wei) / 1e18).toFixed(5); }
    catch { return '?'; }
  }

  function setBtnBusy(el, on) {
    if (!el) return;
    el.dataset.busy = on ? "1" : "";
    try { el.disabled = !!on; } catch {}
    if (on) el.classList.add('disabled');
    else el.classList.remove('disabled');
  }

  async function withBusy(el, fn) {
    if (el && el.dataset.busy === "1") return; // защита от дабл-клика
    try {
      setBtnBusy(el, true);
      await fn();
    } finally {
      setBtnBusy(el, false);
    }
  }

  function showTxToast(title, receiptOrObj) {
    // пытаемся вытащить hash
    const tx = receiptOrObj?.transactionHash || receiptOrObj?.tx || receiptOrObj?.transactionHash?.toString?.() || "";
    if (tx) {
      const url = window.contractManager.getExplorerTxUrl(tx);
      uiManager.showNotification(`${title}. <a class="link" href="${url}" target="_blank" rel="noopener">Tx</a>`, "success", 6000);
    } else {
      uiManager.showNotification(title, "success", 3000);
    }
  }

  // ====== Гидрация цен ======
  async function hydrateLevelPrices(root) {
    const addr = window.web3Manager.getAddress();
    const current = addr ? await window.contractManager.getActiveMaxLevel(addr) : 0;

    // Отрисуем цены на одиночных кнопках
    const btns = root.querySelectorAll('[data-buy-level]');
    for (const b of btns) {
      const lvl = Number(b.getAttribute('data-buy-level')) || 0;
      if (!lvl) continue;

      // активные/купленные — задизейблим
      if (lvl <= current) {
        setBtnBusy(b, true);
        b.title = "Уровень уже куплен";
        continue;
      }

      // цена
      try {
        const wei = await contractManager.getLevelPrice(lvl);
        b.setAttribute('data-price-wei', String(wei));
        const priceEl = b.querySelector('.level-price');
        if (priceEl) priceEl.textContent = `${bnb(wei)} BNB`;
        else b.title = `${bnb(wei)} BNB`;
      } catch {}
    }
  }

  async function hydrateBulkPrices(root, targets = [4,7,10,12]) {
    const addr = window.web3Manager.getAddress();
    const current = addr ? await window.contractManager.getActiveMaxLevel(addr) : 0;

    for (const t of targets) {
      const bb = root.querySelector(`[data-buy-bulk="${t}"]`);
      if (!bb) continue;

      if (t <= current) {
        setBtnBusy(bb, true);
        bb.title = "Уже куплено";
        const sub = bb.querySelector('.buy-price');
        if (sub) sub.textContent = `0.00000 BNB`;
        continue;
      }

      // сумма только недостающих уровней (current+1 .. t)
      try {
        const wei = await contractManager.computeRangePrice(current + 1, t);
        bb.setAttribute('data-price-wei', String(wei));
        const sub = bb.querySelector('.buy-price');
        if (sub) sub.textContent = `${bnb(wei)} BNB`;
        else bb.title = `${bnb(wei)} BNB`;
      } catch (e) {
        console.warn('bulk price hydrate failed', e);
      }
    }
  }

  // ====== Экспорт ======
  window.GLUE = GLUE;

  // Базовый uiManager если не подключен
  window.uiManager = window.uiManager || {
    showNotification(msg, type = "info") { console.log(`[${type}]`, msg); },
    setLoading(on, text) { if (on) console.log("loading…", text); }
  };
})();
