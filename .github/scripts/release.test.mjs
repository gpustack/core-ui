import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareRelease, tagMergedRelease } from './release.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'core-ui-release-pr-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const remote = join(root, 'remote.git');
  const cwd = join(root, 'checkout');
  const repo = 'gpustack/core-ui';
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
    npm_config_cache: join(root, 'npm-cache'),
    npm_config_userconfig: join(root, 'npm-user.config'),
    npm_config_globalconfig: join(root, 'npm-global.config'),
    npm_config_offline: 'true',
    npm_config_update_notifier: 'false',
    GITHUB_REPOSITORY: repo,
    GITHUB_REF: 'refs/heads/main',
    GITHUB_EVENT_NAME: 'workflow_dispatch',
    GITHUB_RUN_ID: '1001',
    VERSION_TYPE: 'patch'
  };
  const command = (cmd, args, directory = cwd) =>
    execFileSync(cmd, args, {
      cwd: directory,
      env,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  const git = (...args) => command('git', args);
  const remoteGit = (...args) =>
    command('git', ['--git-dir', remote, ...args], root);
  command('git', ['init', '--bare', remote], root);
  command('git', ['init', '-b', 'main', cwd], root);
  git('config', 'user.name', 'Release Test');
  git('config', 'user.email', 'release-test@example.com');
  git('remote', 'add', 'origin', remote);
  const originalPackage = {
    name: 'release-fixture',
    version: '1.2.3',
    scripts: {
      preversion: 'exit 99',
      version: 'exit 99',
      postversion: 'exit 99'
    }
  };
  writeFileSync(
    join(cwd, 'package.json'),
    JSON.stringify(originalPackage, null, 2) + '\n'
  );
  git('add', 'package.json');
  git('commit', '-m', 'Initial version');
  git('push', '-u', 'origin', 'main');
  env.GITHUB_SHA = git('rev-parse', 'HEAD');
  const source = env.GITHUB_SHA;
  const prs = [];
  const files = new Map();
  const requests = [];
  let failCreate = false;
  const api = async (method, path, body) => {
    requests.push({ method, path, body });
    const url = new URL(path, 'https://fixture/');
    if (method === 'GET' && url.pathname === '/pulls') {
      let matches = prs.filter(
        (pr) => pr.base.ref === url.searchParams.get('base')
      );
      if (url.searchParams.get('state') !== 'all')
        matches = matches.filter(
          (pr) => pr.state === url.searchParams.get('state')
        );
      if (url.searchParams.has('head'))
        matches = matches.filter(
          (pr) =>
            `${repo.split('/')[0]}:${pr.head.ref}` ===
            url.searchParams.get('head')
        );
      const offset = (Number(url.searchParams.get('page')) - 1) * 100;
      return matches.slice(offset, offset + 100);
    }
    if (method === 'POST' && path === 'pulls') {
      if (failCreate) {
        failCreate = false;
        throw new Error('Simulated PR creation failure');
      }
      const sha = remoteGit('rev-parse', `refs/heads/${body.head}`);
      const number = prs.length + 1;
      const pr = {
        ...body,
        number,
        state: 'open',
        merged: false,
        html_url: `https://github.com/${repo}/pull/${number}`,
        head: { ref: body.head, sha, repo: { full_name: repo } },
        base: { ref: body.base, repo: { full_name: repo } }
      };
      const patch = remoteGit('diff', `${sha}^`, sha, '--', 'package.json');
      files.set(number, [
        {
          filename: 'package.json',
          status: 'modified',
          additions: 1,
          deletions: 1,
          patch
        }
      ]);
      prs.push(pr);
      return pr;
    }
    const match = url.pathname.match(/^\/pulls\/([0-9]+)(\/files)?$/);
    if (method === 'GET' && match) {
      if (match[2]) return files.get(Number(match[1]));
      return prs.find((pr) => pr.number === Number(match[1]));
    }
    throw new Error(`Unexpected API operation: ${method} ${path}`);
  };
  const prepare = (overrides = {}) =>
    prepareRelease({ cwd, env: { ...env, ...overrides }, api });
  const tag = (pr = prs[0], eventOverrides = {}) =>
    tagMergedRelease({
      cwd,
      env: { ...env, GITHUB_EVENT_NAME: 'pull_request' },
      api,
      event: {
        action: 'closed',
        pull_request: structuredClone(pr),
        ...eventOverrides
      }
    });
  function merge(method = 'merge', pr = prs[0]) {
    git('checkout', '-b', 'review-main', source);
    writeFileSync(
      join(cwd, 'code.txt'),
      'An unrelated change merged while the version PR was open.\n'
    );
    git('add', 'code.txt');
    git('commit', '-m', 'Later main change');
    if (method === 'merge') git('merge', '--no-ff', '--no-edit', pr.head.sha);
    if (method === 'squash') {
      git('merge', '--squash', pr.head.sha);
      git('commit', '-m', 'Squashed version PR');
    }
    if (method === 'rebase') {
      git('checkout', '-b', 'rebased-release', pr.head.sha);
      git('rebase', 'review-main');
    }
    const commit = git('rev-parse', 'HEAD');
    git('push', 'origin', 'HEAD:refs/heads/main');
    Object.assign(pr, {
      merged: true,
      state: 'closed',
      merge_commit_sha: commit
    });
    return commit;
  }
  return {
    root,
    remote,
    cwd,
    env,
    source,
    git,
    remoteGit,
    prs,
    files,
    requests,
    prepare,
    tag,
    merge,
    failNextCreate: () => {
      failCreate = true;
    }
  };
}

for (const [type, version] of [
  ['patch', '1.2.4'],
  ['minor', '1.3.0'],
  ['major', '2.0.0']
]) {
  test(`${type} creates only a version branch and PR, without touching main or tags`, async (t) => {
    const f = fixture(t);
    // Model the protected main rule: automation cannot push to it.
    writeFileSync(
      join(f.remote, 'hooks/update'),
      '#!/bin/sh\n[ "$1" != refs/heads/main ]\n',
      { mode: 0o755 }
    );
    writeFileSync(
      join(f.cwd, '.git/hooks/pre-commit'),
      '#!/bin/sh\nexit 99\n',
      { mode: 0o755 }
    );
    f.git('config', 'push.followTags', 'true');
    f.git('tag', '-a', 'unrelated', '-m', 'Another task tag');
    const result = await f.prepare({ VERSION_TYPE: type });
    assert.equal(result.version, version);
    assert.equal(f.remoteGit('rev-parse', 'main'), f.source);
    assert.equal(f.remoteGit('tag', '--list'), '');
    const head = f.prs[0].head.sha;
    assert.equal(f.remoteGit('rev-parse', `${head}^`), f.source);
    assert.equal(
      f.remoteGit('diff', '--name-only', f.source, head),
      'package.json'
    );
    assert.equal(
      JSON.parse(f.remoteGit('show', `${head}:package.json`)).version,
      version
    );
    assert.equal(f.prs[0].title, `chore: release v${version}`);
    assert.equal(f.prs[0].head.ref, 'feat/release-1001');
    assert.ok(
      f.requests.every(
        (r) => r.method === 'GET' || (r.method === 'POST' && r.path === 'pulls')
      )
    );
  });
}

test('re-running prepare reuses its PR and preserves edits to its branch', async (t) => {
  const f = fixture(t);
  const first = await f.prepare();
  writeFileSync(join(f.cwd, 'preserve.txt'), 'Human work.');
  f.git('add', 'preserve.txt');
  f.git('commit', '-m', 'Human branch edit');
  f.git('push', 'origin', 'HEAD:refs/heads/feat/release-1001');
  const head = f.remoteGit('rev-parse', 'feat/release-1001');
  const retry = await f.prepare();
  assert.equal(retry.url, first.url);
  assert.equal(retry.reused, true);
  assert.equal(f.prs.length, 1);
  assert.equal(f.remoteGit('rev-parse', 'feat/release-1001'), head);
});

test('a closed unmerged PR is reused on retries and never merged automatically', async (t) => {
  const f = fixture(t);
  await f.prepare();
  f.prs[0].state = 'closed';
  const result = await f.prepare();
  assert.equal(result.state, 'closed');
  assert.equal(result.reused, true);
  assert.equal(f.prs.length, 1);
  await assert.rejects(f.tag(), /Only a merged/);
  assert.equal(f.remoteGit('rev-parse', 'main'), f.source);
  assert.equal(f.remoteGit('tag', '--list'), '');
});

test('recovers a pushed branch after PR creation fails', async (t) => {
  const f = fixture(t);
  f.failNextCreate();
  await assert.rejects(f.prepare(), /Simulated PR creation failure/);
  const head = f.remoteGit('rev-parse', 'feat/release-1001');
  assert.equal(f.prs.length, 0);
  const result = await f.prepare();
  assert.equal(result.version, '1.2.4');
  assert.equal(f.remoteGit('rev-parse', 'feat/release-1001'), head);
  assert.equal(f.prs.length, 1);
  assert.equal(f.remoteGit('rev-parse', 'main'), f.source);
});

test('does not overwrite a pushed branch edited before PR recovery', async (t) => {
  const f = fixture(t);
  f.failNextCreate();
  await assert.rejects(f.prepare(), /Simulated/);
  f.git('commit', '--allow-empty', '-m', 'Human work after push');
  f.git('push', 'origin', 'HEAD:refs/heads/feat/release-1001');
  const head = f.remoteGit('rev-parse', 'feat/release-1001');
  await assert.rejects(f.prepare(), /unexpected commits/);
  assert.equal(f.remoteGit('rev-parse', 'feat/release-1001'), head);
});

test('only one version PR can remain open', async (t) => {
  const f = fixture(t);
  await f.prepare();
  await assert.rejects(f.prepare({ GITHUB_RUN_ID: '1002' }), /already open/);
  assert.equal(f.prs.length, 1);
  assert.equal(f.remoteGit('branch', '--list', 'feat/release-1002'), '');
});

test('rejects an existing version tag before changing the package', async (t) => {
  const f = fixture(t);
  f.git('tag', '-a', 'v1.2.4', '-m', 'Existing version');
  f.git('push', 'origin', 'v1.2.4');
  await assert.rejects(f.prepare(), /newer than existing tag/);
  assert.equal(
    JSON.parse(readFileSync(join(f.cwd, 'package.json'), 'utf8')).version,
    '1.2.3'
  );
  assert.equal(f.prs.length, 0);
});

test('rejects requests from another branch and requests based on an old main', async (t) => {
  const f = fixture(t);
  await assert.rejects(
    f.prepare({ GITHUB_REF: 'refs/heads/dev' }),
    /must run on main/
  );
  f.git('commit', '--allow-empty', '-m', 'New main commit');
  f.git('push', 'origin', 'HEAD:main');
  await assert.rejects(f.prepare(), /main changed/);
  assert.equal(f.prs.length, 0);
  assert.equal(f.remoteGit('tag', '--list'), '');
});

for (const method of ['merge', 'squash', 'rebase']) {
  test(`${method} tags the actual merged commit even when main advances again`, async (t) => {
    const f = fixture(t);
    await f.prepare();
    assert.equal(f.remoteGit('tag', '--list'), '');
    const commit = f.merge(method);
    assert.notEqual(commit, f.prs[0].head.sha);
    f.git('commit', '--allow-empty', '-m', 'Main advances after version PR');
    f.git('push', 'origin', 'HEAD:main');
    const main = f.remoteGit('rev-parse', 'main');
    const result = await f.tag();
    assert.equal(result.commit, commit);
    assert.equal(f.remoteGit('rev-parse', 'v1.2.4^{commit}'), commit);
    assert.equal(f.remoteGit('cat-file', '-t', 'v1.2.4'), 'tag');
    assert.equal(f.remoteGit('rev-parse', 'main'), main);
    const tagObject = f.remoteGit('rev-parse', 'v1.2.4');
    const retry = await f.tag();
    assert.equal(retry.reused, true);
    assert.equal(f.remoteGit('rev-parse', 'v1.2.4'), tagObject);
  });
}

test('refuses to overwrite a version tag on another commit', async (t) => {
  const f = fixture(t);
  await f.prepare();
  f.merge();
  f.git('tag', '-a', 'v1.2.4', f.source, '-m', 'A conflicting tag');
  f.git('push', 'origin', 'v1.2.4');
  await assert.rejects(f.tag(), /will not be overwritten/);
  assert.equal(f.remoteGit('rev-parse', 'v1.2.4^{commit}'), f.source);
});

for (const mutation of [
  'fork',
  'metadata',
  'other-file',
  'other-field',
  'version'
]) {
  test(`does not tag an invalid version PR: ${mutation}`, async (t) => {
    const f = fixture(t);
    await f.prepare();
    f.merge();
    const pr = f.prs[0];
    if (mutation === 'fork') pr.head.repo.full_name = 'outside/core-ui';
    if (mutation === 'metadata') pr.body = 'An ordinary PR';
    if (mutation === 'other-file')
      f.files.get(pr.number).push({ filename: 'source.js' });
    if (mutation === 'other-field')
      f.files.get(pr.number)[0].patch = '-  "name": "old",\n+  "name": "new",';
    if (mutation === 'version')
      f.files.get(pr.number)[0].patch =
        '-  "version": "1.2.3",\n+  "version": "9.0.0",';
    await assert.rejects(f.tag());
    assert.equal(f.remoteGit('tag', '--list'), '');
  });
}

test('refuses to tag a commit that was not retained on main', async (t) => {
  const f = fixture(t);
  await f.prepare();
  const head = f.prs[0].head.sha;
  Object.assign(f.prs[0], {
    merged: true,
    state: 'closed',
    merge_commit_sha: head
  });
  await assert.rejects(f.tag());
  assert.equal(f.remoteGit('tag', '--list'), '');
  assert.equal(f.remoteGit('rev-parse', 'main'), f.source);
});
