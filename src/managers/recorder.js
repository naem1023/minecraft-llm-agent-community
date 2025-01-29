class Recorder {
    constructor() {
        this.records = [];
        this.currentTask = null;
    }

    record(event, task) {
        this.records.push({
            event: event,
            task: task,
            timestamp: Date.now()
        });
        this.currentTask = task;
    }

    getRecords() {
        return this.records;
    }

    getCurrentTask() {
        return this.currentTask;
    }

    clear() {
        this.records = [];
        this.currentTask = null;
    }
}

module.exports = { Recorder };
  