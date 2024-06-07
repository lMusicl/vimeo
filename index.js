const puppeteer = require('puppeteer');

let ErrorsCount = 0;
const generateRandomUA = () => {
    // Array of random user agents
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Vivaldi/6.6.3271.50',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Vivaldi/6.6.3271.50',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Vivaldi/6.6.3271.50',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0',
        'Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0'
    ];
    // Get a random index based on the length of the user agents array
    const randomUAIndex = Math.floor(Math.random() * userAgents.length);
    console.log('Random Agent Selection')
    // Return a random user agent using the index above
    return userAgents[randomUAIndex];
}

async function loginToVimeo(username, password) {
    const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
        // executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        defaultViewport: {
            width:1280,
            height:800
        }});
    console.log("Open browser");
    const page = await browser.newPage();
    console.log("Create new page");

    try {
        const customUA = generateRandomUA();
        console.log("User agent: " + customUA);
        await page.setUserAgent(customUA);
        console.log("Set user agent");
    } catch (e) {
        throw new Error("Error user agent selection");
    }

    try {
        console.log("Attempt to connect to the site Vimeo.com")
        await page.goto('https://vimeo.com/');
        console.log("Visited vimeo.com");
    } catch (e) {
        throw new Error('Couldn\'t connect to the site Vimeo.com');
    }

    // try {
    //     console.log("Waiting for cookies");
    //     await page.locator('#onetrust-accept-btn-handler').wait();
    //     console.log("Accept cookie button visible");
    //     await page.locator('#onetrust-accept-btn-handler').click();
    //     console.log("Click cookie button");
    // } catch (e) {
    //     console.log("Cookies are not confirmed");
    // }

    try {
        console.log("Attempt to connect to the login page")
        await page.goto('https://vimeo.com/log_in/');
        console.log("Visited vimeo login page");
        await page.locator('#email_login').wait();
        console.log("Inputs are visible");
    } catch (e) {
        throw new Error('Couldn\'t connect to the page login');
    }

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
    try {
        await page.goto('https://vimeo.com/manage/folders/5053677');
        console.log('Visited page folder');
    } catch (e) {
        throw new Error("Folder page visit is error");
    }

    try {
        console.log("Waiting video list");
        await page.locator('table tbody tr:first-child').wait();
        console.log("Video list visible");
    } catch (e) {
        await page.locator('#layout-toggle-button').click();
    }

    try {
        console.log("Waiting video list");
        await page.locator('table tbody tr:first-child').wait();
        console.log("Video list visible");
    } catch (e) {
        console.log("Couldn\'t find video list");
    }

    const lastVideo = await page.evaluate(() => {
        const videoElement = document.querySelector('table tbody tr:first-child');
        console.log("Found first video item")
        return {
            title: videoElement.querySelector('table tbody tr:first-child td:nth-child(3) span').innerText,
            // url: videoElement.querySelector('table tbody tr:first-child td:nth-child(2)').getAttribute('href'),
            privacy: videoElement.querySelector('table tbody tr:first-child td:nth-child(4) span').innerText
        };
    });
    console.log("Get video item link, title and privacy")
    if (!lastVideo) {
        throw new Error("Get video item content error")
    } else {
        return lastVideo;
    }
}

async function changePrivacySettings(page, lastVideo, browser) {
    console.log('Privacy function started');
    if (lastVideo.privacy === 'Hide from Vimeo') {
        console.log("The privacy policy settings for this video are correct");
        await browser.close();
        process.exit();
    }

    // await page.goto('https://vimeo.com/manage/videos/' + lastVideo.url);
    await page.locator('table tbody tr:first-child').click();
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
        console.log("Button Hide from Vimeo visible");
    } catch (e) {
        throw new Error("Error loading privacy settings");
    }

    await page.locator('.chakra-radio:nth-child(3)').click();
    console.log("Click Hide from Vimeo button");

    try {
        await page.waitForNavigation();
    } catch (e) {
        console.log('The privacy policy settings for video "' + lastVideo.title + '" have been successfully changed.');
        // await browser.close();
        process.exit();
    }

    console.log('The privacy policy settings for video "' + lastVideo.title + '" have been successfully changed.');
    // await browser.close();
    process.exit();
}

async function main() {
    try {
        var {browser, page} = await loginToVimeo(MY_USERNAME, MY_PASSWORD);
        const lastVideo = await getLastVideo(page);
        console.log("Logged video information");
        console.log('Last video:', lastVideo);
        await changePrivacySettings(page, lastVideo, browser);

    } catch (e) {
        ErrorsCount += 1;
        if (ErrorsCount > 4) {
            console.log(e.message);
            console.log("The number of attempts exceeded");
            process.exit();
        } else {
            console.log("Something went wrong. Let's try again!");
            console.log("Try: " + ErrorsCount);
            // await browser.close();
            await main();
        }
    }
}

main();
