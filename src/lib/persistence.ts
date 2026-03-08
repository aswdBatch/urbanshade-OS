// Persistence system for saving application state
export const saveState = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(`urbanshade_${key}`, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

export const loadState = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(`urbanshade_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error('Failed to load state:', error);
    return defaultValue;
  }
};

export const clearState = (key: string) => {
  try {
    localStorage.removeItem(`urbanshade_${key}`);
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
};
