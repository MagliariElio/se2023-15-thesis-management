const request = require("supertest");
const app = require("../../app");
const { Builder, By, Select } = require("selenium-webdriver");
const { doLogin, doLogout } = require("./utils");

const baseURL = `http://localhost:${process.env.FRONTEND_PORT}`;

let driver;

beforeAll(async () => {
  driver = await new Builder().forBrowser("chrome").build();
});

afterAll(async () => {
  await driver.quit();
});

describe("End to end tests for insert thesis request", () => {
  it("Should insert a new thesis request", async () => {
    await doLogin("john.smith@example.com", "S001", driver);

    await driver.get(baseURL + "/proposals/requests/new");

    await driver.sleep(1000);

    await driver.findElement(By.name("title")).sendKeys("New thesis request");

    await driver.findElement(By.name("description")).sendKeys("This is the description");

    let selectElement = await driver.findElement(By.name("supervisor"));
    let select = new Select(selectElement);
    await select.selectByValue("T001");

    await driver.sleep(500);

    // simulate click with js
    await driver.executeScript("document.getElementById('add-request-btn').click()");

    await driver.sleep(1000);

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toEqual(baseURL + "/");

    await doLogout(driver);
  }, 20000);
});
