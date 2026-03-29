/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Service for handling shopping redirects.
 * Note: API surface is kept stable to avoid breaking existing callers.
 */
export const InstamartService = {
    /**
     * Generate a shopping deep link.
     * Kept for backward compatibility with existing callers.
     * @param query Product name or search query
     * @returns URL string
     */
    generateDeepLink(query: string): string {
        return `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`;
    },

    /**
     * Generate a web shopping search URL.
     * @param query Product name or search query
     * @returns Web URL string
     */
    generateWebFallback(query: string): string {
        return `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`;
    },

    /**
     * Open shopping results for a specific product in a new tab.
     * Keeps user on shopping list while opening the result page in a new tab.
     * @param query Product name or search query
     */
    openInstamart(query: string): void {
        const shoppingUrl = this.generateWebFallback(query);
        window.open(shoppingUrl, '_blank', 'noopener,noreferrer');
    },

    /**
     * Open a single Google Shopping tab for multiple products.
     * Using one tab avoids popup blockers that can block many tab opens.
     * @param queries Product names
     */
    openInstamartForMany(queries: string[]): void {
        const cleaned = Array.from(
            new Set(
                (queries || [])
                    .map((q) => q.trim())
                    .filter((q) => q.length > 0)
            )
        );

        if (cleaned.length === 0) return;
        if (cleaned.length === 1) {
            this.openInstamart(cleaned[0]);
            return;
        }

        const combinedQuery = cleaned.map((item) => `(${item})`).join(' OR ');
        const shoppingUrl = this.generateWebFallback(combinedQuery);
        window.open(shoppingUrl, '_blank', 'noopener,noreferrer');
    },

    /**
     * Open Instamart and optionally add product to a list or cart
     * Extended functionality for future enhancements
     * @param product Product name
     * @param quantity Optional quantity
     * @param unit Optional unit (e.g., 'kg', 'liters')
     */
    openInstamartWithProduct(product: string, quantity?: number, unit?: string): void {
        const searchQuery = quantity && unit ? `${product} ${quantity}${unit}` : product;
        this.openInstamart(searchQuery);
    },

    /**
     * Check if device is mobile.
     * @returns True if device appears to be mobile
     */
    isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Get share URL for a product shopping search.
     * @param query Product name
     * @returns Shareable URL
     */
    getShareableUrl(query: string): string {
        return this.generateWebFallback(query);
    },
};
