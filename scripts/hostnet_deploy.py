#!/usr/bin/env python3
"""Static Hostnet releases. No site rebuild, credentials or runtime changes."""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import shutil
import subprocess
import tarfile
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / '.hostnet'
SITE = LOCAL / 'site'
CONFIG = LOCAL / 'config.json'


def run(argv, **kw):
    return subprocess.run(argv, check=True, **kw)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def public_files():
    names = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    out = []
    for name in filter(None, names):
        p = PurePosixPath(name)
        include = p.parts[0] in ('assets', 'data', 'explorer') or (
            len(p.parts) == 1 and p.suffix in ('.html', '.css', '.js', '.xml', '.txt', '.ico', '.webmanifest'))
        if include:
            if p.name == '.gitkeep':
                continue
            source = ROOT / name
            if source.is_symlink() or not source.is_file():
                raise ValueError('Only ordinary tracked files may be published: ' + name)
            if any(part.startswith('.') for part in p.parts) or p.suffix in ('.pem', '.key'):
                raise ValueError('Private/control file in publication set: ' + name)
            out.append(name)
    # Keep existing public document links functional without exporting deploy docs.
    tracked = set(names)
    for name in list(out):
        if name.endswith('.html'):
            parser = References()
            parser.feed((ROOT / name).read_text())
            for value in parser.urls:
                target = local_reference(name, value)
                if target and '/' not in target and target.endswith('.md') and target in tracked:
                    if target not in ('AGENTS.md', 'HOSTNET.md') and target not in out:
                        out.append(target)
    return sorted(out)


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        self.urls.extend(value for key, value in attrs if key in ('src', 'href') and value)


def local_reference(owner, value):
    u = urlsplit(value)
    if u.scheme or u.netloc or not u.path:
        return None
    if u.path.startswith('/'):
        raise ValueError(f'Root-relative URL is not portable: {owner}: {value}')
    resolved = urlsplit(urljoin('https://example.invalid/mount/' + owner, value)).path
    if not resolved.startswith('/mount/'):
        raise ValueError(f'Link leaves deployment root: {owner}: {value}')
    relative = unquote(resolved[len('/mount/'):])
    if resolved.endswith('/'):
        relative += 'index.html'
    return relative


def check_references(files, base=ROOT):
    available = set(files)
    count = 0
    for name in files:
        suffix = Path(name).suffix
        if suffix not in ('.html', '.css'):
            continue
        content = (base / name).read_text()
        if suffix == '.html':
            parser = References()
            parser.feed(content)
            urls = parser.urls
        else:
            urls = [m.strip().strip('\"\'') for m in re.findall(r'url\(([^)]+)\)', content)]
        for value in urls:
            target = local_reference(name, value)
            if target is not None:
                if target not in available:
                    raise ValueError(f'Missing local dependency: {name}: {value}')
                count += 1
    return count


def package():
    LOCAL.mkdir(exist_ok=True, mode=0o700)
    if LOCAL.is_symlink() or SITE.is_symlink():
        raise ValueError('Publication workspace may not be a symlink')
    files = public_files()
    refs = check_references(files)
    if SITE.exists():
        shutil.rmtree(SITE)
    SITE.mkdir(mode=0o755)
    SITE.chmod(0o755)
    for name in files:
        dest = SITE / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, dest)
        dest.chmod(0o644)
    for folder, _, _ in os.walk(SITE):
        Path(folder).chmod(0o755)
    manifest = {'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip(),
                'files': {p: sha(SITE / p) for p in files}, 'localReferences': refs}
    (LOCAL / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Packaged {len(files)} unchanged public files; {refs} local references checked.')
    return manifest


def config():
    c = json.loads(CONFIG.read_text())
    allowed = {'host', 'user', 'port', 'identityFile', 'knownHostsFile', 'remoteRoot', 'baseUrl'}
    optional = {'approvedServerConfig'}
    if not allowed <= set(c) or not set(c) <= allowed | optional:
        raise ValueError('Config accepts only connection metadata and local key paths; no passwords or keys')
    approvals = c.get('approvedServerConfig', {})
    if not isinstance(approvals, dict) or any(k not in ('.htaccess', '.user.ini', 'index.php', 'web.config') or not re.fullmatch(r'[a-f0-9]{64}', v) for k, v in approvals.items()):
        raise ValueError('Server config approvals require reviewed filenames and SHA-256 values')
    for field in ('host', 'user'):
        if not re.fullmatch(r'[A-Za-z0-9_.-]+', c[field]) or c[field].startswith('-'):
            raise ValueError('Invalid SSH ' + field)
    if not isinstance(c['port'], int) or not 1 <= c['port'] <= 65535:
        raise ValueError('Invalid port')
    p = PurePosixPath(c['remoteRoot'])
    if not p.is_absolute() or '..' in p.parts or str(p) in ('/', '/home', '/etc', '/usr', '/var', '/tmp'):
        raise ValueError('An exact site-specific absolute remoteRoot is required')
    if not re.fullmatch(r'/[A-Za-z0-9_./-]+', str(p)):
        raise ValueError('Remote path contains unsupported characters')
    for field in ('identityFile', 'knownHostsFile'):
        c[field] = str(Path(c[field]).expanduser().resolve())
        if not Path(c[field]).is_file():
            raise ValueError('Missing local file: ' + field)
    if Path(c['identityFile']).is_relative_to(ROOT):
        raise ValueError('Private key must remain outside the repository')
    if Path(c['identityFile']).stat().st_mode & 0o077:
        raise ValueError('Private key permissions must be 0600 or stricter')
    u = urlsplit(c['baseUrl'])
    if u.scheme != 'https' or not u.hostname or u.username or u.query or u.fragment:
        raise ValueError('An HTTPS base URL without credentials/query/fragment is required')
    c['baseUrl'] = c['baseUrl'].rstrip('/') + '/'
    c['remoteRoot'] = str(p)
    return c


def ssh_options(c):
    return ['-o', 'BatchMode=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'IdentitiesOnly=yes',
            '-o', 'PasswordAuthentication=no', '-o', 'KbdInteractiveAuthentication=no',
            '-o', 'ConnectTimeout=15', '-o', 'UserKnownHostsFile=' + c['knownHostsFile'],
            '-i', c['identityFile'], '-p', str(c['port']), '-l', c['user']]


def ssh(c, command):
    return ['ssh', *ssh_options(c), c['host'], command]


def check(c):
    root = shlex.quote(c['remoteRoot'])
    route = '/run/webroots/by-route/' + urlsplit(c['baseUrl']).hostname + '_'
    route += urlsplit(c['baseUrl']).path.rstrip('/')
    quoted_route = shlex.quote(route)
    command = (f'set -eu; test -d {root}; test -d {quoted_route}; '
               f'test "$(cd {root} && pwd -P)" = "$(cd {quoted_route} && pwd -P)"; '
               f'cd {root}; pwd -P; command -v tar; command -v rsync')
    result = subprocess.check_output(ssh(c, command), text=True)
    print(result.strip())
    opts = ssh_options(c)
    # sftp uses -P for the port and -oUser instead of ssh's -l.
    opts = opts[:-4] + ['-P', str(c['port']), '-o', 'User=' + c['user']]
    run(['sftp', *opts, '-b', '-', c['host']], input='pwd\nquit\n', text=True)


def backup(c):
    folder = LOCAL / 'backups'
    if LOCAL.is_symlink() or folder.is_symlink():
        raise ValueError('Backup workspace may not be a symlink')
    folder.mkdir(parents=True, exist_ok=True, mode=0o700)
    folder.chmod(0o700)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    path = folder / (c['host'] + '-' + stamp + '.tar.gz')
    partial = path.with_suffix('.partial')
    fd = os.open(partial, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as output:
        run(ssh(c, 'tar -czf - -C ' + shlex.quote(c['remoteRoot']) + ' .'), stdout=output)
    with gzip.open(partial, 'rb') as stream:
        while stream.read(1024 * 1024):
            pass
    with tarfile.open(partial, 'r:gz') as archive:
        entries = len(archive.getmembers())
    partial.rename(path)
    receipt = {'host': c['host'], 'remoteRoot': c['remoteRoot'], 'archive': path.name,
               'sha256': sha(path), 'entries': entries, 'validated': True}
    path.with_suffix('.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(f'Validated private backup: {path} ({entries} entries)')
    return path


def verify(c, manifest=None):
    manifest = manifest or json.loads((LOCAL / 'manifest.json').read_text())
    samples = {'index.html', 'app.js', 'catalog-completion.js', 'reading-room.css', 'about.html',
               'explorer/index.html', 'explorer/pilot/index.html', 'explorer/pilot/thread/index.html',
               'explorer/pilot/data/wrk-000001/index.json', 'explorer/pilot/data/edn-000271/index.json'}
    samples.update(p for p in manifest['files'] if p.startswith('assets/reading-room-') or p.startswith('assets/explorer-crossroads-'))
    for name in sorted(samples):
        with urlopen(c['baseUrl'] + name, timeout=30) as response:
            data = response.read()
        if hashlib.sha256(data).hexdigest() != manifest['files'][name]:
            raise ValueError('Live file differs from release: ' + name)
    print(f'HTTPS verified: {len(samples)} published files match the release exactly.')


def rsync_options(c):
    return ['rsync', '-rtp', '--delay-updates', '-e', shlex.join(['ssh', *ssh_options(c)])]


def upload(c):
    if subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT).strip():
        raise ValueError('Commit the reviewed changes before deployment')
    check(c)
    manifest = package()
    backup(c)  # Mandatory; transfer never begins if backup or integrity validation fails.
    root = shlex.quote(c['remoteRoot'])
    conflicts = subprocess.check_output(ssh(c, f'cd {root}; for f in .htaccess .user.ini index.php web.config; do if test -e "$f"; then printf "%s\\n" "$f"; fi; done'), text=True).strip()
    for name in conflicts.splitlines():
        expected = c.get('approvedServerConfig', {}).get(name)
        if not expected:
            raise ValueError('Existing server configuration needs review before upload: ' + name)
        actual = subprocess.check_output(ssh(c, f'cd {root}; sha256sum ' + shlex.quote(name)), text=True).split()[0]
        if actual != expected:
            raise ValueError('Reviewed server configuration has changed: ' + name)
    common = rsync_options(c)
    dest = c['host'] + ':' + c['remoteRoot'] + '/'
    # Preserve previous assets and unrelated files. New HTML is uploaded last.
    run([*common, '--exclude=*.html', str(SITE) + '/', dest])
    run([*common, '--include=*/', '--include=*.html', '--exclude=*', str(SITE) + '/', dest])
    print('Uploaded commit ' + manifest['commit'] + '; live HTTPS verification is still required.')
    return manifest


def deploy(c):
    manifest = upload(c)
    verify(c, manifest)
    print('Published commit ' + manifest['commit'] + '; GitHub Pages was not changed.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['package', 'check', 'backup', 'upload', 'deploy', 'verify'])
    args = parser.parse_args()
    if args.action == 'package':
        package()
    else:
        c = config()
        {'check': check, 'backup': backup, 'upload': upload, 'deploy': deploy, 'verify': verify}[args.action](c)


if __name__ == '__main__':
    main()
