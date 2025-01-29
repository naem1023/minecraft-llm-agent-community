const fs = require('fs');
const path = require('path');

/**
 * Control primitives를 로드하는 함수
 * @param {string[]} [primitiveNames=null] - 로드할 특정 primitive 파일명들. 없으면 전체 로드
 * @returns {Promise<string[]>} primitive 스크립트들의 내용을 담은 배열
 */
function loadControlPrimitives() {
    return new Map();
}

module.exports = {
    loadControlPrimitives
};
