class EventManager {
    constructor() {
        this.events = [];
        this.currentIndex = 0;
    }

    addEvent(event) {
        this.events.push(event);
    }

    getCurrentEvent() {
        return this.events[this.currentIndex];
    }

    reset() {
        this.events = [];
        this.currentIndex = 0;
    }

    // 이벤트 히스토리 조회
    getHistory() {
        return this.events;
    }

    // 필요에 따라 이벤트 트래킹 로직 추가
}

module.exports = { EventManager };
  