const puppeteer = require('puppeteer');

async function loginToVimeo(username, password) {
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox']});
    console.log("Open browser");


    const page = await browser.newPage();
    console.log("Create new page");

    try {
        console.log("Attempt to connect to the site Vimeo.com")
        await page.goto('https://vimeo.com/');
        console.log("Visited vimeo.com");
    } catch (e) {
        throw new Error('Couldn\'t connect to the site Vimeo.com');
    }

    try {
        console.log("Waiting for cookies");
        await page.locator('#onetrust-accept-btn-handler').wait();
        console.log("Accept cookie button visible");
        await page.locator('#onetrust-accept-btn-handler').click();
        console.log("Click cookie button");
    } catch (e) {
        console.log("Cookies are not confirmed");
    }

    try {
        console.log("Attempt to connect to the login page")
        await page.goto('https://vimeo.com/log_in/');
        await page.waitForNavigation();
        console.log("Visited vimeo login page");
    } catch (e) {
        throw new Error('Couldn\'t connect to the page login');
    }

    await page.locator('#email_login').wait();
    console.log("Inputs are visible");
    await page.locator('#email_login').fill(username);
    console.log("Input email");
    await page.locator('#password_login').fill(password);
    console.log("Input password");
    try {
        console.log("Authorization attempt")
        await page.locator('#__next > div.naniiu-0.hidfuh > div > div.sc-1hmcdc6-0.biAalf.f2pJoinLoginScreen > div > section > section:nth-child(5) > form > section:nth-child(4) > button').click();
        console.log("Waiting login access")
        await page.waitForNavigation();
        console.log("Login successfully");
    } catch (e) {
        throw new Error("Error logging in!")
    }
    return {browser, page};
}


async function getLastVideo(page) {
    await page.goto('https://vimeo.com/manage/folders/5053677');
    console.log('Visited page folder');
    console.log("Waiting video list");
    await page.locator('.video_manager__table_item:first-child').wait();
    console.log("Video list visible");
    const lastVideo = await page.evaluate(() => {
        const videoElement = document.querySelector('.video_manager__table_item:first-child');
        console.log("Found first video item")
        return {
            title: videoElement.querySelector('.table_cell__title_wrapper > a').innerText,
            url: videoElement.querySelector('.table_cell__thumb-wrapper a').getAttribute('href'),
            privacy: videoElement.querySelector('.video_manager__table_cell--privacy').innerText
        };
    });
    console.log("Get video item link and title")
    return lastVideo;
}

async function changePrivacySettings(page, lastVideo) {
    console.log('Privacy function started');
    if (lastVideo.privacy === 'Hidden') {
        console.log("The privacy policy settings for this video are correct");
        return false;
    }
    await page.goto('https://vimeo.com/manage/videos/' + lastVideo.url);
    console.log('Visited video setting page');
    await page.waitForNavigation();

    try {
        await page.locator('#privacy-status-button').wait();
        console.log("The video settings page is loaded");
    } catch (e) {
        await page.reload();
        await page.waitForNavigation();
    }

    try {
        await page.locator('#privacy-status-button').wait();
        console.log("Policy button visible");
    } catch (e) {
        throw new Error("Error loading the settings page");
    }

    await page.locator('#privacy-status-button').click();
    console.log("Click Policy button");

    try {
        await page.locator('#privacy-link-option-disable').wait();
        console.log("Wait Hide from Vimeo visible");
    } catch (e) {
        throw new Error("Error loading privacy settings");
    }

    await page.locator('#privacy-link-option-disable').click();
    console.log("Click Hide from Vimeo button");

    await page.waitForNavigation();
    console.log('The privacy policy settings for video "' + lastVideo.title + '" have been successfully changed.');
    return false;
}

async function main() {
    try {
        const {browser, page} = await loginToVimeo(process.env.MY_USERNAME, process.env.MY_PASSWORD);
        const lastVideo = await getLastVideo(page);
        console.log('Last video:', lastVideo);
        console.log("Logged video information")
        await changePrivacySettings(page, lastVideo);
        await browser.close();
    } catch (e) {
        console.log("Something went wrong. Let's try again!")
        await main();
    }
}

main();
