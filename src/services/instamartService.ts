/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Service for handling Swiggy Instamart deep linking and redirects
 * Supports both app deep links and web fallback for shopping items
 */
export const InstamartService = {
    /**
     * Generate a Swiggy Instamart deep link for a product search
     * Deep links work on mobile devices with Swiggy app installed
     * @param query Product name or search query
     * @returns Deep link URL string
     */
    generateDeepLink(query: string): string {
        return `swiggy://explore?query=${encodeURIComponent(query)}`;
    },

    /**
     * Generate a web fallback URL for Instamart search
     * Used when the user doesn't have the Swiggy app installed
     * @param query Product name or search query
     * @returns Web URL string
     */
    generateWebFallback(query: string): string {
        return `https://www.swiggy.com/instamart/search?query=${encodeURIComponent(query)}`;
    },

    /**
     * Open Instamart for a specific product in a new tab
     * Keeps user on shopping list while opening Instamart in new tab
     * On mobile, deep link takes priority; on web, opens Instamart search in new tab
     * @param query Product name or search query
     */
    openInstamart(query: string): void {
        const deepLink = this.generateDeepLink(query);
        const webFallback = this.generateWebFallback(query);

        // On mobile devices, try deep link first
        if (this.isMobileDevice()) {
            // Set a timeout to open web fallback in new tab if deep link doesn't work
            const timeout = setTimeout(() => {
                window.open(webFallback, '_blank');
            }, 1500); // 1.5 second timeout for app to respond

            // Attempt to open the deep link (app will intercept if installed)
            window.location.href = deepLink;
        } else {
            // On desktop/web, always open in new tab (no need for deep link)
            window.open(webFallback, '_blank');
        }
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
     * Check if device is mobile (potential Swiggy app user)
     * @returns True if device appears to be mobile
     */
    isMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Get share URL for Instamart product
     * Useful for sharing items with other users
     * @param query Product name
     * @returns Shareable URL
     */
    getShareableUrl(query: string): string {
        return this.generateWebFallback(query);
    },
};
