import { exec } from 'child_process';
import path from 'path';
import os from 'os';

/**
 * Cross-Platform, Zero-Dependency Native Desktop Notification Dispatcher
 * Replaces heavy 3rd party notification libraries with native OS APIs:
 * - Windows: Windows Runtime Toast via PowerShell
 * - macOS: AppleScript osascript
 * - Linux: notify-send
 */
export function sendNotification({ title = 'REMI: Project Memory', message, icon }) {
  const cleanTitle = (title || 'REMI').replace(/["`$\\]/g, '');
  const cleanMessage = (message || '').replace(/["`$\\]/g, '');

  if (process.platform === 'win32') {
    const iconXml = icon ? `<image placement="appLogoOverride" src="${icon}" />` : '';
    const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$template = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            ${iconXml}
            <text>${cleanTitle}</text>
            <text>${cleanMessage}</text>
        </binding>
    </visual>
</toast>
"@
$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Zaarvy REMI").Show($toast)
`;

    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, () => {});

  } else if (process.platform === 'darwin') {
    const osascript = `display notification "${cleanMessage}" with title "${cleanTitle}"`;
    exec(`osascript -e '${osascript}'`, () => {});

  } else {
    // Linux
    const iconFlag = icon ? `-i "${icon}"` : '';
    exec(`notify-send ${iconFlag} "${cleanTitle}" "${cleanMessage}"`, () => {});
  }
}
