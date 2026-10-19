// @ts-check
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { createInterface } from 'node:readline';
import { formatSummary, projectOf, recordLine } from './build-times.js';

// Builds every game with `pnpm -r`, forwarding its output, then prints how long each game
// took, their sum and the wall-clock total. Exits with the same code as the build.

const start = performance.now();
/** @type {import('./build-times.js').Timings} */
let timings = {};

const child = spawn('pnpm', ['-r', '--filter', './games/*', 'build'], {
  // Keep the colors on a terminal even though the output now goes through a pipe.
  env: process.stdout.isTTY ? { ...process.env, FORCE_COLOR: '1' } : process.env,
  shell: process.platform === 'win32',
});

/**
 * Forwards each line of a child stream and records which project printed it.
 * @param {NodeJS.ReadableStream} input
 * @param {NodeJS.WritableStream} output
 */
const track = (input, output) =>
  createInterface({ input }).on('line', (line) => {
    output.write(`${line}\n`);
    const project = projectOf(line);
    if (project) timings = recordLine(timings, project, performance.now());
  });

track(child.stdout, process.stdout);
track(child.stderr, process.stderr);

child.on('close', (code) => {
  process.stdout.write(`\n${formatSummary(timings, performance.now() - start)}\n`);
  process.exit(code ?? 1);
});
