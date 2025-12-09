/**
 * assets/tdpro-guided.js
 * Guided catalog: product data, renderer, and UI event hooks.
 * Assumes assets/tdpro-cart-core.js defines window.__td and window.addToCart.
 */
(function () {
    // ---------- Product catalog ----------
    // id must match image at assets/images/<id>.png
    // category ∈ {"Discs","Bottles","Apparel","Supplies"}
    window.TD_PRODUCTS =
        [
            // Discs
            { id: "disc-driver-plain", name: "Plain Driver Disc", price: 8.00, category: "Discs", customizable: false, details: "High-speed driver • stable flight" },
            { id: "disc-midrange-plain", name: "Plain Midrange Disc", price: 7.00, category: "Discs", customizable: false, details: "Point-and-shoot control • straight" },
            { id: "disc-putter-plain", name: "Plain Putter Disc", price: 6.00, category: "Discs", customizable: false, details: "Beadless putter • soft landing" },
            { id: "disc-marker-plain", name: "Plain Marker", price: 3.00, category: "Discs", customizable: false, details: "2.25\" round • full-color print" },
            { id: "disc-driver-custom", name: "Custom Driver Disc", price: 19.00, category: "Discs", customizable: true, details: "Customizable • High-speed driver • stable flight" },
            { id: "disc-midrange-custom", name: "Custom Midrange Disc", price: 15.00, category: "Discs", customizable: true, details: "Customizable • Point-and-shoot control • straight" },
            { id: "disc-putter-custom", name: "Custom Putter Disc", price: 12.00, category: "Discs", customizable: true, details: "Customizable • Beadless putter • soft landing" },
            { id: "disc-marker-custom", name: "Custom Marker", price: 5.00, category: "Discs", customizable: true, details: "Customizable • 2.25\" round • full-color print" },
            { id: "disc-trophy-custom", name: "Custom Trophy Disc", price: 28.00, category: "Discs", customizable: true, details: "Customizable • Premium foil stamp • award ready" },

            // Bottles
            { id: "bottle-steel-34-plain", name: "Plain Steel Bottle 34oz", price: 18.00, category: "Bottles", customizable: false, details: "Double-wall vacuum • leakproof lid" },
            { id: "bottle-squeeze-26-plain", name: "Plain Squeeze Bottle 26oz", price: 5.00, category: "Bottles", customizable: false, details: "Soft LDPE • push-pull cap" },
            { id: "bottle-steel-34-custom", name: "Custom Steel Bottle 34oz", price: 24.00, category: "Bottles", customizable: true, details: "Customizable • Double-wall vacuum • leakproof lid" },
            { id: "bottle-squeeze-26-custom", name: "Custom Squeeze Bottle 26oz", price: 9.00, category: "Bottles", customizable: true, details: "Customizable • Soft LDPE • push-pull cap" },

            // Apparel
            { id: "hoodie-podium", name: "Podium Hoodie", price: 36.00, category: "Apparel", customizable: true, details: "Mid-weight fleece • S–3XL" },


            // Supplies
            { id: "tee-volunteer", name: "Volunteer Tee", price: 12.00, category: "Supplies", customizable: true, details: "Unisex blend • S–3XL" },
            { id: "polo-staff", name: "Staff Polo", price: 22.00, category: "Supplies", customizable: true, details: "Moisture-wicking • S–3XL" },
            { id: "hat-staff", name: "Staff Hat", price: 18.00, category: "Supplies", customizable: true, details: "Snapback • structured" },
            { id: "flags-pack", name: "Boundary Flags (Pack)", price: 14.00, category: "Supplies", customizable: false, details: "Assorted colors • 100-pack" },
            { id: "spray-paint", name: "Field Spray Paint", price: 7.50, category: "Supplies", customizable: false, details: "Inverted tip • turf safe" },
            { id: "goal-kit", name: "Goal Kit", price: 129.00, category: "Supplies", customizable: false, details: "Targets • anchors • hardware" },
            { id: "goal-parts", name: "Goal Kit Repair Parts", price: 22.00, category: "Supplies", customizable: false, details: "Bolts • stakes • clamps" },
            { id: "bug-spray", name: "Bug Spray", price: 6.50, category: "Supplies", customizable: false, details: "DEET-free • long-lasting" },
            { id: "sunscreen", name: "Sunscreen", price: 8.00, category: "Supplies", customizable: false, details: "Broad spectrum • water-resistant" }
        ];
    // --- Global product lookup map for recommendations ---
    window.TD_PRODUCT_MAP = window.TD_PRODUCT_MAP || {};
    if (Array.isArray(window.TD_PRODUCTS)) {
        window.TD_PRODUCTS.forEach(function (p) {
            if (!p || !p.id) return;
            window.TD_PRODUCT_MAP[p.id] = p;
        });
    }

    function TD_safeCart() {
        var cart = [];
        try {
            if (window.__td && typeof window.__td.loadCart === 'function') {
                cart = window.__td.loadCart() || [];
            }
        } catch (e) { cart = []; }
        return Array.isArray(cart) ? cart : [];
    }

    function TD_qtyOf(id) {
        if (!id) return 0;
        var cart = TD_safeCart();
        var n = 0;
        for (var i = 0; i < cart.length; i++) {
            if (cart[i] && cart[i].id === id) {
                n += Number(cart[i].qty || 0);
            }
        }
        return n;
    }

    function TD_qtyOfPrefix(prefix) {
        var cart = TD_safeCart();
        var n = 0;
        for (var i = 0; i < cart.length; i++) {
            var it = cart[i];
            if (it && typeof it.id === 'string' && it.id.indexOf(prefix) === 0) {
                n += Number(it.qty || 0);
            }
        }
        return n;
    }

    function TD_distanceFeet() {
        try {
            var raw = localStorage.getItem('td_distance_feet');
            if (!raw) return 0;
            var v = parseInt(raw, 10);
            if (isNaN(v) || v <= 0) return 0;
            return v;
        } catch (e) {
            return 0;
        }
    }

    // Add product directly to the cart by id and quantity.
    window.TD_addProductById = function (prodId, qty) {
        qty = Number(qty || 0);
        if (!prodId || !(qty > 0)) return;
        var p = window.TD_PRODUCT_MAP ? window.TD_PRODUCT_MAP[prodId] : null;
        if (!p) return;

        var cart = TD_safeCart();
        var existing = null;
        for (var i = 0; i < cart.length; i++) {
            if (cart[i] && cart[i].id === prodId) {
                existing = cart[i];
                break;
            }
        }
        if (existing) {
            existing.qty = Number(existing.qty || 0) + qty;
        } else {
            cart.push({
                id: prodId,
                name: p.name,
                price: Number(p.price || 0),
                qty: qty,
                imageUrl: 'assets/images/' + prodId + '.png',
                customizable: !!p.customizable,
                customNotes: '',
                customImages: []
            });
        }
        if (window.__td && typeof window.__td.saveCart === 'function') {
            window.__td.saveCart(cart);
        }
        try {
            window.dispatchEvent(new CustomEvent('cartchange', { detail: { cart: cart } }));
        } catch (e) { }
    };

    // Build recommendation configs for a given product add.
    function TD_buildConfigsForAdd(prodId, addedQty) {
        var configs = [];
        addedQty = Number(addedQty || 1);
        if (!(addedQty > 0)) addedQty = 1;

        var dist = TD_distanceFeet();
        var cart = TD_safeCart();

        /**
         * Build a configuration rule describing how many of a given item should be suggested.
         *
         * @param {string} label - Short label describing the suggestion (for internal use).
         * @param {string} plainId - Product id of the plain (non-custom) item.
         * @param {string} customId - Product id of the matching custom item, if any.
         * @param {number} qty - Base quantity associated with this rule.
         * @returns {Object} Configuration rule object consumed by the supplies suggestion logic.
         */
        function cfg(label, plainId, customId, qty) {
            return {
                label: label,
                plainId: plainId,
                customId: customId || '',
                qty: qty > 0 ? qty : 1
            };
        }

        // --- Disc bundles: suggest complementary molds ---
        // Only suggest discs if the cart does not already have enough of that mold.
        (function () {
            if (prodId !== 'disc-driver-custom' && prodId !== 'disc-midrange-custom' && prodId !== 'disc-putter-custom') {
                return;
            }

            // Total counts for each mold, regardless of plain/custom.
            var totalDrivers = TD_qtyOf('disc-driver-plain') + TD_qtyOf('disc-driver-custom');
            var totalMid = TD_qtyOf('disc-midrange-plain') + TD_qtyOf('disc-midrange-custom');
            var totalPut = TD_qtyOf('disc-putter-plain') + TD_qtyOf('disc-putter-custom');

            if (prodId === 'disc-driver-custom') {
                var needMid = totalDrivers - totalMid;
                var needPut = totalDrivers - totalPut;
                if (needMid > 0) {
                    configs.push(cfg('Midrange discs', 'disc-midrange-plain', 'disc-midrange-custom', needMid));
                }
                if (needPut > 0) {
                    configs.push(cfg('Putter discs', 'disc-putter-plain', 'disc-putter-custom', needPut));
                }
            } else if (prodId === 'disc-midrange-custom') {
                var needDrv = totalMid - totalDrivers;
                var needPut2 = totalMid - totalPut;
                if (needDrv > 0) {
                    configs.push(cfg('Driver discs', 'disc-driver-plain', 'disc-driver-custom', needDrv));
                }
                if (needPut2 > 0) {
                    configs.push(cfg('Putter discs', 'disc-putter-plain', 'disc-putter-custom', needPut2));
                }
            } else if (prodId === 'disc-putter-custom') {
                var needDrv2 = totalPut - totalDrivers;
                var needMid2 = totalPut - totalMid;
                if (needDrv2 > 0) {
                    configs.push(cfg('Driver discs', 'disc-driver-plain', 'disc-driver-custom', needDrv2));
                }
                if (needMid2 > 0) {
                    configs.push(cfg('Midrange discs', 'disc-midrange-plain', 'disc-midrange-custom', needMid2));
                }
            }
        })();

        // --- Hoodie -> Staff Hat (winter hat) ---
        if (typeof prodId === 'string' && prodId.indexOf('hoodie-') === 0) {
            var hoodieTotal = TD_qtyOfPrefix('hoodie-');
            var hatTotal = TD_qtyOf('hat-staff');
            var missingHats = hoodieTotal - hatTotal;
            if (missingHats > 0) {
                configs.push(cfg('Staff hats for your hoodie players', 'hat-staff', '', missingHats));
            }
        }

        // --- Flags / spray paint based on field length ---
        if (dist > 0 && (prodId === 'flags-pack' || prodId === 'spray-paint')) {
            var recommendedFlags = Math.ceil(dist / 50);
            var recommendedPaint = Math.ceil(dist / 200);

            var flagsHave = TD_qtyOf('flags-pack');
            var paintHave = TD_qtyOf('spray-paint');

            if (prodId === 'flags-pack' && paintHave === 0 && recommendedPaint > 0) {
                configs.push(cfg('Field spray paint for your layout', 'spray-paint', '', recommendedPaint));
            } else if (prodId === 'spray-paint' && flagsHave === 0 && recommendedFlags > 0) {
                configs.push(cfg('Boundary flags to match your paint', 'flags-pack', '', recommendedFlags));
            }
        }

        // --- Sunscreen / bug spray parity ---
        if (prodId === 'sunscreen' || prodId === 'bug-spray') {
            var bugQty = TD_qtyOf('bug-spray');
            var sunQty = TD_qtyOf('sunscreen');

            if (prodId === 'sunscreen' && sunQty > 0 && bugQty === 0) {
                configs.push(cfg('Bug spray to match your sunscreen', 'bug-spray', '', sunQty));
            } else if (prodId === 'bug-spray' && bugQty > 0 && sunQty === 0) {
                configs.push(cfg('Sunscreen to match your bug spray', 'sunscreen', '', bugQty));
            }
        }

        return configs;
    }

    window.TD_buildConfigsForAdd = TD_buildConfigsForAdd;

    // Create a small recommendation tile next to a card or cart row.
    function TD_createRecommendationTile(container, configs) {
        if (!container || !configs || !configs.length) return;
        var host = container.querySelector('.recommend-tile');
        if (host && host.parentNode === container) {
            host.parentNode.removeChild(host);
        }

        host = document.createElement('div');
        host.className = 'recommend-tile';
        var inner = '<div class="small muted">You might also want:</div>';

        configs.forEach(function (c, index) {
            var lineId = 'rec-line-' + (Date.now()) + '-' + index;
            inner += '' +
                '<div class="rec-line" id="' + lineId + '" data-rec-plain="' + (c.plainId || '') + '" data-rec-custom="' + (c.customId || '') + '">' +
                '<div class="rec-main">' +
                '<span class="rec-label">' + c.label + '</span>' +
                '<div class="qty-inline rec-qty">' +
                '<button type="button" data-rec-act="dec">−</button>' +
                '<input type="number" min="1" value="' + c.qty + '" />' +
                '<button type="button" data-rec-act="inc">+</button>' +
                '</div>' +
                (c.customId ? '<label class="small rec-custom-toggle"><input type="checkbox" data-rec-custom /> Custom?</label>' : '') +
                '<button type="button" class="btn rec-add-btn" data-rec-add="1">Add</button>' +
                '</div>' +
                '</div>';
        });

        host.innerHTML = inner;
        container.appendChild(host);
    }
    window.TD_createRecommendationTile = TD_createRecommendationTile;

    // Render sidebar recommendations based on the entire cart.
    window.TD_renderSidebarRecommendations = function (containerId) {
        var el = document.getElementById(containerId);
        if (!el || !window.__td || typeof window.__td.loadCart !== 'function') return;

        var cart = window.__td.loadCart() || [];
        if (!cart.length) {
            el.innerHTML = '';
            return;
        }

        var combined = [];
        var byKey = {};

        cart.forEach(function (it) {
            if (!it || !it.id) return;
            var cfgs = TD_buildConfigsForAdd(it.id, it.qty || 1) || [];
            cfgs.forEach(function (c) {
                if (!c) return;
                var key = (c.plainId || '') + '|' + (c.customId || '');
                var existing = byKey[key];
                if (existing) {
                    existing.qty += c.qty || 0;
                } else {
                    var copy = {
                        label: c.label,
                        plainId: c.plainId,
                        customId: c.customId || '',
                        qty: c.qty
                    };
                    byKey[key] = copy;
                    combined.push(copy);
                }
            });
        });

        // Filter out suggestions that the cart already satisfies
        var snapshot = TD_safeCart();
        combined = combined.filter(function (c) {
            if (!c) return false;
            var want = Number(c.qty || 0);
            if (!(want > 0)) return false;
            var have = 0;
            for (var i = 0; i < snapshot.length; i++) {
                var it = snapshot[i];
                if (!it || !it.id) continue;
                if (it.id === c.plainId || (c.customId && it.id === c.customId)) {
                    have += Number(it.qty || 0);
                }
            }
            return have < want;
        });

        if (!combined.length) {
            el.innerHTML = '';
            return;
        }

        TD_createRecommendationTile(el, combined);
    };

    // Show recommendations when an item is added from a product card.
    window.TD_showRecommendationsForAdd = function (btn) {
        if (!btn) return;
        try {
            var card = btn.closest('.card');
            var prodId = btn && btn.getAttribute('data-id');
            if (!prodId && card) {
                prodId = card.getAttribute('data-id') || '';
            }
            if (!prodId) return;

            var qty = 1;
            if (card) {
                var qtyInput = card.querySelector('.qty-inline input[type="number"]');
                qty = qtyInput ? parseInt(qtyInput.value, 10) : 1;
                if (!(qty > 0)) qty = 1;
            }

            // If we have a sidebar container and full-cart renderer, use that for cleaner suggestions.
            var sidebar = document.getElementById('recommendSidebar');
            if (sidebar && typeof window.TD_renderSidebarRecommendations === 'function') {
                window.TD_renderSidebarRecommendations('recommendSidebar');
                return;
            }

            var configs = TD_buildConfigsForAdd(prodId, qty);
            if (!configs.length) return;

            // Fallback: attach tile under the product card body / CTA row.
            if (!card) return;
            var container = card.querySelector('.cta-row') || card.querySelector('.body') || card;
            TD_createRecommendationTile(container, configs);
        } catch (e) { }
    };

    // Delegate events for recommendation tiles.
    document.addEventListener('click', function (e) {
        var actBtn = e.target.closest('[data-rec-act]');
        if (actBtn) {
            var line = actBtn.closest('.rec-line');
            if (!line) return;
            var input = line.querySelector('input[type="number"]');
            if (!input) return;
            var v = parseInt(input.value, 10);
            if (isNaN(v) || v < 1) v = 1;
            if (actBtn.getAttribute('data-rec-act') === 'inc') {
                v++;
            } else {
                v = Math.max(1, v - 1);
            }
            input.value = v;
            return;
        }

        var addBtn = e.target.closest('[data-rec-add="1"]');
        if (addBtn) {
            var line2 = addBtn.closest('.rec-line');
            if (!line2) return;
            var input2 = line2.querySelector('input[type="number"]');
            var qty2 = input2 ? parseInt(input2.value, 10) : 1;
            if (!(qty2 > 0)) qty2 = 1;

            var plainId = line2.getAttribute('data-rec-plain') || '';
            var customId = line2.getAttribute('data-rec-custom') || '';
            var customToggle = line2.querySelector('[data-rec-custom]');
            var wantCustom = !!(customToggle && customToggle.checked && customId);

            var targetId = wantCustom && customId ? customId : plainId;
            if (targetId) {
                window.TD_addProductById(targetId, qty2);
            }

            // Small inline confirmation
            var note = line2.querySelector('.rec-note');
            if (!note) {
                note = document.createElement('span');
                note.className = 'small muted rec-note';
                note.style.marginLeft = '8px';
                line2.querySelector('.rec-main').appendChild(note);
            }
            note.textContent = 'Added';
            setTimeout(function () {
                if (note && note.parentNode) {
                    note.parentNode.removeChild(note);
                }
            }, 1500);
        }
    }, { passive: true });


    // ---------- Utilities ----------
    /**
     * Format a price using the shared tdpro currency formatter, falling back to USD.
     *
     * @param {number} value - Base amount in USD.
     * @returns {string} Formatted currency string.
     */
    function fmt(value) {
        if (window.__td && typeof window.__td.fmt === "function") {
            return window.__td.fmt(value);
        }
        return "$" + Number(value || 0).toFixed(2);
    }

    /**
     * HTML-escape a string so it can be safely inserted into innerHTML.
     *
     * @param {string} s - Raw text value that may contain special characters.
     * @returns {string} Escaped string with &, <, >, and " converted to entities.
     */
    function htmlEscape(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    // ---------- Renderer ----------
    // Multi-category aware catalog renderer
    window.renderCatalog = function (containerId, opts) {
        opts = opts || {};
        var el = document.getElementById(containerId);
        if (!el) return;

        // normalize categories option
        var cats = [];
        if (Array.isArray(opts.categories)) cats = opts.categories;
        else if (opts.category) cats = [opts.category];

        var list = window.TD_PRODUCTS.filter(function (p) {
            if (!cats.length) return true;
            return cats.indexOf(p.category) !== -1;
        });

        // frequent badge
        var frequentItems = ["disc-driver-custom", "disc-midrange-plain", "disc-putter-plain", "spray-paint", "flags-pack", "disc-trophy-custom", "disc-marker-custom", "bottle-squeeze-26-custom", "hoodie-podium"];

        var html = '<div class="grid-4">';
        list.forEach(function (p) {
            var price = window.__td ? window.__td.fmt(p.price) : ('$' + p.price.toFixed(2));
            var details = p.details || (p.category + (p.customizable ? " · Customizable" : ""));
            html +=
                '<article class="card" data-id="' + p.id + '" data-customizable="' + (p.customizable ? 1 : 0) + '">' +
                '<div class="img">' +
                '<img src="assets/images/' + p.id + '.png" alt="' + p.name + '">' +
                '</div>' +
                '<div class="body">' +
                '<div class="title">' + p.name + '</div>' +
                '<div class="price" data-price="' + p.price + '" style="float:right">' + price + '</div>' +
                '<div class="cta-row">' +
                '<div class="qty-inline">' +
                '<button type="button" data-act="dec">−</button>' +
                '<input type="number" min="1" value="1" aria-label="Quantity">' +
                '<button type="button" data-act="inc">+</button>' +
                '</div>' +
                '<button class="btn" data-add="1" data-id="' + p.id + '" data-customizable="' + (p.customizable ? 1 : 0) + '">Add</button>' +
                '</div>' +
                '<div class="small muted">' + details + '</div>' +
                '</div>' +
                (frequentItems.includes(p.id) ? '<div class="badge-frequent">Frequently Bought</div>' : '') +
                '</article>';
        });
        html += "</div>";
        el.innerHTML = html;

        // If this is a supplies grid, show Suggested: counts for flags and spray paint based on saved field length.
        /**
         * Apply "Suggested: N" notes for flags and spray paint cards based on the saved field distance.
         *
         * @param {Element} rootEl - Root element that contains the supplies grid.
         * @param {Array<string>} cats - Categories present in the grid (e.g., ["Supplies"]).
         * @param {Object} opts - Render options that may include a single category or flags.
         * @returns {void} Nothing is returned. The DOM is updated in-place.
         */
        function TD_applySuppliesSuggestions(rootEl, cats, opts) {
            if (!rootEl) return;
            cats = cats || [];
            opts = opts || {};
            try {
                var isSupplies = false;
                if (cats.indexOf('Supplies') !== -1) {
                    isSupplies = true;
                } else if (!cats.length && opts.category === 'Supplies') {
                    isSupplies = true;
                }
                var grid = rootEl.querySelector('.grid-4') || rootEl;
                if (!grid) return;

                var dist = TD_distanceFeet();
                var oldFlags = grid.querySelectorAll('.suggest-flags');
                var oldPaint = grid.querySelectorAll('.suggest-paint');
                // Clear any previous notes if there is no saved distance
                if (!dist || !(dist > 0)) {
                    oldFlags.forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
                    oldPaint.forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
                    return;
                }
                if (!isSupplies) return;

                var flags = Math.ceil(dist / 50);
                var paint = Math.ceil(dist / 200);

                var cards = grid.querySelectorAll('.card');
                var flagCard = null;
                var paintCard = null;
                // forEach shim for NodeList in older browsers
                if (!cards.forEach) {
                    cards.forEach = function (fn) {
                        for (var i = 0; i < cards.length; i++) { fn(cards[i], i); }
                    };
                }
                cards.forEach(function (card) {
                    var id = card.getAttribute('data-id') || '';
                    if (id === 'flags-pack') flagCard = card;
                    if (id === 'spray-paint') paintCard = card;
                });
                if (flagCard) {
                    var note = flagCard.querySelector('.suggest-flags');
                    if (!note) {
                        note = document.createElement('div');
                        note.className = 'small suggest-flags';
                        note.style.marginTop = '6px';
                        var body = flagCard.querySelector('.body') || flagCard;
                        body.appendChild(note);
                    }
                    note.textContent = 'Suggested: ' + flags + ' pack' + (flags > 1 ? 's' : '');
                }
                if (paintCard) {
                    var note2 = paintCard.querySelector('.suggest-paint');
                    if (!note2) {
                        note2 = document.createElement('div');
                        note2.className = 'small suggest-paint';
                        note2.style.marginTop = '6px';
                        var body2 = paintCard.querySelector('.body') || paintCard;
                        body2.appendChild(note2);
                    }
                    note2.textContent = 'Suggested: ' + paint + ' can' + (paint > 1 ? 's' : '');
                }
            } catch (e) { }
        }

        // Apply supplies suggestions immediately after rendering.
        TD_applySuppliesSuggestions(el, cats, opts);

        // Expose a small helper so pages can refresh suggestions when distance changes.
        if (!window.TD_refreshSuppliesSuggestions) {
            window.TD_refreshSuppliesSuggestions = function (containerId) {
                var rootEl = document.getElementById(containerId);
                if (!rootEl) return;
                TD_applySuppliesSuggestions(rootEl, ['Supplies'], { category: 'Supplies' });
            };
        }

        // currency live-refresh
        window.addEventListener('currencychange', function () {
            document.querySelectorAll('.price[data-price]').forEach(function (el2) {
                var base = parseFloat(el2.getAttribute('data-price')) || 0;
                el2.textContent = window.__td.fmt(base);
            });
        });
    };

    // ---------- Global delegated handlers ----------
    document.addEventListener("click", function (e) {
        // qty inc/dec only
        var qbtn = e.target.closest(".qty-inline button");
        if (qbtn) {
            var input = qbtn.parentElement.querySelector("input");
            var v = Math.max(1, parseInt(input.value, 10) || 1);
            input.value = (qbtn.dataset.act === "inc") ? (v + 1) : Math.max(1, v - 1);
            return;
        }

        // IMPORTANT: we do NOT handle add-to-cart here anymore.
        // The single delegated handler lives in assets/tdpro-cart-core.js.
    });

    // Reformat visible prices on currency change.
    /**
     * Attach a one-time currencychange handler that re-renders visible price labels.
     *
     * @returns {void} Nothing is returned. A global event listener is registered.
     */
    (function attachCurrencyHandlerOnce() {
        if (window.__tdCurrencyHooked) return;

        window.addEventListener("currencychange", function () {
            document.querySelectorAll(".grid-4 .price[data-price]").forEach(function (el) {
                var base = parseFloat(el.getAttribute("data-price")) || 0;
                el.textContent = fmt(base);
            });
        });

        window.__tdCurrencyHooked = true;
    })();
})();
