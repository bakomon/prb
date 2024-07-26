import { notice, slugify } from './general.js'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
const __dirname = import.meta.dirname;

import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const startSession = ({ args = [], headless = 'auto', customConfig = {}, proxy = {} }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const localExecutablePath = process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                : process.platform === "linux" ? "/usr/bin/google-chrome"
                : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            const remoteExecutablePath = "https://github.com/Sparticuz/chromium/releases/download/v126.0.0/chromium-v126.0.0-pack.tar"
            const isDev = process.env.NODE_ENV === "development"

            var chromePath = customConfig.executablePath || customConfig.chromePath || (isDev
                ? localExecutablePath
                : await chromium.executablePath(remoteExecutablePath))

            if (slugify(process.platform).includes('linux') && headless === false) {
                notice({
                    message: 'This library is stable with headless: true in linuxt environment and headless: false in Windows environment. Please send headless: \'auto\' for the library to work efficiently.',
                    type: 'error'
                })
            } else if (slugify(process.platform).includes('win') && headless === true) {
                notice({
                    message: 'This library is stable with headless: true in linuxt environment and headless: false in Windows environment. Please send headless: \'auto\' for the library to work efficiently.',
                    type: 'error'
                })
            }

            if (headless === 'auto') {
                headless = slugify(process.platform).includes('linux') ? true : false
            }

            let chromeFlags = chromium.args
            if (isDev) {
                chromeFlags = chromeFlags.filter(item => !item.includes('--headless=') && !item.includes('--single-') && !item.includes('site-isolation-trial'))
            }
            chromeFlags = chromeFlags.concat(['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1920,1080', ...args])

            if (headless === true) {
                slugify(process.platform).includes('win') ? chromeFlags.push('--headless=new') : ''
            }

            if (proxy && proxy.host && proxy.host.length > 0) {
                chromeFlags.push(`--proxy-server=${proxy.host}:${proxy.port}`);
            }

            let dirPath = __dirname
            if (!dirPath || dirPath.length === 0) {
                const __filename = fileURLToPath(import.meta.url);
                dirPath = dirname(__filename);
            }
            const EXTENSION_PATH = `${dirPath}/extension/`;
            chromeFlags.push(`--disable-extensions-except=${EXTENSION_PATH}`)
            chromeFlags.push(`--load-extension=${EXTENSION_PATH}`)

            const browser = await puppeteer.launch({
                headless: false, // Since it is in the testing phase, headless fixed is used and will be updated with the incoming value in the future.
                executablePath: chromePath,
                args: chromeFlags,
                ...customConfig
            })
           
            return resolve({
                browser
            })

        } catch (err) {
            console.log(err);
            throw new Error(err.message)
        }
    })
}

