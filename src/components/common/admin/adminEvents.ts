export const dispatchAdminEvent = (eventName: string) => {
  window.dispatchEvent(new Event(eventName));
};
