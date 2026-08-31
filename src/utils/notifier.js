import { exec } from 'child_process';
import path from 'path';
import os from 'os';

/**
 * Cross-Platform, Zero-Dependency Native Desktop Notification Dispatcher
 * - Windows: Windows Runtime Toast via PowerShell with sound & AppId
 * - macOS: AppleScript osascript
 * - Linux: notify-send
 */
export function sendNotification({ title = 'REMI: Project Memory', message, icon }) {
  const cleanTitle = (title || 'REMI').replace(/["`$\\]/g, '');
  const cleanMessage = (message || '').replace(/["`$\\]/g, '');

  if (process.platform === 'win32') {
    const iconXml = icon ? `<image placement="appLogoOverride" src="${icon.replace(/\\/g, '/')}" />` : '';
    const psScript = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$template = @"
<toast duration="short">
    <visual>
        <binding template="ToastGeneric">
            ${iconXml}
            <text>${cleanTitle}</text>
            <text>${cleanMessage}</text>
        </binding>
    </visual>
    <audio src="ms-winsoundevent:Notification.Default" />
</toast>
"@
$xml.LoadXml($template)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
$appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\\WindowsPowerShell\\v1.0\\powershell.exe'
try {
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId).Show($toast)
} catch {
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier().Show($toast)
}
`;

    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${encoded}`, (err, stdout, stderr) => {
      if (err) {
        // Fallback to legacy Windows forms balloon tooltip if WinRT is disabled on older systems
        const fallbackScript = `
[void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
$objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon
$objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information
$objNotifyIcon.BalloonTipIcon = "Info"
$objNotifyIcon.BalloonTipText = "${cleanMessage}"
$objNotifyIcon.BalloonTipTitle = "${cleanTitle}"
$objNotifyIcon.Visible = $True
$objNotifyIcon.ShowBalloonTip(10000)
`;
        const fbEncoded = Buffer.from(fallbackScript, 'utf16le').toString('base64');
        exec(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${fbEncoded}`);
      }
    });

  } else if (process.platform === 'darwin') {
    const osascript = `display notification "${cleanMessage}" with title "${cleanTitle}"`;
    exec(`osascript -e '${osascript}'`, () => {});

  } else {
    // Linux
    const iconFlag = icon ? `-i "${icon}"` : '';
    exec(`notify-send ${iconFlag} "${cleanTitle}" "${cleanMessage}"`, () => {});
  }
}
