export interface Logger {
  spinner(): { start(msg: string): void; stop(msg: string): void };
  log: {
    warn(msg: string): void;
    info(msg: string): void;
    success(msg: string): void;
    error(msg: string): void;
  };
  note(msg: string, title?: string): void;
}

const PREFIX = '[nuxt-openapi-hyperfetch]';

function printWithPrefix(method: 'log' | 'info' | 'warn' | 'error', label: string, message: string) {
  console[method](`${PREFIX} ${label} ${message}`);
}

export function createConsoleLogger(): Logger {
  return {
    spinner() {
      return {
        start: (msg: string) => printWithPrefix('log', '...', msg),
        stop: (msg: string) => printWithPrefix('log', 'OK', msg),
      };
    },
    log: {
      warn: (msg) => printWithPrefix('warn', 'WARN', msg),
      info: (msg) => printWithPrefix('info', 'INFO', msg),
      success: (msg) => printWithPrefix('log', 'OK', msg),
      error: (msg) => printWithPrefix('error', 'ERR', msg),
    },
    note: (msg, title) => {
      if (title) {
        console.log(`\n${PREFIX} ${title}:\n${msg}\n`);
        return;
      }

      console.log(`\n${PREFIX}\n${msg}\n`);
    },
  };
}

export function logInfo(message: string) {
  printWithPrefix('info', 'INFO', message);
}

export function logSuccess(message: string) {
  printWithPrefix('log', 'OK', message);
}

export function logWarning(message: string) {
  printWithPrefix('warn', 'WARN', message);
}

export function logError(message: string) {
  printWithPrefix('error', 'ERR', message);
}
