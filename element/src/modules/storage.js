let storage = {
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get(key) {
    return JSON.parse(localStorage.getItem(key));
  },
  clear(key) {
    if (key === undefined) {
      localStorage.clear();
    } else {
      localStorage.removeItem(key);
    }
  }

};
export default storage;


