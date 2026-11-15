import { execFile } from 'node:child_process';

/** Runs a program with an argument list. Never a shell, so no argument is ever interpreted. */
export function runProgram(file, args, { cwd, env, timeoutMs = 30 * 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(file, args, { cwd, env, timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' }, (error, stdout, stderr) => {
      if (!error) return resolve({ stdout, stderr });
      const detail = (stderr || stdout || error.message).trim().split('\n').slice(-6).join('\n');
      reject(Object.assign(new Error(`${file} ${args.join(' ')} failed (${error.code ?? error.signal}): ${detail}`), { stdout, stderr }));
    });
  });
}
