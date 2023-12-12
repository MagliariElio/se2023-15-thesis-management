const dayjs = require("dayjs");
const { Builder, By, Select, Button, until } = require("selenium-webdriver");
const app = require("../../app");
const { doLogin, doLogout } = require("./utils");
const db = require("../../service/db");

/*
 * Template for insert proposal request body,
 * if you need to change some field, just copy with spread operator:
 * const myReqBody = { ...mockProposalReq, title: "new title" };
 */
const mockProposalReq = {
    title: "test",
    supervisor_id: "T002",
    keywords: ["keyword1", "keyword2"],
    type: "Research",
    groups: ["Group A", "Group B"],
    description: "A master thesis just to test the insert API call",
    required_knowledge: "Node.js, PostgreSQL, React.js",
    notes: "These are the notes...",
    expiration_date: "2024-06-30",
    level: "Master",
    programmes: ["Master of Science"],
};
const baseURL = `http://localhost:${process.env.FRONTEND_PORT}`;
let driver;


describe("End to end tests for Search proposals", () => {
    beforeAll(async () => {
        driver = await new Builder().forBrowser("chrome").build();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test("Should show not authorized page if not logged in yet", async () => {
        await driver.get(baseURL + "/proposals");

        await driver.sleep(500);

        let pageTitle = await driver
            .findElement(By.className("alert-danger"))
            .getText();
        expect(pageTitle).toEqual("Access Not Authorized");
    }, 20000);

    test("Should show proposals list", async () => {
        await doLogin("john.smith@example.com", "S001", driver);

        await driver.get(baseURL + "/proposals");

        await driver.sleep(500);
        await driver.findElement(By.className("border-dark"));

        await doLogout(driver);
    }, 20000);

    test("Should show proposals list filtered by description", async () => {
        await doLogin("john.smith@example.com", "S001", driver);

        await driver.get(baseURL + "/proposals");

        await driver.sleep(500);

        let selectElement = await driver.findElement(By.className("form-select"));
        let select = new Select(selectElement);
        await select.selectByValue("description");

        await driver.sleep(500);

        let typeField = await driver.findElement(By.id("inputValue"));
        await typeField.clear();
        await typeField.sendKeys("web");

        let srcButton = driver.findElement(By.className("btn-outline-secondary"));
        await srcButton.click();

        await driver.sleep(500);

        await driver.findElement(By.className("border-dark"));

        await doLogout(driver);
    }, 20000);
});


describe("End to end tests for Proposal details", () => {
    beforeAll(async () => {
        driver = await new Builder().forBrowser("chrome").build();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test("Should show not authorized page if not logged in yet", async () => {
        await driver.get(baseURL + "/proposals/P001");

        await driver.sleep(1000);

        let pageTitle = await driver
            .findElement(By.className("alert-danger"))
            .getText();
        expect(pageTitle).toEqual("Access Not Authorized");
    }, 20000);

    test("Should show Proposal not found", async () => {
        await doLogin("john.smith@example.com", "S001", driver);

        await driver.get(baseURL + "/proposals/ABC0");

        await driver.sleep(500);

        let pageTitle = await driver
            .findElement(By.className("lead"))
            .getText();

        expect(pageTitle).toEqual("The proposal has not been found!");

        await doLogout(driver);
    }, 20000);

    test("Should show Proposal details", async () => {
        await doLogin("john.smith@example.com", "S001", driver);

        await driver.get(baseURL + "/proposals/P001");

        await driver.sleep(500);
        await driver.findElement(By.className("proposal-details-title"));

        await doLogout(driver);
    }, 20000);
});


describe("End to End Tests for Insert Proposal", () => {
    const fillProposalForm = async () => {
        // Title
        await driver.findElement(By.name("title")).sendKeys(mockProposalReq.title);

        // Keywords
        for (const keyword of mockProposalReq.keywords) {
            const keywordField = await driver.findElement(By.name("proposal-keywords"));
            await keywordField.sendKeys(keyword);

            // simulate click with js
            await driver.executeScript(
                "document.getElementById('add-keyword-btn').click()"
            );

            await driver.sleep(200);
            await keywordField.clear();
        }

        // Type
        await driver.findElement(By.name("proposal-type")).sendKeys(mockProposalReq.type);

        // Description
        await driver
            .findElement(By.name("description"))
            .sendKeys(mockProposalReq.description);

        // Required knowledge
        await driver
            .findElement(By.name("required-knowledge"))
            .sendKeys(mockProposalReq.required_knowledge);

        // Notes
        await driver.findElement(By.name("additional-notes")).sendKeys(mockProposalReq.notes);

        // Expiration date
        const date = dayjs(mockProposalReq.expiration_date).format("DD/MM/YYYY");
        await driver.findElement(By.id("expiration-date")).sendKeys(date);

        // Level
        let selectElement = await driver.findElement(By.name("proposal-level"));
        let select = new Select(selectElement);
        await select.selectByValue(mockProposalReq.level);

        // Programmes
        for (const programme of mockProposalReq.programmes) {
            const selectElement = await driver.findElement(By.name("proposal-programmes"));
            const select = new Select(selectElement);
            await select.selectByVisibleText(programme);

            await driver.sleep(200);
        }
    };

    beforeAll(async () => {
        driver = await new Builder().forBrowser("chrome").build();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test("T2.1 - Should show (or redirect to) not authorized page if not logged in yet", async () => {
        await driver.get(baseURL + "/proposals/new");

        const alert = await driver.findElement(By.className("alert"));

        // Find the h3 element within the div
        const h3Alert = await alert.findElement(By.css("h3"));

        const textAlert = await h3Alert.getText();
        expect(textAlert).toEqual("Access Not Authorized");
    }, 20000);

    test("T2.2 - Should not post a new proposal if title is empty", async () => {
        await doLogin("sarah.anderson@example.com", "T001", driver);

        await driver.get(baseURL + "/proposals/new");

        await driver.sleep(500);

        // Fill all fields
        await fillProposalForm();

        // Clear title field
        await driver.findElement(By.name("title")).clear();

        await driver.sleep(500);

        // simulate click with js
        await driver.executeScript(
            "document.getElementById('add-proposal-btn').click()"
        );

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toEqual(baseURL + "/proposals/new"); // expect to not be redirected

        await doLogout(driver);
    }, 20000);

    test("T2.3 - Should insert a new proposal", async () => {
        await doLogin("sarah.anderson@example.com", "T001", driver);

        await driver.get(baseURL + "/proposals/new");

        await driver.sleep(500);

        // Fill all the form fields
        await fillProposalForm();

        await driver.sleep(500);

        // simulate click with js
        await driver.executeScript(
            "document.getElementById('add-proposal-btn').click()"
        );

        const currentUrl = await driver.getCurrentUrl();
        const idRegex = "0(0[1-9]|[1-9][0-9])|[1-9][0-9]{2}[0-9]*";
        expect(currentUrl).toMatch(new RegExp(baseURL + "/proposals/P" + idRegex));

        await doLogout(driver);
    }, 20000);
});


describe("End to end test for professor proposals", () => {
    beforeAll(async () => {
        driver = await new Builder().forBrowser("chrome").build();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test("Should show not authorized page if not logged in yet", async () => {
        await driver.get(baseURL + "/proposals");

        await driver.sleep(500);

        let pageTitle = await driver
            .findElement(By.className("alert-danger"))
            .getText();
        expect(pageTitle).toEqual("Access Not Authorized");
    }, 20000);

    test("Should show the proposals list if logged", async () => {
        await doLogin("michael.wilson@example.com", "T002", driver);

        await driver.get(baseURL + "/proposals");

        await driver.sleep(500);
        await driver.findElement(By.className("bg-white rounded-bottom py-4 container"));

        await doLogout(driver);
    }, 20000);

    test("Should see the details of a proposal", async () => {
        await doLogin("michael.wilson@example.com", "T002", driver);

        await driver.get(baseURL + "/proposals/P002");

        await driver.sleep(500);
        let pageTitle = await driver.findElement(By.className("proposal-details-title")).getAttribute('value');

        expect(pageTitle).toEqual("Machine Learning");

        await doLogout(driver);
    }, 20000);

    test("Should see proposal not found alert", async () => {
        await doLogin("michael.wilson@example.com", "T002", driver);

        await driver.get(baseURL + "/proposals/P0066");

        await driver.sleep(500);

        let alertText = await driver.findElement(By.className("lead")).getText();
        expect(alertText).toEqual("The proposal has not been found!");

        await doLogout(driver);
    }, 20000);

});

describe("End to end test for delete proposal", () => {

    //function to create a fake proposal to delete in the test
    /*const fakeInsert = async() =>{
        const fakeProposalToDelete = {
            title: "test",
            supervisor_id: "T003",
            keywords: ["keyword1", "keyword2"],
            type: "Research",
            groups: ["Group A", "Group B"],
            description: "A master thesis just to test the insert API call",
            required_knowledge: "Node.js, PostgreSQL, React.js",
            notes: "These are the notes...",
            expiration_date: "2024-06-30",
            level: "Master",
            programmes: ["MSC001"],
        };

        const query = `INSERT INTO proposals
        (proposal_id, title, supervisor_id, keywords, type,
        groups, description, required_knowledge, notes,
        expiration_date, level, programmes, archived, deleted)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *;`

        await db.query(query, ['P100', fakeProposalToDelete.title, fakeProposalToDelete.supervisor_id,
            fakeProposalToDelete.keywords, fakeProposalToDelete.type, fakeProposalToDelete.groups,
            fakeProposalToDelete.description, fakeProposalToDelete.required_knowledge, fakeProposalToDelete.notes,
            fakeProposalToDelete.expiration_date, fakeProposalToDelete.level, fakeProposalToDelete.programmes,
            false, false
        ]);

        await driver.sleep(500);

    };*/

    beforeAll(async () => {
        driver = await new Builder().forBrowser("chrome").build();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test("Should show not authorized page if not logged in yet", async () => {
        await driver.get(baseURL + "/proposals/P019");

        await driver.sleep(500);

        let pageTitle = await driver
            .findElement(By.className("alert-danger"))
            .getText();
        expect(pageTitle).toEqual("Access Not Authorized");

    }, 20000);

    test("Shouldn't show the delete button if logged as a student", async() => {
        await doLogin("john.smith@example.com", "S001", driver);

        await driver.sleep(500);

        await driver.get(baseURL + "/proposals/P019");

        await driver.sleep(1000);

        let button = await driver.findElement(By.css('#apply-button')).getText();

        expect(button).toEqual("Apply");

        await doLogout(driver);

        
    }, 20000);

    test("Shouldn't delete the proposal if cancel the action", async() =>{
        await doLogin("ana.gomez@example.com", "T003", driver);

        await driver.sleep(500);

        await driver.get(baseURL + "/proposals/P019");
        await driver.sleep(500);

        const deleteButton = await driver.findElement(By.css('#delete-proposal-btn'));
        

        expect(await deleteButton.getText()).toEqual("Delete proposal");
        

        await driver.executeScript(
            "arguments[0].removeAttribute('disabled')",
            deleteButton
        );

        await driver.executeScript(
            "document.getElementById('delete-proposal-btn').click()"
        );

        await driver.sleep(500);

        let cancelButton = await driver.findElement(By.css('#cancel-delete-proposal'));
        await driver.sleep(500);

        expect(await cancelButton.getText()).toEqual('Cancel');

        await driver.executeScript(
            "document.getElementById('cancel-delete-proposal').click()"
        );

        const currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toEqual(baseURL + "/proposals/P019"); // expect to not be redirected

        await doLogout(driver);
    
    }, 20000);

    test("Should delete the proposal", async ()=>{

        //await fakeInsert();

        await doLogin("ana.gomez@example.com", "T003", driver);

        await driver.sleep(500);

        await driver.get(baseURL + "/proposals/P019");
        await driver.sleep(500);

        const deleteButton = await driver.findElement(By.css('#delete-proposal-btn'));
        

        expect(await deleteButton.getText()).toEqual("Delete proposal");
        

        await driver.executeScript(
            "arguments[0].removeAttribute('disabled')",
            deleteButton
        );

        await driver.executeScript(
            "document.getElementById('delete-proposal-btn').click()"
        );

        await driver.sleep(500);

        let confirmButton = await driver.findElement(By.css('#confirm-delete-proposal'));
        await driver.sleep(500);

        expect(await confirmButton.getText()).toEqual('Confirm');

        await driver.executeScript(
            "document.getElementById('confirm-delete-proposal').click()"
        );

        await driver.sleep(500);

        const currentUrl = await driver.getCurrentUrl();

        await driver.sleep(500);
        expect(currentUrl).toEqual(baseURL + "/proposals"); // expect to be redirected
    
        await doLogout(driver);

    }, 20000);


})
