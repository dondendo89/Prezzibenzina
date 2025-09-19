import { useI18n } from '@/lib/i18n';

export default function Notifiche() {
  const { t } = useI18n();
  async function enable() {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return alert('Permesso negato');
    const reg = await navigator.serviceWorker.ready;
    const vapidPublicKey = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
    const key = vapidPublicKey ? urlBase64ToUint8Array(vapidPublicKey) : undefined;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    await fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subscription: sub }) });
    alert('Notifiche abilitate');
  }
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  return (
    <div style={{ padding: 16 }}>
      <h1>{t('notifications')}</h1>
      <p>{t('notifications_desc')}</p>
      <button onClick={enable}>{t('enable_notifications')}</button>
    </div>
  );
}


