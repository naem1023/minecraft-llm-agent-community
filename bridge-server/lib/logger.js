const winston = require("winston");

// Winston 로거 설정
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
    ),
    transports: [
        // 파일에 로그 저장
        new winston.transports.File({
            filename: "error.log",
            level: "error",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
            ),
        }),
        new winston.transports.File({
            filename: "combined.log",
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
            ),
        }),
        // 콘솔 출력
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp(),
                winston.format.printf(
                    (info) =>
                        `[${info.timestamp}] [${info.level}]: ${info.message}`,
                ),
            ),
        }),
    ],
});

// 로깅 유틸리티 함수
function logInfo(message, meta = {}) {
    logger.info(message, meta);
}

function logError(message, error = null) {
    if (error) {
        logger.error(message, {
            error: error.message,
            stack: error.stack,
        });
    } else {
        logger.error(message);
    }
}

module.exports = {
    logger,
    logInfo,
    logError,
};
