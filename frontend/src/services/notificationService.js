import { notificationAPI } from './capsuleService';

export async function fetchNotifications(){
  try {
    const res = await notificationAPI.list();
    return res.data?.notifications || [];
  } catch (err) {
    console.error('fetchNotifications error', err);
    return [];
  }
}

export async function markAsRead(id){
  try {
    await notificationAPI.markRead(id);
    return true;
  } catch (err) {
    console.error('markAsRead error', err);
    return false;
  }
}

export function startPollingNotifications(callback, interval = 30000){
  let stopped = false;
  const run = async () => {
    if (stopped) return;
    try {
      const list = await fetchNotifications();
      callback(list);
    } catch (err) {
      console.error('Polling notifications error', err);
    }
  };
  run();
  const id = setInterval(run, interval);
  return () => { stopped = true; clearInterval(id); };
}
