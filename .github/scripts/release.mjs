import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const releaseBranch = /^feat\/release-([0-9]+)$/;
const marker = /<!-- core-ui-release (\{[^\n]+\}) -->/;
const stableVersion = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function increment(version, type) {
  check(
    stableVersion.test(version),
    `Expected a stable package version: ${version}`
  );
  const [major, minor, patch] = version.split('.').map(Number);
  if (type === 'patch') return `${major}.${minor}.${patch + 1}`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  if (type === 'major') return `${major + 1}.0.0`;
  throw new Error('Version increment must be patch, minor, or major.');
}

function context(cwd, env) {
  check(env.GITHUB_REF === 'refs/heads/main', 'Release must run on main.');
  check(
    /^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY ?? ''),
    'Invalid repository.'
  );
  const git = (...args) =>
    execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim();
  const pkg = (ref) => JSON.parse(git('show', `${ref}:package.json`));
  const refresh = () =>
    git(
      'fetch',
      'origin',
      'refs/heads/main:refs/remotes/origin/main',
      'refs/tags/v*:refs/tags/v*'
    );
  const identify = () => {
    git('config', 'user.name', 'github-actions[bot]');
    git(
      'config',
      'user.email',
      '41898282+github-actions[bot]@users.noreply.github.com'
    );
  };
  return { git, pkg, refresh, identify };
}

function assertNewVersion(git, version) {
  check(stableVersion.test(version), 'Invalid release version.');
  const candidate = version.split('.').map(Number);
  for (const tag of git('tag', '--list', 'v*').split('\n')) {
    if (!stableVersion.test(tag.slice(1))) continue;
    const existing = tag.slice(1).split('.').map(Number);
    const difference =
      candidate.map((n, i) => n - existing[i]).find((n) => n !== 0) ?? 0;
    check(
      difference > 0,
      `Version ${version} must be newer than existing tag ${tag}; update main's package version through a PR.`
    );
  }
}

function versionChange(before, after, type) {
  const { version: previousVersion, ...previousFields } = before;
  const { version, ...nextFields } = after;
  check(
    version === increment(previousVersion, type),
    'Unexpected version increment.'
  );
  check(
    isDeepStrictEqual(previousFields, nextFields),
    'A version PR may only change package.json version.'
  );
  return { version, previousVersion };
}

function metadata(pr, repo) {
  const match = pr.body?.match(marker);
  check(match, 'Version PR release metadata is missing.');
  const data = JSON.parse(match[1]);
  check(/^[0-9]+$/.test(data.runId ?? ''), 'Invalid release run ID.');
  check(
    pr.head?.ref === `feat/release-${data.runId}`,
    'Unexpected release branch.'
  );
  check(
    pr.head?.repo?.full_name === repo && pr.base?.ref === 'main',
    'Version PR must be from this repository into main.'
  );
  check(
    data.version === increment(data.previousVersion, data.increment),
    'Invalid version PR metadata.'
  );
  return data;
}

function githubClient(env) {
  check(env.GH_TOKEN, 'GPUSTACK_UI_PAT is required.');
  return async (method, path, body) => {
    const response = await fetch(
      `${env.GITHUB_API_URL ?? 'https://api.github.com'}/repos/${env.GITHUB_REPOSITORY}/${path}`,
      {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GH_TOKEN}`,
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      }
    );
    check(
      response.ok,
      `GitHub ${method} ${path} failed (${response.status}). Check the PAT's repository access and permissions.`
    );
    return response.json();
  };
}

async function list(api, path, query = {}) {
  const values = [];
  for (let page = 1; ; page++) {
    const params = new URLSearchParams({
      ...query,
      per_page: '100',
      page: String(page)
    });
    const entries = await api('GET', `${path}?${params}`);
    values.push(...entries);
    if (entries.length < 100) return values;
  }
}

export async function prepareRelease({
  cwd = process.cwd(),
  env = process.env,
  api = githubClient(env)
} = {}) {
  const { git, pkg, refresh, identify } = context(cwd, env);
  check(
    env.GITHUB_EVENT_NAME === 'workflow_dispatch',
    'Version PRs must be requested manually.'
  );
  check(/^[0-9]+$/.test(env.GITHUB_RUN_ID ?? ''), 'Invalid release run ID.');
  check(
    ['patch', 'minor', 'major'].includes(env.VERSION_TYPE),
    'Version increment must be patch, minor, or major.'
  );
  const branch = `feat/release-${env.GITHUB_RUN_ID}`;
  const owner = env.GITHUB_REPOSITORY.split('/')[0];
  const previous = await list(api, 'pulls', {
    state: 'all',
    base: 'main',
    head: `${owner}:${branch}`
  });
  const existing = previous.find(
    (pr) => pr.head?.repo?.full_name === env.GITHUB_REPOSITORY
  );
  if (existing) {
    const data = metadata(existing, env.GITHUB_REPOSITORY);
    return {
      kind: 'pr',
      version: data.version,
      url: existing.html_url,
      state: existing.state,
      reused: true
    };
  }

  const open = await list(api, 'pulls', { state: 'open', base: 'main' });
  const pending = open.find(
    (pr) =>
      pr.head?.repo?.full_name === env.GITHUB_REPOSITORY &&
      releaseBranch.test(pr.head.ref)
  );
  check(
    !pending,
    `Version PR #${pending?.number} is already open. Merge or close it before requesting another release.`
  );
  refresh();

  const ref = `refs/heads/${branch}`;
  const remoteHead = git('ls-remote', '--heads', 'origin', ref).split('\t')[0];
  let data;
  if (remoteHead) {
    // Recover a branch push whose following PR creation failed. Never rewrite
    // a branch that a person may have edited in the meantime.
    git('fetch', 'origin', `${ref}:refs/remotes/origin/release-prepare`);
    check(
      git('rev-parse', `${remoteHead}^`) === env.GITHUB_SHA,
      'Existing release branch has unexpected commits.'
    );
    check(
      git('log', '-1', '--format=%B', remoteHead)
        .split('\n')
        .includes(`Release-Run: ${env.GITHUB_RUN_ID}`),
      'Existing branch is not owned by this release run.'
    );
    check(
      git('diff', '--name-only', `${remoteHead}^`, remoteHead) ===
        'package.json',
      'Existing release branch contains other changes.'
    );
    data = versionChange(
      pkg(`${remoteHead}^`),
      pkg(remoteHead),
      env.VERSION_TYPE
    );
    assertNewVersion(git, data.version);
  } else {
    check(
      git('rev-parse', 'HEAD') === env.GITHUB_SHA &&
        git('rev-parse', 'origin/main') === env.GITHUB_SHA,
      'main changed after this request. Start a new Release run from the latest main.'
    );
    check(
      git('status', '--porcelain') === '',
      'The release checkout must be clean.'
    );
    const before = pkg('HEAD');
    assertNewVersion(git, increment(before.version, env.VERSION_TYPE));
    execFileSync(
      'npm',
      ['version', env.VERSION_TYPE, '--no-git-tag-version', '--ignore-scripts'],
      { cwd, env, encoding: 'utf8' }
    );
    data = versionChange(
      before,
      JSON.parse(readFileSync(`${cwd}/package.json`, 'utf8')),
      env.VERSION_TYPE
    );
    identify();
    git('add', '--', 'package.json');
    git(
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '-m',
      `chore: release v${data.version}`,
      '-m',
      `Release-Run: ${env.GITHUB_RUN_ID}`
    );
    git('-c', 'push.followTags=false', 'push', 'origin', `HEAD:${ref}`);
  }

  const release = {
    ...data,
    increment: env.VERSION_TYPE,
    runId: env.GITHUB_RUN_ID
  };
  const pr = await api('POST', 'pulls', {
    base: 'main',
    head: branch,
    title: `chore: release v${data.version}`,
    body: `Bump @gpustack/core-ui to **v${data.version}** (${env.VERSION_TYPE}).\n\nMerge this PR manually. After it is merged into main, Release will tag the merge result and start the existing CI publishing workflow.\n\n<!-- core-ui-release ${JSON.stringify(release)} -->`
  });
  return {
    kind: 'pr',
    version: data.version,
    url: pr.html_url,
    state: pr.state,
    reused: false
  };
}

function validateVersionPatch(files, data) {
  check(
    files.length === 1 &&
      files[0].filename === 'package.json' &&
      files[0].status === 'modified',
    'Release PR must only modify package.json.'
  );
  const file = files[0];
  check(
    file.additions === 1 &&
      file.deletions === 1 &&
      typeof file.patch === 'string',
    'Release PR must only change the version line.'
  );
  const changed = file.patch
    .split('\n')
    .filter((line) => /^[+-]/.test(line) && !/^(---|\+\+\+)/.test(line));
  const readVersion = (prefix) => {
    const lines = changed.filter((line) => line.startsWith(prefix));
    check(lines.length === 1, 'Unexpected version PR patch.');
    const match = lines[0]
      .slice(1)
      .match(/^\s*"version"\s*:\s*"([0-9]+\.[0-9]+\.[0-9]+)"\s*,?\s*$/);
    check(match, 'Release PR changes more than the package version.');
    return match[1];
  };
  check(
    changed.length === 2 &&
      readVersion('-') === data.previousVersion &&
      readVersion('+') === data.version,
    'Release PR patch does not match its requested version.'
  );
}

export async function tagMergedRelease({
  cwd = process.cwd(),
  env = process.env,
  api = githubClient(env),
  event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, 'utf8'))
} = {}) {
  const { git, pkg, refresh, identify } = context(cwd, env);
  check(
    env.GITHUB_EVENT_NAME === 'pull_request' &&
      event.action === 'closed' &&
      event.pull_request?.merged === true,
    'Only a merged version PR can create a release tag.'
  );
  const number = event.pull_request.number;
  check(Number.isSafeInteger(number) && number > 0, 'Invalid PR number.');
  const pr = await api('GET', `pulls/${number}`);
  check(pr.merged === true, 'The version PR has not been merged.');
  const data = metadata(pr, env.GITHUB_REPOSITORY);
  const commit = pr.merge_commit_sha;
  check(
    /^[a-f0-9]{40}$/.test(commit ?? '') &&
      commit === event.pull_request.merge_commit_sha,
    'Unexpected PR merge result.'
  );
  validateVersionPatch(await list(api, `pulls/${number}/files`), data);

  refresh();
  // merge_commit_sha is the merge result for merge, squash, and rebase. It is
  // deliberately used instead of the PR head or whichever main tip is latest.
  git('merge-base', '--is-ancestor', commit, 'origin/main');
  check(
    pkg(commit).version === data.version,
    'Merged commit does not contain the requested release version.'
  );
  const tag = `v${data.version}`;
  const refs = git(
    'ls-remote',
    'origin',
    `refs/tags/${tag}`,
    `refs/tags/${tag}^{}`
  )
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t'));
  if (refs.length) {
    const target =
      refs.find((entry) => entry[1].endsWith('^{}'))?.[0] ?? refs[0][0];
    check(
      target === commit,
      `Tag ${tag} already points to another commit; it will not be overwritten.`
    );
    return { kind: 'tag', tag, commit, reused: true };
  }
  assertNewVersion(git, data.version);
  identify();
  git('tag', '-a', tag, commit, '-m', `Release ${tag} from PR #${number}`);
  // Only the tag is pushed. main is updated solely by the person's PR merge.
  git(
    '-c',
    'push.followTags=false',
    'push',
    'origin',
    `refs/tags/${tag}:refs/tags/${tag}`
  );
  return { kind: 'tag', tag, commit, reused: false };
}

async function main() {
  const operation = process.argv[2];
  check(
    operation === 'prepare' || operation === 'tag',
    'Choose prepare or tag.'
  );
  const result =
    operation === 'prepare' ? await prepareRelease() : await tagMergedRelease();
  console.log(JSON.stringify(result));
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary =
      result.kind === 'pr'
        ? `### Version PR v${result.version}\n\n[Open version PR](${result.url}) (${result.state}${result.reused ? ', reused' : ''}).\n\nMerge it manually to start tagging and publication. A closed PR is reused on retries; start a new Release run to request another version.\n`
        : `### Release ${result.tag}\n\nTag points to \`${result.commit}\`${result.reused ? ' (already present)' : ''}.\n\n[Follow publishing CI](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/workflows/ci.yml?query=branch%3A${result.tag}). Re-run CI for this tag to retry publication.\n`;
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
