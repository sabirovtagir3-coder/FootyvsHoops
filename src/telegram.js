export function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation?.();
      if (tg.setHeaderColor) tg.setHeaderColor('#0b0e14');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#0b0e14');
    } catch (e) {
      console.warn("Telegram WebApp init warning", e);
    }
  }
}