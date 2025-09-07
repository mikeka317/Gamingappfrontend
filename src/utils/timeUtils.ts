export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (seconds > 30) {
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

export const isRecentlyActive = (timestamp: number, thresholdMinutes: number = 5): boolean => {
  const now = Date.now();
  const diff = now - timestamp;
  const thresholdMs = thresholdMinutes * 60 * 1000;
  
  return diff < thresholdMs;
};
