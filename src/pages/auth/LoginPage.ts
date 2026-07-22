import { BasePage } from "@pages/base/BasePage";
import {type Page, type Locator, expect} from "@playwright/test"

export class LoginPage extends BasePage{
    readonly username: Locator;
    readonly password: Locator;
    readonly loginbtn : Locator;

    constructor(page: Page){
        super(page);
        this.username = page.locator("#username");
        this.password = page.locator("#password");
        this.loginbtn = page.locator("#submit");
    }

    async goto(){
        this.page.goto("https://practicetestautomation.com/practice-test-login/");
        this.page.waitForLoadState('domcontentloaded')
    };

    async performLogin(username: string, password: string){
        await this.safeFill(this.username, username);
        await this.safeFill(this.password, password);
        await this.safeClick(this.loginbtn);
    }

    
}