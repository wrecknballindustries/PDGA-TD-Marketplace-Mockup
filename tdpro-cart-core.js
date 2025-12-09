/**
 * assets/tdpro-cart-core.js
 * Core cart utilities: load/save, currency formatting, add-to-cart, and delegates.
 * Stores product image URL and customization fields on each line.
 */
(function () {
    var KEY = 'cart';

    /** Normalize a cart array to ensure required fields exist. */
    function normalize(arr) {
        if (!Array.isArray(arr)) return [];
        for (var i = 0; i < arr.length; i++) {
            var it = arr[i] || {};
            if (typeof it.customizable === 'undefined') it.customizable = false;
            if (typeof it.customNotes === 'undefined') it.customNotes = '';
            if (!Array.isArray(it.customImages)) it.customImages = [];
            if (typeof it.imageUrl === 'undefined') it.imageUrl = '';
            arr[i] = it;
        }
        return arr;
    }

    /** Load cart from localStorage. */
    function load() {
        try {
            var raw = localStorage.getItem(KEY);
            var arr = raw ? JSON.parse(raw) : [];
            return normalize(arr);
        } catch (e) {
            return [];
        }
    }

    /** Save cart to localStorage. */
    function save(c) {
        localStorage.setItem(KEY, JSON.stringify(normalize(c || [])));
    }

    /** Currency helpers */
    function symbolFor(code) {
        var map = { US: '$', CA: '$', GB: '£', EU: '€', AU: '$', JP: '¥', SE: 'kr', NO: 'kr', CH: 'Fr', MX: '$' };
        return map[code] || '$';
    }
    // currency conversion rate
    /**
     * Look up the conversion rate multiplier for a currency code.
     *
     * @param {string} code - Currency code such as "USD", "EUR", or "GBP".
     * @returns {number} Conversion factor that will be multiplied by the base USD amount.
     */
    function rateFor(code) {
        var rates = {
            US: 1,
            CA: 1.38,
            GB: 0.79,
            EU: 0.92,
            AU: 1.55,
            JP: 150.45,
            SE: 10.84,
            NO: 11.31,
            CH: 0.91,
            MX: 19.22,
        };
        return rates[code] || 1; //default
    }
    // apply conversion rate
    /**
     * Format a base USD amount using the active currency symbol and rate.
     *
     * @param {number} n - Base amount (in USD) before conversion.
     * @returns {string} Human-readable currency string like "$12.34".
     */
    function fmt(n) {
        var code = localStorage.getItem('country') || 'US';
        var rate = rateFor(code);
        var converted = Number(n) * rate;
        return symbolFor(code) + converted.toFixed(2);
    }

    window.__td = window.__td || {};
    window.__td.loadCart = load;
    window.__td.saveCart = save;
    window.__td.fmt = fmt;
    window.__td.clearCart = function () { save([]); };

    /** Add product to cart from a product card button. */
    window.addToCart = function (btn) {
        var card = btn && btn.closest('.card');
        if (!card) return;

        var titleEl = card.querySelector('.title');
        var priceEl = card.querySelector('.price');
        var qtyEl = card.querySelector('.qty-inline input') || card.querySelector('input[type=number]');

        var qty = Math.max(1, parseInt(qtyEl && qtyEl.value, 10) || 1);

        var price = 0;
        if (priceEl) {
            var s = priceEl.dataset.price || priceEl.textContent;
            var m = String(s).replace(/[^0-9.,]/g, ' ')
                .trim()
                .split(/\s+/)
                .map(function (t) { return parseFloat(t.replace(/,/g, '')); })
                .filter(function (v) { return !isNaN(v); });
            price = m.length ? m[0] : 0;
        }

        var name = titleEl ? titleEl.textContent.trim() : 'Item';

        // Use real product id from DOM when available; fall back to name-based slug.
        var ds = (btn && btn.dataset) || {};
        var prodId = card.getAttribute('data-id') || ds.id || name.toLowerCase().replace(/\s+/g, '-');

        // image url from the card
        var imgEl = card.querySelector('.img img');
        var imageUrl = imgEl ? imgEl.src : '';

        // customizable flag from DOM
        var customizable = (card.getAttribute('data-customizable') === '1') || (ds.customizable === '1');

        var cart = load();
        var ex = cart.find(function (i) { return i.id === prodId; });

        if (ex) {
            ex.qty += qty;
            if (!ex.imageUrl && imageUrl) ex.imageUrl = imageUrl;
            // backfill safety
            if (typeof ex.customizable === 'undefined') ex.customizable = customizable;
            if (typeof ex.customNotes === 'undefined') ex.customNotes = '';
            if (!Array.isArray(ex.customImages)) ex.customImages = [];
        } else {
            cart.push({
                id: prodId,
                name: name,
                price: price,
                qty: qty,
                imageUrl: imageUrl,
                customizable: !!customizable,
                customNotes: '',
                customImages: []
            });
        }

        save(cart);
        window.dispatchEvent(new CustomEvent('cartchange', { detail: { cart: cart } }));
    };

    // Delegate add-to-cart clicks
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-add="1"]');
        if (!btn) return;
        if (btn.dataset.busy === '1') return;

        // Visual click feedback
        btn.classList.add('btn-pressed');
        setTimeout(function () {
            btn.classList.remove('btn-pressed');
        }, 150);

        // Temporary "Added to cart" message near the button
        var container = btn.parentElement || btn;
        var msg = container.querySelector('.add-msg');
        if (!msg)
        {
            msg = document.createElement('span');
            msg.className = 'small muted add-msg';
            msg.style.marginLeft = '8px';
            container.appendChild(msg);
        }
        msg.textContent = 'Added to cart';
        msg.style.display = 'inline';
        if (msg._hideTimer)
        {
            clearTimeout(msg._hideTimer);
        }
        msg._hideTimer = setTimeout(function ()
        {
            msg.style.display = 'none';
        }, 2000);

        btn.dataset.busy = '1';
        try {
            window.addToCart(btn);
            if (window.TD_showRecommendationsForAdd) {
                try { window.TD_showRecommendationsForAdd(btn); } catch (e) { }
            }
        } finally {
            setTimeout(function () { delete btn.dataset.busy; }, 200);
        }
    }, { passive: true });

    // Clear cart button
    document.addEventListener('click', function (e) {
        var b = e.target.closest('#clearCartBtn');
        if (!b) return;
        window.__td.clearCart();
        window.dispatchEvent(new CustomEvent('cartchange', { detail: { cart: [] } }));
    }, { passive: true });

    // Currency selector init
    document.addEventListener('DOMContentLoaded', function () {
        var sel = document.getElementById('countrySelect');
        var badge = document.getElementById('currencyBadge');
        if (sel) {
            var saved = localStorage.getItem('country') || 'US';
            sel.value = saved;
            if (badge) badge.textContent = symbolFor(saved) + ' ';
            sel.addEventListener('change', function () {
                localStorage.setItem('country', sel.value);
                if (badge) badge.textContent = symbolFor(sel.value) + ' ';
                window.dispatchEvent(new Event('currencychange'));
            });
        }
    });

    (function () {
        if (!window.cart) return;

        var _add = cart.add, _remove = cart.remove, _clear = cart.clear, _set = cart.set;
        function triggerCartChange() { try { window.dispatchEvent(new CustomEvent('cartchange')); } catch (e) { } }

        if (typeof _add === 'function') { cart.add = function () { var r = _add.apply(cart, arguments); triggerCartChange(); return r; }; }
        if (typeof _remove === 'function') { cart.remove = function () { var r = _remove.apply(cart, arguments); triggerCartChange(); return r; }; }
        if (typeof _set === 'function') { cart.set = function () { var r = _set.apply(cart, arguments); triggerCartChange(); return r; }; }
        if (typeof _clear === 'function') { cart.clear = function () { var r = _clear.apply(cart, arguments); triggerCartChange(); return r; }; }

        triggerCartChange();
    })();

})();
