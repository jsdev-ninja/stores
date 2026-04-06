#!/usr/bin/env node

/**
 * StoreBrix TikTok Upload Script
 * Uploads storebrix_tiktok_launch.mp4 to TikTok Studio and publishes it.
 *
 * Usage:
 *   cd "storebrix marketing and campain manager"
 *   npx puppeteer browsers install chrome
 *   node upload_tiktok.mjs
 *
 * Or if you want to use your existing Chrome (must close Chrome first):
 *   node upload_tiktok.mjs --use-chrome
 */

import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIDEO_PATH = path.join(__dirname, 'storebrix_tiktok_launch.mp4');
const CAPTION = `StoreBrix is now LIVE 🚀 Build your online store in minutes. No code. No hassle. Try for free at storebrix.com`;
const HASHTAGS = `#StoreBrix #BuildYourEmpire #Ecommerce #SmallBusiness #OnlineStore #Entrepreneur`;

const useChrome = process.argv.includes('--use-chrome');

async function main() {
  console.log('🚀 Starting TikTok upload for StoreBrix...');
  console.log(`📹 Video: ${VIDEO_PATH}`);

  const launchOptions = {
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  };

  if (useChrome) {
    // Use existing Chrome with user profile (Chrome must be closed first)
    launchOptions.executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    launchOptions.userDataDir = path.join(process.env.HOME, 'Library/Application Support/Google/Chrome');
    console.log('🔑 Using your Chrome profile (you should be logged into TikTok)');
  } else {
    console.log('⚠️  Using bundled Chromium - you may need to log into TikTok manually');
    console.log('💡 Tip: Run with --use-chrome to use your Chrome profile (close Chrome first)');
  }

  const browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();

  try {
    // Navigate to TikTok Studio upload page
    console.log('📱 Navigating to TikTok Studio...');
    await page.goto('https://www.tiktok.com/tiktokstudio/upload', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for user to log in if needed
    const isLoginPage = await page.evaluate(() => {
      return document.querySelector('[class*="login"]') !== null ||
             window.location.href.includes('login');
    });

    if (isLoginPage && !useChrome) {
      console.log('\n🔐 Please log into TikTok in the browser window...');
      console.log('   Waiting for you to complete login...\n');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 300000 });
      // Navigate to upload page after login
      await page.goto('https://www.tiktok.com/tiktokstudio/upload', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
    }

    // Wait for the upload area to appear
    console.log('⏳ Waiting for upload area...');
    await page.waitForSelector('input[type="file"]', { timeout: 30000 }).catch(() => null);

    // Find the file input (may be hidden)
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      // Try to find it in shadow DOM or iframes
      const inputs = await page.$$('input');
      for (const input of inputs) {
        const type = await input.evaluate(el => el.type);
        if (type === 'file') {
          await input.uploadFile(VIDEO_PATH);
          console.log('✅ Video file selected!');
          break;
        }
      }
    } else {
      await fileInput.uploadFile(VIDEO_PATH);
      console.log('✅ Video file selected!');
    }

    // Wait for upload to process
    console.log('⏳ Waiting for video to upload and process...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Try to find and fill the caption/description field
    console.log('✍️  Adding caption...');

    // TikTok Studio uses a contenteditable div for the caption
    const captionSelectors = [
      '[contenteditable="true"]',
      '[data-placeholder*="caption"]',
      '[data-placeholder*="description"]',
      '.public-DraftEditor-content',
      '[role="textbox"]',
      'textarea',
    ];

    let captionField = null;
    for (const selector of captionSelectors) {
      captionField = await page.$(selector);
      if (captionField) {
        console.log(`   Found caption field: ${selector}`);
        break;
      }
    }

    if (captionField) {
      await captionField.click();
      await captionField.type(`${CAPTION} ${HASHTAGS}`, { delay: 30 });
      console.log('✅ Caption added!');
    } else {
      console.log('⚠️  Could not find caption field. Please add caption manually:');
      console.log(`   ${CAPTION} ${HASHTAGS}`);
    }

    // Wait a bit for everything to settle
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Look for the Post/Publish button
    console.log('🔍 Looking for Post button...');
    const postButtonSelectors = [
      'button:has-text("Post")',
      'button:has-text("Publish")',
      '[data-e2e="post-button"]',
    ];

    // Use evaluate to find the post button by text content
    const posted = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent.trim().toLowerCase();
        if (text === 'post' || text === 'publish') {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (posted) {
      console.log('✅ Post button clicked!');
      console.log('\n🎉 StoreBrix TikTok post is being published!');
    } else {
      console.log('⚠️  Could not find Post button automatically.');
      console.log('   Please click the Post/Publish button manually in the browser.');
    }

    // Keep browser open for a bit to see the result
    console.log('\n📌 Browser will stay open for 30 seconds so you can verify...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📌 Browser is staying open. You can complete the upload manually.');
    await new Promise(resolve => setTimeout(resolve, 120000));
  } finally {
    await browser.close();
    console.log('👋 Done!');
  }
}

main().catch(console.error);
