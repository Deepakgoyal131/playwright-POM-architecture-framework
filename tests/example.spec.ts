// import { test, expect } from '@playwright/test';
import {test, expect} from '@fixtures/baseTest'

test.describe("First Test Suite", ()=>{
  test("Verify Login Functionality", async ({page, loginPage})=>{
    await loginPage.goto();
    await loginPage.goto();
    await loginPage.performLogin("student", "Password123");
    expect(page.locator("p[class='has-text-align-center wp-block-paragraph'] strong")).toHaveText("Congratulations student. You successfully logged in!")
  })
})