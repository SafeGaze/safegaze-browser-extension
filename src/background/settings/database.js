class SafeGazeDB {
  db;
  openRequest;
  version = 1;

  constructor({ dbName, version, tableName, settingsKey }) {
    if (!dbName && !tableName && !settingsKey) {
      return;
    }
    this.version = version;
    this.dbName = dbName;
    this.tableName = tableName;
    this.settingsKey = settingsKey;

    this.#createDatabase();
    this.#upgradeNeeded();
    this.#success();
  }

  #createDatabase() {
    this.openRequest = indexedDB.open(this.dbName, this.version);
  }

  #upgradeNeeded() {
    this.openRequest.onupgradeneeded = (e) => {
      this.db = e.target.result;

      this.db.createObjectStore(this.tableName, {
        keyPath: this.settingsKey,
      });
    };
  }

  #success() {
    this.openRequest.onsuccess = (e) => {
      this.db = e.target.result;
    };
  }

  addItem(value) {
    const tx = this.db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    store.put(value);
  }

  get(key, cb) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.tableName, "readonly");
      const store = tx.objectStore(this.tableName);
      const get = store.get(key);
      get.onsuccess = (e) => {
        resolve(get.result);
      };
    });
  }
}

const safeGazeSettings = new SafeGazeDB({
  dbName: "safeGaze",
  version: 1,
  tableName: "settings",
  settingsKey: "settings",
});

export default safeGazeSettings;
