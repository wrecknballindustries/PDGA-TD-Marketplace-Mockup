/**
 * assets/tdpro-widget.js
 * Mini "per player" summary widget that shows per-player cost and cart subtotal.
 */
(function () {
    /**
     * Format a number as currency using the shared tdpro formatter if it exists.
     *
     * @param {number} n - Base amount to format.
     * @returns {string} Currency string such as "$12.34".
     */
    function fmt(n) {
        try { return __td ? __td.fmt(n) : ('$' + Number(n || 0).toFixed(2)); }
        catch (e) { return '$' + Number(n || 0).toFixed(2); }
    }

    /**
     * Load the cart either from window.__td or from a legacy window.cart.items array.
     *
     * @returns {Array} Normalized cart array used by the mini widget.
     */
    function loadCart() {
        if (window.__td && typeof __td.loadCart === 'function') {
            var a = __td.loadCart() || [];
            return Array.isArray(a) ? a : [];
        }
        if (window.cart && Array.isArray(window.cart.items)) return window.cart.items;
        return [];
    }

    /**
     * Collapse an array of items down to unique id entries, summing their quantities.
     *
     * @param {Array} items - Raw cart items that may contain duplicate ids.
     * @returns {Array} Array of unique items with aggregated quantities.
     */
    function uniqById(items) {
        var seen = Object.create(null), out = [];
        for (var i = 0; i < items.length; i++) {
            var it = items[i]; if (!it || !it.id) continue;
            if (!seen[it.id]) { seen[it.id] = 1; out.push(it); }
        }
        return out;
    }

    // Builds a fresh catalog map every render to avoid race with TD_PRODUCTS load order
    // because something was causing issues with trying to not have any supplies items in the widget.
    /**
     * Build a simple lookup object keyed by product id with metadata needed by the widget.
     *
     * @returns {Object} Map from product id to basic product metadata.
     */
    function buildCatalogMap() {
        var map = Object.create(null), idsSupplies = new Set();
        if (Array.isArray(window.TD_PRODUCTS)) {
            for (var i = 0; i < TD_PRODUCTS.length; i++) {
                var p = TD_PRODUCTS[i] || {};
                var cat = String(p.category || '').toLowerCase();
                map[p.id] = { name: p.name, price: Number(p.price || 0), cat: cat };
                if (cat.includes('suppl') || cat.includes('field')) idsSupplies.add(p.id);
            }
        }
        return { map: map, idsSupplies: idsSupplies };
    }

    /**
     * Render or refresh the mini per-player widget in the page sidebar.
     *
     * @returns {void} Nothing is returned. The widget markup is written into the DOM.
     */
    function render() {
        var root = document.getElementById('mini-cart');
        if (!root) return;

        var cat = buildCatalogMap();
        var MAP = cat.map;
        var SUPPLY_IDS = cat.idsSupplies;

        /**
         * Determine whether a catalog entry should be treated as a field supply item.
         *
         * @param {Object} item - Cart or catalog entry being inspected.
         * @returns {boolean} True if the item belongs to the supplies category.
         */
        function isSupplies(item) {
            var id = item.id;
            if (SUPPLY_IDS.has(id)) return true;
            if (id && typeof id === 'string' && id.indexOf('disc-trophy') === 0) return true;
            var catStr = ((item && item.category) ? String(item.category) : (MAP[id]?.cat || '')).toLowerCase();
            return catStr.includes('suppl') || catStr.includes('field');
        }
        /**
         * Compute the line price for a single cart entry based on qty and unit price.
         *
         * @param {Object} item - Cart entry with price and qty fields.
         * @returns {number} Total price for this line item.
         */
        function priceOf(item) {
            if (item && item.price != null) return Number(item.price) || 0;
            return MAP[item.id]?.price || 0;
        }
        /**
         * Produce a short label for display in the mini widget list.
         *
         * @param {Object} item - Cart entry representing a product.
         * @returns {string} Human-readable label such as "Custom Driver Disc × 2".
         */
        function labelOf(item) {
            return item?.name || MAP[item.id]?.name || item.id;
        }

        var cartFull = loadCart();
        var items = uniqById(cartFull).filter(function (it) {
            if (!it) return false;
            if (isSupplies(it)) return false;
            if (it.id === 'disc-trophy-custom') return false;
            return true;
        });

        var rows = items.map(function (it) {
            return '<li class="mini-item"><span>' + labelOf(it) + '</span><span>' + fmt(priceOf(it)) + '</span></li>';
        }).join('');

        var per = items.reduce(function (s, it) { return s + priceOf(it); }, 0);
        var subtotal = (cartFull || []).reduce(function (s, it) {
            if (!it) return s;
            var qty = Number(it.qty || 0);
            if (!(qty > 0)) return s;
            return s + priceOf(it) * qty;
        }, 0);

        root.innerHTML =
            '<h3 class="mini-title">Per-Player Kit</h3>' +
            '<div class="mini-body"><ul class="mini-list">' + rows + '</ul></div>' +
            '<div class="mini-total"><span>Total Cost Per Player</span><span>' + fmt(per) + '</span></div>' +
            '<div class="mini-total"><span>Cart subtotal (before tax)</span><span>' + fmt(subtotal) + '</span></div>';
    }

    document.addEventListener('DOMContentLoaded', render);
    window.addEventListener('cartchange', render);
    window.addEventListener('currencychange', render);
    window.addEventListener('storage', render);
    document.addEventListener('click', function (e) {
        if (e.target.closest('[data-add]')) setTimeout(render, 0);
    }, { passive: true });

    window.tdMiniWidget = { render };
})();
