const logLevels = ["debug", "info", "warn", "error", "none"] as const;
export type LogLevel = (typeof logLevels)[number];

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = "none") {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  coerceLevel(level: string): LogLevel {
    if (logLevels.includes(level.toLocaleLowerCase() as LogLevel)) {
      return level as LogLevel;
    }
    return "info";
  }

  log(level: string, message: string, ...args: unknown[]) {
    const logLevel = this.coerceLevel(level);
    if (!this.shouldLog(logLevel)) {
      return;
    }
    const consoleFn = console[logLevel];
    consoleFn(`[${logLevel.toUpperCase()}] ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]) {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: unknown[]) {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]) {
    this.log("error", message, ...args);
  }

  private shouldLog(
    messageLevel: LogLevel
  ): messageLevel is Exclude<LogLevel, "none"> {
    const levels: LogLevel[] = ["debug", "info", "warn", "error", "none"];
    const messageLevelIndex = levels.indexOf(messageLevel);
    const currentLevelIndex = levels.indexOf(this.level);
    return (
      currentLevelIndex <= messageLevelIndex &&
      this.level !== "none" &&
      messageLevel !== "none"
    );
  }
}

export const logger = new Logger();
