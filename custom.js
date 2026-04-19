/* %AppData%/VRCX/custom.js */
/* 使用脚本后果自负！ */
/* 合并脚本：Auto Social Status + Avatar Auto Switch + ExtensionJSManager */

(() => {
    'use strict';

    // ==================== 全局命名空间管理 ====================
    const GLOBAL_KEYS = {
        feedSearch: '__VRCX_FEED_SEARCH_CUSTOM__'
    };

    // 清理旧实例
    Object.values(GLOBAL_KEYS).forEach(key => {
        if (window[key] && typeof window[key].destroy === 'function') {
            window[key].destroy();
        }
    });

    // ==================== ExtensionJSManager ====================
    const ExtensionJSManager = (() => {
        const state = {
            initialized: false,
            observer: null,
            checkInterval: null,
            isCollapsed: false,
            userInteracted: false,
            isProcessing: false
        };

        function createExtensionCategory() {
            if (document.querySelector('[data-category="extension-js"]')) {
                return null;
            }

            const category = document.createElement('div');
            category.className = 'tool-category';
            category.setAttribute('data-category', 'extension-js');

            category.innerHTML = `
                <div data-v-823ccd7a class="category-header text-2xl">
                    <svg data-v-823ccd7a xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide rotation-transition lucide-chevron-down-icon lucide-chevron-down">
                        <path d="m6 9 6 6 6-6"></path>
                    </svg>
                    <span data-v-823ccd7a class="category-title">扩展JS</span>
                </div>
                <div data-v-823ccd7a class="tools-grid"></div>
                <br>
            `;

            const header = category.querySelector('.category-header');
            const grid = category.querySelector('.tools-grid');

            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                state.userInteracted = true;
                state.isCollapsed = grid.style.display !== 'none';

                if (state.isCollapsed) {
                    grid.style.display = 'none';
                    header.classList.add('collapsed');
                    header.querySelector('svg').style.transform = 'rotate(-90deg)';
                } else {
                    grid.style.display = '';
                    header.classList.remove('collapsed');
                    header.querySelector('svg').style.transform = 'rotate(0deg)';
                }
            });

            return category;
        }

        function moveCardsToCategory(targetCategory) {
            const grid = targetCategory.querySelector('.tools-grid');
            if (!grid) return 0;

            // 收集所有扩展工具卡片（id 以 -tool 结尾）
            const allCards = Array.from(document.querySelectorAll('[id$="-tool"]'));
            let movedCount = 0;

            allCards.forEach(card => {
                // 如果卡片已经在正确的位置，跳过
                if (card.parentElement === grid) {
                    return;
                }

                // 移动卡片
                try {
                    if (card.parentElement) {
                        card.remove();
                    }
                    grid.appendChild(card);
                    movedCount++;
                    console.log('[ExtensionJS] Moved card:', card.id);
                } catch (e) {
                    console.warn('[ExtensionJS] Failed to move card:', card.id, e);
                }
            });

            return movedCount;
        }

        function insertAtTop(newCategory) {
            const container = document.querySelector('.tool-categories');
            if (!container) return false;

            const firstCategory = container.querySelector('.tool-category');
            if (firstCategory) {
                container.insertBefore(newCategory, firstCategory);
            } else {
                container.appendChild(newCategory);
            }

            return true;
        }

        function applyCollapsedState(category) {
            if (!state.userInteracted) return;

            const grid = category.querySelector('.tools-grid');
            const header = category.querySelector('.category-header');
            const svg = header?.querySelector('svg');

            if (!grid || !header) return;

            if (state.isCollapsed) {
                grid.style.display = 'none';
                header.classList.add('collapsed');
                if (svg) svg.style.transform = 'rotate(-90deg)';
            } else {
                grid.style.display = '';
                header.classList.remove('collapsed');
                if (svg) svg.style.transform = 'rotate(0deg)';
            }
        }

        function ensureExtensionCategory() {
            if (state.isProcessing) return;
            state.isProcessing = true;

            try {
                const onTools = String(location.hash || '').includes('/tools');
                if (!onTools) return;

                const container = document.querySelector('.tool-categories');
                if (!container) return;

                let category = document.querySelector('[data-category="extension-js"]');
                let isNewCategory = false;

                if (!category) {
                    category = createExtensionCategory();
                    if (!category) return;

                    if (!insertAtTop(category)) {
                        console.warn('[ExtensionJS] Failed to insert category');
                        return;
                    }
                    isNewCategory = true;
                    console.log('[ExtensionJS] Created new category');
                }

                moveCardsToCategory(category);

                if (!isNewCategory) {
                    applyCollapsedState(category);
                }
            } finally {
                state.isProcessing = false;
            }
        }

        function startWatching() {
            ensureExtensionCategory();

            state.checkInterval = setInterval(() => {
                ensureExtensionCategory();
            }, 1000);

            state.observer = new MutationObserver((mutations) => {
                const extensionCat = document.querySelector('[data-category="extension-js"]');
                const cards = document.querySelectorAll('[id$="-tool"]');

                const needsFix = !extensionCat || Array.from(cards).some(card =>
                    card.closest('[data-category="extension-js"]') === null
                );

                if (needsFix) {
                    ensureExtensionCategory();
                }
            });

            state.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        function destroy() {
            if (state.checkInterval) {
                clearInterval(state.checkInterval);
                state.checkInterval = null;
            }
            if (state.observer) {
                state.observer.disconnect();
                state.observer = null;
            }

            const extensionCat = document.querySelector('[data-category="extension-js"]');
            if (extensionCat) {
                extensionCat.remove();
            }

            state.userInteracted = false;
            state.isCollapsed = false;
            state.isProcessing = false;
        }

        function init() {
            if (state.initialized) return;
            state.initialized = true;

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', startWatching);
            } else {
                startWatching();
            }

            console.log('[ExtensionJS] Manager initialized');
        }

        return { init, destroy, ensure: ensureExtensionCategory };
    })();

    // ==================== Feed 公式搜索 ====================
    const FeedSearchModule = (() => {
        const STORAGE_KEY = 'vrcx_custom_feed_search';

        const state = {
            initialized: false,
            originalSearchFeedDatabase: null,
            ui: {},
            cardCreated: false
        };

        function getSettings() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return getDefaultSettings();
                return JSON.parse(raw);
            } catch (err) {
                return getDefaultSettings();
            }
        }

        function getDefaultSettings() {
            return {
                enabled: true,
                debug: true,
                language: 'en'
            };
        }

        function setSettings(settings) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }

        function debugLog(...args) {
            console.log('[FeedSearch]', ...args);
        }

        function tokenize(input) {
            const tokens = [];
            let i = 0;
            const str = input.trim();

            while (i < str.length) {
                if (/\s/.test(str[i])) {
                    i++;
                    continue;
                }

                if (str[i] === '&') {
                    tokens.push({ type: 'AND' });
                    i++;
                    continue;
                }

                if (str[i] === '|') {
                    tokens.push({ type: 'OR' });
                    i++;
                    continue;
                }

                // 检查字段后的 != 操作符
                if (i > 0 && str[i] === '!' && str[i + 1] === '=') {
                    // 向前查找最近的 VALUE token
                    let j = i - 1;
                    while (j >= 0 && str[j] === ' ') j--;
                    if (j >= 0 && /[a-zA-Z_]/.test(str[j])) {
                        // 这里是字段名后的 !=，暂时跳过，让后面的逻辑处理
                    } else {
                        // 独立的 != 操作符（暂时保留，虽然不常用）
                        tokens.push({ type: 'NOT' });
                        i += 2;
                        continue;
                    }
                }

                if (str[i] === '(') {
                    tokens.push({ type: 'LPAREN' });
                    i++;
                    continue;
                }

                if (str[i] === ')') {
                    tokens.push({ type: 'RPAREN' });
                    i++;
                    continue;
                }

                if (str[i] === '=') {
                    tokens.push({ type: 'COLON' });
                    i++;
                    continue;
                }

                if (str[i] === '"' || str[i] === "'") {
                    const quote = str[i];
                    i++;
                    let value = '';
                    while (i < str.length && str[i] !== quote) {
                        if (str[i] === '\\' && i + 1 < str.length) {
                            value += str[i + 1];
                            i += 2;
                        } else {
                            value += str[i];
                            i++;
                        }
                    }
                    i++;
                    tokens.push({ type: 'VALUE', value });
                    continue;
                }

                let value = '';
                while (i < str.length && !/[\s()=|&!]/.test(str[i])) {
                    value += str[i];
                    i++;
                }
                if (value) {
                    tokens.push({ type: 'VALUE', value });
                }

                // 检查字段后的 != 操作符
                if (i + 1 < str.length && str[i] === '!' && str[i + 1] === '=') {
                    tokens.push({ type: 'NOT' });
                    tokens.push({ type: 'COLON' });
                    i += 2;
                }
            }

            return tokens;
        }

        function parseExpression(tokens) {
            let pos = 0;

            function parseOr() {
                let left = parseAnd();
                while (pos < tokens.length && tokens[pos]?.type === 'OR') {
                    pos++;
                    left = { type: 'OR', left, right: parseAnd() };
                }
                return left;
            }

            function parseAnd() {
                let left = parsePrimary();
                while (pos < tokens.length && tokens[pos]?.type === 'AND') {
                    pos++;
                    left = { type: 'AND', left, right: parsePrimary() };
                }
                while (pos < tokens.length && tokens[pos] && !['OR', 'AND', 'RPAREN'].includes(tokens[pos].type)) {
                    left = { type: 'AND', left, right: parsePrimary() };
                }
                return left;
            }

            function parsePrimary() {
                const tok = tokens[pos];

                if (!tok) return null;

                if (tok.type === 'NOT') {
                    pos++;
                    return { type: 'NOT', expr: parsePrimary() };
                }

                if (tok.type === 'LPAREN') {
                    pos++;
                    const expr = parseOr();
                    if (tokens[pos]?.type === 'RPAREN') {
                        pos++;
                    }
                    return expr;
                }

                if (tok.type === 'VALUE') {
                    pos++;
                    if (tokens[pos]?.type === 'NOT' && tokens[pos + 1]?.type === 'COLON') {
                        // 处理 field!=value 语法
                        pos += 2; // 跳过 NOT 和 COLON
                        const fieldValue = tokens[pos];
                        if (fieldValue?.type === 'VALUE') {
                            pos++;
                            return { type: 'NOT', expr: { type: 'FIELD', field: tok.value.toLowerCase(), value: fieldValue.value } };
                        }
                        return { type: 'NOT', expr: { type: 'FIELD', field: tok.value.toLowerCase(), value: '' } };
                    } else if (tokens[pos]?.type === 'COLON') {
                        // 处理 field=value 语法
                        pos++;
                        const fieldValue = tokens[pos];
                        if (fieldValue?.type === 'VALUE') {
                            pos++;
                            return { type: 'FIELD', field: tok.value.toLowerCase(), value: fieldValue.value };
                        }
                        return { type: 'FIELD', field: tok.value.toLowerCase(), value: '' };
                    }
                    return { type: 'TEXT', value: tok.value };
                }

                pos++;
                return null;
            }

            const result = parseOr();
            return result || { type: 'MATCH_ALL' };
        }

        function extractKeywords(expr) {
            const keywords = new Set();

            function extractFromExpr(e) {
                if (!e) return;

                if (e.type === 'FIELD') {
                    // Skip fields that original search doesn't search
                    const skipFields = ['type', 'time', 'location', 'wrld', 'usr'];
                    if (!skipFields.includes(e.field) && e.value && e.value.trim()) {
                        keywords.add(e.value.trim());
                    }
                } else if (e.type === 'TEXT') {
                    if (e.value && e.value.trim()) {
                        keywords.add(e.value.trim());
                    }
                } else if (e.type === 'AND' || e.type === 'OR') {
                    extractFromExpr(e.left);
                    extractFromExpr(e.right);
                } else if (e.type === 'NOT') {
                    extractFromExpr(e.expr);
                }
            }

            extractFromExpr(expr);
            return Array.from(keywords);
        }

        function evaluateCondition(expr, row) {
            if (!expr || expr.type === 'MATCH_ALL') {
                return true;
            }

            if (expr.type === 'TEXT') {
                const v = expr.value.toUpperCase();
                const name = String(row.displayName || '').toUpperCase();
                const world = String(row.worldName || '').toUpperCase();
                const location = String(row.location || '').toUpperCase();
                const status = String(row.status || '').toUpperCase();
                const statusDesc = String(row.statusDescription || '').toUpperCase();
                const avatar = String(row.avatarName || '').toUpperCase();
                const bio = String(row.bio || '').toUpperCase();
                const prevBio = String(row.previousBio || '').toUpperCase();

                return name.includes(v) || world.includes(v) || location.includes(v) ||
                       status.includes(v) || statusDesc.includes(v) || avatar.includes(v) ||
                       bio.includes(v) || prevBio.includes(v);
            }

            if (expr.type === 'FIELD') {
                const { field, value } = expr;
                const v = value.toUpperCase();

                switch (field) {
                    case 'type':
                        return String(row.type || '').toUpperCase() === v;
                    case 'name':
                        return String(row.displayName || '').toUpperCase().includes(v);
                    case 'world':
                        return String(row.worldName || '').toUpperCase().includes(v);
                    case 'location':
                    case 'wrld':
                        return String(row.location || '').toUpperCase().includes(v);
                    case 'usr':
                        return String(row.userId || '').toUpperCase().includes(v);
                    case 'status':
                        return (String(row.status || '').toUpperCase().includes(v) ||
                                String(row.statusDescription || '').toUpperCase().includes(v));
                    case 'avatar':
                        return String(row.avatarName || '').toUpperCase().includes(v);
                    case 'bio':
                        return (String(row.bio || '').toUpperCase().includes(v) ||
                                String(row.previousBio || '').toUpperCase().includes(v));
                    case 'group':
                        return String(row.groupName || '').toUpperCase().includes(v);
                    case 'time':
                        return String(row.created_at || '').toUpperCase().startsWith(v.toUpperCase());
                    default:
                        return false;
                }
            }

            if (expr.type === 'AND') {
                return evaluateCondition(expr.left, row) && evaluateCondition(expr.right, row);
            }

            if (expr.type === 'OR') {
                return evaluateCondition(expr.left, row) || evaluateCondition(expr.right, row);
            }

            if (expr.type === 'NOT') {
                return !evaluateCondition(expr.expr, row);
            }

            return true;
        }

        function wrapDatabaseSearch() {
            console.log('[FeedSearch] wrapDatabaseSearch called');

            const database = window.database;
            if (!database) {
                console.warn('[FeedSearch] database not found');
                return;
            }

            console.log('[FeedSearch] database methods:', Object.keys(database));

            if (state.originalSearchFeedDatabase) {
                console.log('[FeedSearch] Already wrapped');
                return;
            }

            state.originalSearchFeedDatabase = database.searchFeedDatabase?.bind(database);

            if (!state.originalSearchFeedDatabase) {
                console.warn('[FeedSearch] searchFeedDatabase not found');
                return;
            }

            database.searchFeedDatabase = async function(search, filters, vipList, maxEntries, dateFrom, dateTo) {
                console.log('[FeedSearch] searchFeedDatabase called with search:', search);
                const settings = getSettings();

                const hasFormula = /[A-Za-z_]+=.+/.test(search) ||
                                   /[&|]/.test(search) ||
                                   /!=/.test(search) ||
                                   /[()]/.test(search);

                console.log('[FeedSearch] hasFormula:', hasFormula, 'enabled:', settings.enabled);

                if (!settings.enabled || !hasFormula || !search.trim()) {
                    console.log('[FeedSearch] Calling original searchFeedDatabase');
                    return state.originalSearchFeedDatabase(search, filters, vipList, maxEntries, dateFrom, dateTo);
                }

                try {
                    console.log('[FeedSearch] Processing formula search:', search);
                    const tokens = tokenize(search);
                    console.log('[FeedSearch] tokens:', tokens);
                    const ast = parseExpression(tokens);
                    console.log('[FeedSearch] ast:', JSON.stringify(ast));

                    // Extract keywords from formula for targeted searches
                    console.log('[FeedSearch] Extracting keywords from formula');
                    const keywords = extractKeywords(ast);
                    console.log('[FeedSearch] Extracted keywords:', keywords);

                    // Search for each keyword separately and merge results
                    const allResults = new Map(); // Use Map to avoid duplicates

                    if (keywords.length > 0) {
                        console.log('[FeedSearch] Searching for each keyword');
                        for (const keyword of keywords) {
                            console.log('[FeedSearch] Searching for keyword:', keyword);
                            const keywordResults = await state.originalSearchFeedDatabase(keyword, filters, vipList, maxEntries, dateFrom, dateTo);
                            console.log('[FeedSearch] Got', keywordResults.length, 'results for keyword:', keyword);

                            // Add to map using rowId as key to avoid duplicates
                            for (const row of keywordResults) {
                                if (row.rowId || row.id) {
                                    allResults.set(row.rowId || row.id, row);
                                } else {
                                    // Fallback: use combination of fields as key
                                    const key = `${row.displayName}_${row.worldName || ''}_${row.type}_${row.created_at || row.time || ''}_${row.avatarName || ''}`;
                                    allResults.set(key, row);
                                }
                            }
                        }
                    } else {
                        console.log('[FeedSearch] No keywords found, searching with empty string');
                        const emptyResults = await state.originalSearchFeedDatabase('', filters, vipList, maxEntries, dateFrom, dateTo);
                        console.log('[FeedSearch] Got', emptyResults.length, 'results from empty search');
                        for (const row of emptyResults) {
                            if (row.rowId || row.id) {
                                allResults.set(row.rowId || row.id, row);
                            } else {
                                const key = `${row.displayName}_${row.worldName || ''}_${row.type}_${row.created_at || row.time || ''}_${row.avatarName || ''}`;
                                allResults.set(key, row);
                            }
                        }
                    }

                    const results = Array.from(allResults.values());
                    console.log('[FeedSearch] Merged results:', results.length);

                    // Sort by created_at desc (newest first), same as VRCX
                    results.sort((a, b) => {
                        const timeA = a.created_at ? Date.parse(a.created_at) : 0;
                        const timeB = b.created_at ? Date.parse(b.created_at) : 0;
                        return timeB - timeA;
                    });
                    console.log('[FeedSearch] Sorted results');

                    // Log first few results to see what data we have
                    if (results.length > 0) {
                        console.log('[FeedSearch] First 3 results:', results.slice(0, 3));
                    }

                    // Filter with our formula
                    console.log('[FeedSearch] Applying formula filter');
                    const filtered = results.filter(row => {
                        return evaluateCondition(ast, row);
                    });

                    console.log('[FeedSearch] After formula filter:', filtered.length, 'results');
                    return filtered;
                } catch (err) {
                    console.error('[FeedSearch] Error:', err);
                    console.error('[FeedSearch] Stack:', err.stack);
                    return state.originalSearchFeedDatabase(search, filters, vipList, maxEntries, dateFrom, dateTo);
                }
            };

            console.log('[FeedSearch] database.searchFeedDatabase wrapped successfully');
        }

        function unwrapDatabaseSearch() {
            if (state.originalSearchFeedDatabase && window.database) {
                window.database.searchFeedDatabase = state.originalSearchFeedDatabase;
                state.originalSearchFeedDatabase = null;
                debugLog('[FeedSearch] Database search unwrapped');
            }
        }

        function ensureStyle() {
            if (document.getElementById('feed-search-style')) return;
            const style = document.createElement('style');
            style.id = 'feed-search-style';
            style.textContent = `
                #feed-search-tool { cursor: pointer; }
                #feed-search-modal-root { position: fixed; inset: 0; z-index: 9999; display: none; }
                #feed-search-modal-root.open { display: block; }
                #feed-search-modal-root .fs-overlay { position: absolute; inset: 0; background: color-mix(in srgb, var(--foreground, #000) 25%, transparent); }
                #feed-search-modal-root .fs-dialog { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(700px, calc(100vw - 24px)); max-height: calc(100vh - 24px); overflow: auto; background: var(--card, #fff); color: var(--foreground, #111); border: 1px solid var(--border, #ddd); border-radius: 12px; box-shadow: 0 10px 32px color-mix(in srgb, var(--foreground, #000) 18%, transparent); padding: 16px; font-family: monospace; }
                #feed-search-modal-root .fs-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; font-family: system-ui, sans-serif; }
                #feed-search-modal-root .fs-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 8px 0; }
                #feed-search-modal-root .fs-section { border: 1px solid var(--border, #ddd); border-radius: 8px; padding: 12px; margin: 8px 0; background: color-mix(in srgb, var(--card, #fff) 92%, var(--muted, #eee)); }
                #feed-search-modal-root .fs-subtitle { font-weight: 600; margin-bottom: 8px; font-family: system-ui, sans-serif; }
                #feed-search-modal-root input, #feed-search-modal-root select, #feed-search-modal-root button { background: var(--background, #fff); color: var(--foreground, #111); border: 1px solid var(--border, #ddd); border-radius: 6px; padding: 6px 8px; font-size: 13px; cursor: pointer; }
                #feed-search-modal-root button:hover { background: color-mix(in srgb, var(--accent, #f2f2f2) 90%, transparent); }
                #feed-search-modal-root .fs-disabled { opacity: .6; pointer-events: none; }
                #feed-search-modal-root .fs-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
                #feed-search-modal-root .fs-help { background: var(--muted, #f5f5f5); padding: 12px; border-radius: 6px; white-space: pre-wrap; font-size: 12px; line-height: 1.5; max-height: 300px; overflow-y: auto; }
                #feed-search-modal-root .fs-toggle { display: flex; align-items: center; gap: 8px; }
                #feed-search-modal-root .fs-toggle input[type="checkbox"] { width: 16px; height: 16px; }
            `;
            document.head.appendChild(style);
        }

        function createSwitch(checked, onChange) {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = Boolean(checked);
            input.addEventListener('change', () => onChange(input.checked));
            return input;
        }

        function getFeedStore() {
            const pinia = window.$pinia;
            if (!pinia) return null;
            if (pinia._s && typeof pinia._s.get === 'function') {
                const store = pinia._s.get('feed');
                if (store) return store;
            }
            if (pinia.feed) return pinia.feed;
            return null;
        }

        function openDialog() {
            if (!state.ui.modalRoot) return;
            renderDialogBody(state.ui.dialogBody);
            state.ui.modalRoot.classList.add('open');
        }

        function closeDialog() {
            if (!state.ui.modalRoot) return;
            state.ui.modalRoot.classList.remove('open');
        }

        function ensureDialog() {
            if (document.getElementById('feed-search-modal-root')) {
                state.ui.modalRoot = document.getElementById('feed-search-modal-root');
                state.ui.dialogBody = document.getElementById('feed-search-dialog-body');
                return;
            }

            const root = document.createElement('div');
            root.id = 'feed-search-modal-root';

            const overlay = document.createElement('div');
            overlay.className = 'fs-overlay';
            overlay.addEventListener('click', closeDialog);

            const dialog = document.createElement('div');
            dialog.className = 'fs-dialog';

            const title = document.createElement('div');
            title.className = 'fs-title';
            title.textContent = settings.language === 'zh' ? '好友动态公式搜索' : 'Feed Formula Search';

            const body = document.createElement('div');
            body.id = 'feed-search-dialog-body';

            const footer = document.createElement('div');
            footer.className = 'fs-footer';

            const closeBtn = document.createElement('button');
            closeBtn.textContent = settings.language === 'zh' ? '关闭' : 'Close';
            closeBtn.addEventListener('click', closeDialog);

            footer.appendChild(closeBtn);
            dialog.append(title, body, footer);
            root.append(overlay, dialog);
            document.body.appendChild(root);

            state.ui.modalRoot = root;
            state.ui.dialogBody = body;
        }

        function renderDialogBody(root) {
            if (!root) return;
            root.innerHTML = '';

            const settings = getSettings();

            const top = document.createElement('div');
            top.className = 'fs-row';

            const enabledSwitch = createSwitch(settings.enabled, (value) => {
                const newSettings = getSettings();
                newSettings.enabled = value;
                setSettings(newSettings);
                renderDialogBody(root);
            });

            const enabledLabel = document.createElement('span');
            enabledLabel.textContent = settings.language === 'zh' ? '启用公式搜索' : 'Enable Formula Search';

            const debugSwitch = createSwitch(settings.debug, (value) => {
                const newSettings = getSettings();
                newSettings.debug = value;
                setSettings(newSettings);
            });
            const debugLabel = document.createElement('span');
            debugLabel.textContent = settings.language === 'zh' ? '调试日志' : 'Debug Log';

            // Language switch
            const languageSelect = document.createElement('select');
            languageSelect.style.marginLeft = '12px';
            const langOptions = [
                { value: 'en', label: 'English' },
                { value: 'zh', label: '中文' }
            ];
            langOptions.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                if (settings.language === option.value) {
                    opt.selected = true;
                }
                languageSelect.appendChild(opt);
            });
            languageSelect.addEventListener('change', () => {
                const newSettings = getSettings();
                newSettings.language = languageSelect.value;
                setSettings(newSettings);
                renderDialogBody(root);
            });

            top.append(enabledSwitch, enabledLabel, debugSwitch, debugLabel, languageSelect);
            root.appendChild(top);

            const bodyWrapper = document.createElement('div');
            if (!settings.enabled) bodyWrapper.className = 'fs-disabled';

            const helpSection = document.createElement('div');
            helpSection.className = 'fs-section';

            const helpTitle = document.createElement('div');
            helpTitle.className = 'fs-subtitle';
            helpTitle.textContent = settings.language === 'zh' ? '语法帮助' : 'Syntax Help';

            const helpContent = document.createElement('div');
            helpContent.className = 'fs-help';
            if (settings.language === 'zh') {
                helpContent.textContent = `公式搜索语法 (使用 = 而不是 :):
name=xxx          - 搜索用户名包含 xxx
world=xxx         - 搜索世界名包含 xxx
wrld=wrld_xxx     - 搜索特定世界实例
usr=usr_xxx       - 搜索特定用户
status=xxx        - 搜索状态包含 xxx
avatar=xxx        - 搜索 Avatar 名包含 xxx
bio=xxx           - 搜索 Bio 包含 xxx
type=GPS          - 搜索 GPS 类型
type=Online       - 搜索 Online 类型
type=Offline      - 搜索 Offline 类型
type=Status       - 搜索 Status 类型
type=Avatar       - 搜索 Avatar 类型
type=Bio          - 搜索 Bio 类型
&                 - 逻辑与 (AND)
|                 - 逻辑或 (OR)
!=                - 逻辑非 (NOT)
()                - 分组`;
            } else {
                helpContent.textContent = `Formula Search Syntax (use = instead of :):
name=xxx          - Search username containing xxx
world=xxx         - Search world name containing xxx
wrld=wrld_xxx     - Search specific world instance
usr=usr_xxx       - Search specific user
status=xxx        - Search status containing xxx
avatar=xxx        - Search avatar name containing xxx
bio=xxx           - Search bio containing xxx
type=GPS          - Search GPS type
type=Online       - Search Online type
type=Offline      - Search Offline type
type=Status       - Search Status type
type=Avatar       - Search Avatar type
type=Bio          - Search Bio type
&                 - Logical AND
|                 - Logical OR
!=                - Logical NOT
()                - Grouping`;
            }

            helpSection.append(helpTitle, helpContent);
            bodyWrapper.appendChild(helpSection);

            const examplesSection = document.createElement('div');
            examplesSection.className = 'fs-section';

            const examplesTitle = document.createElement('div');
            examplesTitle.className = 'fs-subtitle';
            examplesTitle.textContent = settings.language === 'zh' ? '使用示例' : 'Examples';

            const examplesContent = document.createElement('div');
            examplesContent.className = 'fs-help';
            if (settings.language === 'zh') {
                examplesContent.textContent = `示例:
name=xxx & type=GPS        				- 搜索 xxx的 GPS 动态
name=xxx | name=yyy     		   		- 搜索 xxx或yyy的动态(合并结果)
type=GPS & world=咖啡厅        		  	- 搜索地图在咖啡厅的 GPS 动态
type!=Offline            			 	- 排除离线动态
(name=xxx | name=yyy) & type=GPS 		- 组合条件
usr=usr_xxx & type=Avatar        		- 搜索特定用户的头像变动`;
            } else {
                examplesContent.textContent = `Examples:
name=xxx & type=GPS        	            - Search xxx's GPS events
name=xxx | name=yyy     		   	    - Search xxx or yyy's events
type=GPS & world=Coffee Shop            - Search GPS events in Coffee Shop
type!=Offline            			    - Exclude offline events
(name=xxx | name=yyy) & type=GPS 	    - Combined condition
usr=usr_xxx & type=Avatar        	    - Search specific user's avatar changes`;
            }

            examplesSection.append(examplesTitle, examplesContent);
            bodyWrapper.appendChild(examplesSection);

            root.appendChild(bodyWrapper);
        }

        function createToolCard() {
            const card = document.createElement('div');
            card.id = 'feed-search-tool';
            card.setAttribute('data-v-823ccd7a', '');
            card.className = 'bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm tool-card p-0 gap-0';
            card.innerHTML = `
                <div data-v-823ccd7a class="tool-content">
                    <div data-v-823ccd7a class="tool-icon text-2xl">🔍</div>
                    <div data-v-823ccd7a class="tool-info">
                        <div data-v-823ccd7a class="tool-name">好友动态公式搜索</div>
                        <div data-v-823ccd7a class="tool-description">使用公式语法搜索好友动态事件</div>
                    </div>
                </div>`;
            card.addEventListener('click', openDialog);
            return card;
        }

        function createToolCardOnce() {
            console.log('[FeedSearch] createToolCardOnce called');
            if (state.cardCreated) {
                console.log('[FeedSearch] Card already created');
                return;
            }
            if (document.getElementById('feed-search-tool')) {
                console.log('[FeedSearch] Card already exists in DOM');
                state.cardCreated = true;
                return;
            }

            console.log('[FeedSearch] Creating new card');
            const card = createToolCard();
            document.body.appendChild(card);
            state.cardCreated = true;
            console.log('[FeedSearch] Card created and appended');
        }

        function ensureUi() {
            ensureStyle();
            ensureDialog();
            createToolCardOnce();
        }

        async function waitForDatabase() {
            let attempts = 0;
            const maxAttempts = 30;

            while (attempts < maxAttempts) {
                console.log('[FeedSearch] waitForDatabase attempt:', attempts);
                const database = window.database;
                console.log('[FeedSearch] database:', !!database);
                console.log('[FeedSearch] searchFeedDatabase:', typeof database?.searchFeedDatabase);

                if (database && typeof database.searchFeedDatabase === 'function') {
                    console.log('[FeedSearch] Found database with searchFeedDatabase');
                    return database;
                }

                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            console.log('[FeedSearch] Timed out waiting for database');
            return null;
        }

        async function init() {
            console.log('[FeedSearch] init called');
            if (state.initialized) {
                console.log('[FeedSearch] Already initialized');
                return;
            }
            state.initialized = true;

            console.log('[FeedSearch] Waiting for database...');
            const database = await waitForDatabase();
            console.log('[FeedSearch] Got database:', !!database);
            if (database) {
                console.log('[FeedSearch] Calling wrapDatabaseSearch');
                wrapDatabaseSearch();
            } else {
                console.warn('[FeedSearch] Could not find database after waiting');
            }

            ensureUi();
            console.log('[FeedSearch] initialized');
        }

        function destroy() {
            unwrapDatabaseSearch();
            document.getElementById('feed-search-style')?.remove();
            document.getElementById('feed-search-modal-root')?.remove();
            document.getElementById('feed-search-tool')?.remove();
            state.cardCreated = false;
            state.initialized = false;
        }

        return { init, destroy, openDialog };
    })();

    // ==================== 启动管理器 ====================
    const AppManager = {
        async init() {
            const waitForDeps = () => {
                return new Promise(resolve => {
                    const check = () => {
                        if (window.$pinia && window.configRepository && document.body) {
                            resolve();
                        } else {
                            setTimeout(check, 500);
                        }
                    };
                    check();
                });
            };

            await waitForDeps();
            console.log('[AppManager] Dependencies ready');

            // 1. 先启动 ExtensionJSManager
            ExtensionJSManager.init();

            // 2. 初始化各个模块（只创建卡片，ExtensionJSManager 会负责移动）

            try {
                FeedSearchModule.init();
            } catch (err) {
                console.error('[AppManager] FeedSearch init failed:', err);
            }

            // 3. 暴露全局接口
            window[GLOBAL_KEYS.autoStatus] = {
                destroy: () => {
                    FeedSearchModule.destroy();
                    ExtensionJSManager.destroy();
                }
            };
        }
    };

    AppManager.init();
})();
