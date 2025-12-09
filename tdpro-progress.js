/**
 * assets/tdpro-progress.js
 * Renders the guided flow progress bar and exposes progress.render / progress.hide.
 */
(function () {
    // SVG icon builders
    /**
     * Build the inline SVG string for the disc icon used in the progress bar.
     *
     * @param {boolean} active - Whether the current step is active or already completed.
     * @returns {string} SVG markup string with the appropriate active state classes.
     */
    function svgDisc(active) {
        return '<svg class="prg-ico prg-disc' + (active ? ' active' : '') + '" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none"/><circle cx="32" cy="32" r="8" fill="currentColor"/></svg>';
    }
    /**
     * Build the inline SVG string for the arrow icon connecting steps.
     *
     * @param {boolean} active - True if the chevron is between completed steps.
     * @returns {string} SVG markup string with the appropriate active state classes.
     */
    function svgChevron(active) {
        return '<svg class="prg-ico prg-chv' + (active ? ' active' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l8 8-8 8" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    /**
     * Build the inline SVG string for the goal / finish icon.
     *
     * @param {boolean} active - Whether the final step is active or completed.
     * @returns {string} SVG markup string for the goal icon.
     */
    function svgGoal(active) {
        return '<svg class="prg-ico prg-goal' + (active ? ' active' : '') + '" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="12" r="6" fill="currentColor"/><path d="M12 24h40M12 32h40M12 40h40" stroke="currentColor" stroke-width="4"/><path d="M32 12v40" stroke="currentColor" stroke-width="4"/><path d="M24 52h16" stroke="currentColor" stroke-width="4"/></svg>';
    }

    // Public API
    /**
     * Render the progress bar into the DOM and highlight the current step.
     *
     * @param {number} step - Current step index (1-based).
     * @param {Object} opts - Optional settings such as target element id or labels.
     * @returns {void} Nothing is returned. The progress bar markup is written into the DOM.
     */
    function render(step, opts) {
        opts = opts || {};
        var root = document.getElementById('progress-root');
        if (!root) { return; }

        // Order and target files. Labels per user: discs, markers, apparel, bottles, supplies.
        var chevrons = [
            { key: 'discs', label: 'Discs', href: 'TD_Guided_Discs.html' },
            { key: 'extras', label: 'Extras', href: 'TD_Guided_Extras.html' },
            { key: 'supplies', label: 'Supplies', href: 'TD_Guided_Supplies.html' }
        ];

        var activeKey = (opts.page || '').toLowerCase();

        var html = ['<div class="progress-wrap"><div class="progress-track">'];

        // Start disc (linked to index)
        var start = '<a class="prg-link" href="index.html" tabindex="0" aria-label="Start">'
            + svgDisc(step === 'index')
            + '<div class="prg-label">Start</div></a>';
        html.push('<div class="prg-node">' + start + '</div>');
        html.push('<div class="prg-line"></div>');

        // Chevrons
        chevrons.forEach(function (c, i) {
            var active = (step === 'guided' && c.key === activeKey);
            var item = '<a class="prg-link" href="' + c.href + '" tabindex="0" aria-label="' + c.label + '">'
                + svgChevron(active)
                + '<div class="prg-label">' + c.label + '</div></a>';
            html.push('<div class="prg-node">' + item + '</div>');
            if (i !== chevrons.length - 1) {
                html.push('<div class="prg-line"></div>');
            }
        });

        // Goal cart
        html.push('<div class="prg-line"></div>');
        var cart = '<a class="prg-link" href="TD_Cart.html" tabindex="0" aria-label="Cart">'
            + svgGoal(step === 'cart')
            + '<div class="prg-label">Cart</div></a>';
        html.push('<div class="prg-node">' + cart + '</div>');

        html.push('</div></div>');
        root.innerHTML = html.join('');
    }

    /**
     * Hide or collapse the progress bar. Used on pages that do not need it.
     *
     * @returns {void} Nothing is returned. The progress element is hidden in the DOM.
     */
    function hide() {
        var root = document.getElementById('progress-root');
        if (root) { root.innerHTML = ''; }
    }

    window.markFlowGuided = function () { sessionStorage.setItem('flow', 'guided'); };
    window.markFlowDirect = function () { sessionStorage.setItem('flow', 'direct'); };

    // Export
    window.progress = { render: render, hide: hide };
})();

// Track last page for cart gating
document.addEventListener('DOMContentLoaded', function () {
    try {
        var path = (location.pathname.split('/').pop() || 'index.html');
        sessionStorage.setItem('lastPage', path);
    } catch (e) { }
});
