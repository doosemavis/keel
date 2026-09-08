/**
 * Workbench dev server — watch, rebuild, live-reload.
 *
 * `npm run build` produces a static file you open over file://. That is the right
 * shape for the artifact, and a miserable way to work on tokens: every colour
 * change means switching to a terminal, rebuilding, and hitting reload.
 *
 * This serves the same generated file over HTTP, watches the sources it is
 * generated FROM, and pushes a reload when any of them change. Deliberately
 * dependency-free — a dev server that needs its own install step is one more
 * thing to break, and Node has everything required.
 *
 * The rebuild shells out to Turbo rather than calling the generators directly,
 * because the graph matters: a token change has to flow tokens -> specs ->
 * react (which compiles the CSS) -> workbench. Turbo already knows that order
 * and caches the parts that did not change.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const dist = join(here, 'dist');

const PORT = Number(process.env.PORT ?? 3000);
// `localhost` rather than a literal 127.0.0.1: on macOS with modern Node,
// localhost usually resolves to ::1, so binding the IPv4 literal while the
// browser resolves IPv6 is a real way to get "connection refused" on a server
// that is plainly running. Binding the same name the browser resolves keeps
// the two consistent.
const HOST = process.env.HOST ?? 'localhost';

/** How many ports to try past PORT before giving up. */
const PORT_ATTEMPTS = 10;

/**
 * Source trees whose contents affect the generated page.
 *
 * `recursive: false` on the tokens package ROOT is the important entry and was
 * missing. Only `packages/tokens/src` was watched, which meant the two files a
 * re-theme actually edits — `seeds.json` and `ramps.js` — produced no rebuild
 * and no reload. The failure mode is quietly awful: you change a hue, the page
 * does not move, and the natural conclusion is that the change did nothing.
 * The generators live beside the sources rather than inside them, so the watch
 * has to as well. Non-recursive, because `dist/` and `node_modules/` are under
 * that same root and a recursive watch there is mostly noise.
 */
const WATCHED = [
  { dir: join(root, 'packages/tokens'), recursive: false },
  { dir: join(root, 'packages/tokens/src'), recursive: true },
  { dir: join(root, 'packages/specs/src'), recursive: true },
  { dir: join(root, 'packages/react/src'), recursive: true },
  { dir: here, recursive: true },
];

/** Files that are build output, not input — watching them would loop forever. */
const IGNORED = /(^|[\\/])(dist|node_modules|\.turbo|\.git)([\\/]|$)/;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

/** Connected browsers, held open for server-sent events. */
const clients = new Set();

/**
 * Injected into the served HTML only — never written to disk.
 *
 * Keeping it out of the generated file means the artifact that gets published
 * has no dev-only code in it, and `dist/index.html` stays byte-identical
 * whether or not you ever ran the dev server.
 */
const RELOAD_SNIPPET = `
<script>
(function () {
  var es = new EventSource('/__reload');
  es.addEventListener('reload', function () { location.reload(); });
  es.addEventListener('error', function () {
    // Server went away — poll until it answers, then reload.
    es.close();
    var t = setInterval(function () {
      fetch('/__ping').then(function () { clearInterval(t); location.reload(); }, function () {});
    }, 700);
  });
})();
</script>`;

let building = false;
let queued = false;

function runBuild() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const started = Date.now();
  process.stdout.write('  rebuilding… ');

  // --output-logs=errors-only keeps the terminal quiet on success and loud on
  // failure, which is the only time you want to read it.
  const child = spawn('npx', ['turbo', 'run', 'build', '--output-logs=errors-only'], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let err = '';
  child.stderr.on('data', (d) => (err += d));
  child.stdout.on('data', (d) => (err += d));

  child.on('close', (code) => {
    building = false;
    const ms = Date.now() - started;
    if (code === 0) {
      console.log(`done in ${ms}ms`);
      for (const res of clients) res.write('event: reload\ndata: 1\n\n');
    } else {
      console.log('FAILED\n');
      console.error(err.trim());
      console.error('\n  Build failed — the page still shows the last good version.\n');
    }
    if (queued) {
      queued = false;
      runBuild();
    }
  });
}

let debounce;
function onChange(file) {
  if (file && IGNORED.test(file)) return;
  clearTimeout(debounce);
  // Editors write in bursts (temp file, rename, chmod). One rebuild per burst.
  debounce = setTimeout(runBuild, 120);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/__ping') {
    res.writeHead(200).end('ok');
    return;
  }

  if (url.pathname === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 500\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = join(dist, rel);

  // Refuse to serve outside dist, even though this only listens on loopback.
  if (!file.startsWith(dist)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    await stat(file);
    const body = await readFile(file);
    const type = MIME[extname(file)] ?? 'application/octet-stream';

    if (extname(file) === '.html') {
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
      res.end(body.toString('utf8').replace('</style>', '</style>' + RELOAD_SNIPPET));
      return;
    }

    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      `<title>Not built yet</title><body style="font:15px system-ui;padding:40px;max-width:40rem">
       <h1>Nothing to serve yet</h1>
       <p><code>${rel}</code> is not in <code>apps/workbench/dist</code>.</p>
       <p>The first build may still be running — this page reloads itself when it finishes.</p>
       ${RELOAD_SNIPPET}`,
    );
  }
});

function onListening(port) {
  console.log(`\n  Keel workbench  →  http://${HOST}:${port}\n`);
  if (port !== PORT) {
    console.log(`  (${PORT} was busy — using ${port}. Set PORT to choose your own.)\n`);
  }
  console.log('  watching:');
  for (const { dir, recursive } of WATCHED)
    console.log(`    ${dir.replace(root + '/', '')}${recursive ? '/**' : '/*'}`);
  console.log();

  for (const { dir, recursive } of WATCHED) {
    try {
      watch(dir, { recursive }, (_evt, file) => onChange(file));
    } catch (e) {
      console.warn(`  (could not watch ${dir}: ${e.message})`);
    }
  }

  runBuild();
}

/**
 * Port 3000 is the convention and therefore frequently already taken — by
 * another dev server, or by a previous run of this one that did not exit
 * cleanly. Walking to the next free port beats crashing with EADDRINUSE and
 * making the reader work out what "address already in use" means.
 */
function start(port, attemptsLeft) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      start(port + 1, attemptsLeft - 1);
      return;
    }
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n  Ports ${PORT}–${port} are all in use. Free one, or run: PORT=8080 npm run dev\n`,
      );
    } else {
      console.error(`\n  Could not start the server: ${err.message}\n`);
    }
    process.exit(1);
  });

  // No callback here on purpose. `server.listen(port, host, cb)` registers cb
  // as a one-shot 'listening' listener, and a failed attempt does NOT remove
  // it — so after falling back, every earlier attempt's callback fires too and
  // the server announces the port it wanted rather than the one it got. The
  // single handler below reads the address off the socket, which cannot lie.
  server.listen(port, HOST);
}

server.on('listening', () => onListening(server.address().port));

start(PORT, PORT_ATTEMPTS);

process.on('SIGINT', () => {
  console.log('\n  stopped');
  process.exit(0);
});
