import {test as baseTest, expect} from "@playwright/test"
import { LoginPage } from "@pages/auth/LoginPage"

type Myfixture = {
    loginPage : LoginPage
}

export const test = baseTest.extend<Myfixture>({
    loginPage: async ({page}, use) => {
        await use(new LoginPage(page))
    }
})

export {expect};

