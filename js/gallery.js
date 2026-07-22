/**
 * GalleryData
 * In-memory store for captures. Swap with fetch() / IndexedDB as needed.
 */
export const GalleryData = (() => {
  const _store = [];

  function clear() {
    _store.length = 0;
  }

  function add(dataUrl, timestamp = Date.now(), label = null) {
    const entry = {
      id: `c${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dataUrl,
      timestamp,
      label,
    };
    _store.unshift(entry);
    return entry;
  }

  function getAll() {
    return _store;
  }

  function groupByDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    const map = new Map();

    _store.forEach((c) => {
      const d = new Date(c.timestamp);
      d.setHours(0, 0, 0, 0);
      let key;
      if (d.getTime() === today.getTime()) {
        key = "Today";
      } else if (d.getTime() === yest.getTime()) {
        key = "Yesterday";
      } else {
        key = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    });
    return map;
  }

  return { add, getAll, groupByDay, clear };
})();

window.GalleryData = GalleryData;


window.GalleryData = GalleryData;
