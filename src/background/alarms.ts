export const RETRY_IMPORTS_ALARM = "deadline-guard.retry-imports";

export async function registerExtensionAlarms() {
  await chrome.alarms.create(RETRY_IMPORTS_ALARM, {
    periodInMinutes: 1
  });

  return RETRY_IMPORTS_ALARM;
}
