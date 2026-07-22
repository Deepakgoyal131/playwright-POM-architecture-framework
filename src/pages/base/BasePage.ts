import { Page, Locator } from '@playwright/test';
import * as path from 'path';

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Internal Helper: String selector ya Locator dono ko accept karke strictly Locator return karta hai
     */
    protected resolveLocator(locator: string | Locator): Locator {
        return typeof locator === 'string' ? this.page.locator(locator) : locator;
    }

    /**
     * 1. Safe Click Implementation with Retries and Auto-Scroll
     */
    async safeClick(locator: string | Locator, options: { timeout?: number; retries?: number; force?: boolean } = {}) {
        const { timeout = 5000, retries = 1, force = false } = options;
        const element = this.resolveLocator(locator);

        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                await element.waitFor({ state: 'attached', timeout });
                await element.waitFor({ state: 'visible', timeout });
                
                try {
                    await element.evaluate(el => el.scrollIntoView({ block: 'center' }));
                } catch {
                    // Safe bypass if scroll fails
                }

                if (!force) {
                    await element.click({ trial: true, timeout });
                }
                await element.click({ force, timeout });
                return;
            } catch (error) {
                if (attempt > retries) {
                    throw new Error(`[BasePage] safeClick failed after ${retries + 1} attempts\n${error}`);
                }
                await this.page.waitForTimeout(200);
            }
        }
    }

    /**
     * 2. Safe Fill (Clears stubborn inputs before entering text)
     */
    async safeFill(locator: string | Locator, value: string, timeout: number = 8000) {
        const element = this.resolveLocator(locator);
        await element.waitFor({ state: 'visible', timeout });
        await element.waitFor({ state: 'attached', timeout });
        
        try {
            await element.scrollIntoViewIfNeeded({ timeout: 2000 });
        } catch {}

        await element.fill('');
        await element.fill(value);
    }

    /**
     * 3. Safe Type (Simulates real keyboard keypress delays)
     */
    async safeType(locator: string | Locator, value: string, options: { delay?: number; timeout?: number; clear?: boolean } = {}) {
        const { delay = 10, timeout = 5000, clear = false } = options;
        const element = this.resolveLocator(locator);

        await element.waitFor({ state: 'visible', timeout });
        await element.waitFor({ state: 'attached', timeout });
        
        try {
            await element.scrollIntoViewIfNeeded({ timeout: 2000 });
        } catch {}

        if (clear) {
            await element.click({ clickCount: 3 });
            await this.page.keyboard.press('Backspace');
        }

        // Playwright latest versions me type() ki jagah pressSequentially() standard hai
        await element.pressSequentially(value, { delay });
    }

    /**
     * 4. Safe File Upload
     */
    async uploadFile(inputLocator: string | Locator, filePath: string) {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
        const element = this.resolveLocator(inputLocator);
        
        await element.waitFor({ state: 'attached' });
        await element.setInputFiles(absolutePath);
    }

    /**
     * 5. Universal Dropdown Selector (Aapka custom dynamic logic)
     */
    async selectFromDropdown(
        dropdownLocator: string | Locator, 
        valueToSelect: string | number, 
        options: { by?: 'text' | 'value' | 'index'; useKeyboard?: boolean; timeout?: number; inputSelector?: string } = {}
    ) {
        const { by = 'text', useKeyboard = true, timeout = 30000, inputSelector = 'input' } = options;
        const dropdown = this.resolveLocator(dropdownLocator);

        await dropdown.waitFor({ state: 'visible', timeout });
        try {
            await dropdown.evaluate(el => el.scrollIntoView({ block: 'center' }));
        } catch {}

        const tagName = await dropdown.evaluate(el => el.tagName.toLowerCase());

        // Step 1: Native HTML Select
        if (tagName === 'select') {
            if (by === 'value') await dropdown.selectOption({ value: String(valueToSelect) });
            else if (by === 'index') await dropdown.selectOption({ index: Number(valueToSelect) });
            else await dropdown.selectOption({ label: String(valueToSelect) });
            return;
        }

        // Step 2: Custom ComboBox (React/Angular inputs inside div)
        const input = dropdown.locator(inputSelector);
        if (await input.first().isVisible({ timeout: 2000 }).catch(() => false)) {
            const inputField = input.first();
            await inputField.click({ timeout });
            await inputField.fill(String(valueToSelect), { timeout });

            if (useKeyboard) {
                await inputField.press('Enter', { timeout });
                return;
            }
        }

        // Step 3: Div Based Dropdown
        await dropdown.click({ timeout });
        if (useKeyboard) {
            await this.page.keyboard.type(String(valueToSelect), { delay: 50 });
            await this.page.keyboard.press('Enter');
            return;
        }

        // Step 4: Fallback Mouse Clicks
        const option = this.page.locator(`text="${valueToSelect}"`).first();
        await option.waitFor({ state: 'visible', timeout });
        await option.click();
    }
}