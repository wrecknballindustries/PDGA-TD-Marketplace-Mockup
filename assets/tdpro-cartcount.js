/**
 * assets/tdpro-cartcount.js
 * Keeps the cart-count badge in the header in sync with the contents of localStorage.
 */
(function () {
    /**
     * Compute the total quantity of items in the cart.
     * @param {Array<{qty:number}>} cart - Raw cart array loaded from storage.
     * @returns {number} Total item count across all cart lines.
     */
    function count(cart) {
        return (cart || []).reduce(function (sum, item) {
            return sum + (item && item.qty ? Number(item.qty) : 0);
        }, 0);
    }

    /**
     * Read the cart via window.__td helpers and update the #cartCount badge.
     */
    function updateBadge() {
        var el = document.getElementById("cartCount");
        if (!el || !window.__td || typeof window.__td.loadCart !== "function") {
            return;
        }
        var cart = window.__td.loadCart() || [];
        el.textContent = String(count(cart));
    }

    document.addEventListener("DOMContentLoaded", updateBadge);
    window.addEventListener("cartchange", updateBadge);
})();
