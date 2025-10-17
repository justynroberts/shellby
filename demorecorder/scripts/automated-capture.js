/**
 * Automated Screenshot & Video Capture for Electron Apps
 * Uses Electron's native screenshot API to capture app states
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Configuration
// Find project root (where package.json is)
const projectRoot = process.cwd();

const CONFIG = {
  outputDir: path.join(projectRoot, 'docs', 'screenshots'),
  distPath: path.join(projectRoot, 'dist', 'renderer', 'index.html'),
  preloadPath: path.join(projectRoot, 'dist', 'preload', 'index.js'),
  windowWidth: 1440,
  windowHeight: 900,
  delay: 3000, // Wait 3s for UI to settle
  videoEnabled: false, // Set to true to enable screen recording
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

// Wait helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Save screenshot
async function saveScreenshot(window, filename, description) {
  await wait(CONFIG.delay);

  try {
    const image = await window.webContents.capturePage();
    const filepath = path.join(CONFIG.outputDir, filename);
    fs.writeFileSync(filepath, image.toPNG());
    console.log(`✅ Captured: ${filename} - ${description}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to capture ${filename}:`, error.message);
    return false;
  }
}

// Click element helper
async function clickElement(window, selector) {
  try {
    await window.webContents.executeJavaScript(`
      (function() {
        const element = document.querySelector('${selector}');
        if (element) {
          element.click();
          return true;
        }
        return false;
      })();
    `);
    await wait(1000);
    return true;
  } catch (error) {
    console.error(`Failed to click ${selector}:`, error.message);
    return false;
  }
}

// Type text helper
async function typeText(window, selector, text) {
  try {
    await window.webContents.executeJavaScript(`
      (function() {
        const element = document.querySelector('${selector}');
        if (element) {
          element.value = '${text}';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      })();
    `);
    await wait(500);
    return true;
  } catch (error) {
    console.error(`Failed to type in ${selector}:`, error.message);
    return false;
  }
}

// Navigate to tab
async function navigateToTab(window, tabName) {
  // Look for tabs with role="tab" and specific text
  await window.webContents.executeJavaScript(`
    (function() {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
      const targetTab = tabs.find(tab =>
        tab.textContent.toLowerCase().includes('${tabName.toLowerCase()}')
      );
      if (targetTab) {
        targetTab.click();
        return true;
      }
      return false;
    })();
  `);
  await wait(1500);
}

// Main automation sequence
async function captureAllScreenshots(window) {
  console.log('\n🎬 Starting automated capture...\n');

  // Wait for app to fully load
  await wait(5000);

  // Screenshot 1: Main interface (initial state)
  console.log('📸 1/7: Capturing main interface...');
  await saveScreenshot(
    window,
    'screenshot-terminal-main.png',
    'Main terminal interface'
  );

  // Screenshot 2: File Manager
  console.log('📸 2/7: Navigating to File Manager...');
  await navigateToTab(window, 'file');
  await saveScreenshot(
    window,
    'screenshot-file-manager.png',
    'File Manager dual-pane view'
  );

  // Screenshot 3: Clipboard
  console.log('📸 3/7: Navigating to Clipboard...');
  await navigateToTab(window, 'clipboard');
  await saveScreenshot(
    window,
    'screenshot-clipboard.png',
    'Clipboard history manager'
  );

  // Screenshot 4: Snippets
  console.log('📸 4/7: Navigating to Snippets...');
  await navigateToTab(window, 'snippet');
  await saveScreenshot(
    window,
    'screenshot-snippets.png',
    'Command snippets library'
  );

  // Screenshot 5: AI Assistant
  console.log('📸 5/7: Navigating to AI Assistant...');
  await navigateToTab(window, 'ai');
  await saveScreenshot(
    window,
    'screenshot-ai-assistant.png',
    'AI Assistant interface'
  );

  // Screenshot 6: Back to Terminal, open Settings
  console.log('📸 6/7: Opening Terminal Settings...');
  await navigateToTab(window, 'terminal');

  // Try to click settings button
  await window.webContents.executeJavaScript(`
    (function() {
      const settingsButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const settingsBtn = settingsButtons.find(btn =>
        btn.getAttribute('title')?.toLowerCase().includes('settings') ||
        btn.getAttribute('aria-label')?.toLowerCase().includes('settings')
      );
      if (settingsBtn) {
        settingsBtn.click();
        return true;
      }
      return false;
    })();
  `);

  await wait(1500);
  await saveScreenshot(
    window,
    'screenshot-themes.png',
    'Terminal settings and themes'
  );

  // Screenshot 7: Connections dialog
  console.log('📸 7/7: Opening New Connection dialog...');
  await window.webContents.executeJavaScript(`
    (function() {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newConnBtn = buttons.find(btn =>
        btn.textContent.includes('New Connection') ||
        btn.textContent.includes('+')
      );
      if (newConnBtn) {
        newConnBtn.click();
        return true;
      }
      return false;
    })();
  `);

  await wait(1500);
  await saveScreenshot(
    window,
    'screenshot-connections.png',
    'New connection dialog'
  );

  console.log('\n✅ Screenshot capture complete!');
  console.log(`📁 Screenshots saved to: ${CONFIG.outputDir}`);
  console.log('\n📋 Next steps:');
  console.log('   1. Review screenshots in docs/screenshots/');
  console.log('   2. Optimize: npm run optimize-screenshots');
  console.log('   3. Update README.md');
  console.log('   4. Commit to git\n');
}

// Electron app initialization
app.whenReady().then(async () => {
  console.log('🚀 Shellby Automated Capture Tool');
  console.log('==================================\n');

  // Create window
  const mainWindow = new BrowserWindow({
    width: CONFIG.windowWidth,
    height: CONFIG.windowHeight,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: CONFIG.preloadPath,
    },
  });

  // Load the app
  console.log(`Loading app from: ${CONFIG.distPath}`);
  await mainWindow.loadFile(CONFIG.distPath);

  console.log('⏳ App loaded, waiting for initialization...\n');

  // Run capture sequence
  try {
    await captureAllScreenshots(mainWindow);

    // Wait a bit before closing
    await wait(2000);

    app.quit();
  } catch (error) {
    console.error('❌ Error during capture:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
