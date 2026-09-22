#!/usr/bin/env python3
"""One-off codemod: move src/ into shell/, kit/ and client/ and rewrite imports.

Run from artifacts/try-day. Idempotent enough to re-run after a partial move:
files already at their new path are skipped, import rewriting resolves through
both the old and the new locations.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys

ROOT = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
SRC = os.path.join(ROOT, 'src')

EXACT = {
    'App.tsx': 'shell/app/App.tsx',
    'components/error-boundary.tsx': 'shell/app/error-boundary.tsx',
    'components/learning-designer-panel.tsx': 'shell/app/learning-designer-panel.tsx',
    'components/device-advice.tsx': 'shell/app/device-advice.tsx',
    'components/experience-size-control.tsx': 'shell/app/experience-size-control.tsx',
    'components/briefing-video-modal.tsx': 'shell/app/briefing-video-modal.tsx',
    'components/welcome/LaunchView.tsx': 'shell/welcome/LaunchView.tsx',
    'components/welcome/BriefingView.tsx': 'shell/welcome/BriefingView.tsx',
    'pages/intro.tsx': 'shell/pages/intro.tsx',
    'pages/not-found.tsx': 'shell/pages/not-found.tsx',
    'pages/dev/interact-demo.tsx': 'shell/dev/interact-demo.tsx',
    'lib/progress-store.tsx': 'shell/lib/progress-store.tsx',
    'lib/experience-viewport.tsx': 'shell/lib/experience-viewport.tsx',
    'lib/scroll.ts': 'shell/lib/scroll.ts',
    'lib/use-document-title.ts': 'shell/lib/use-document-title.ts',
    'lib/simulation.ts': 'client/lib/simulation.ts',
    'lib/utils.ts': 'kit/lib/utils.ts',
    'lib/audio.ts': 'kit/lib/audio.ts',
    'content/step-guide.ts': 'shell/copy/step-guide.ts',
    'content/shell-accessibility.ts': 'shell/copy/shell-accessibility.ts',
    'content/experience-viewport.ts': 'shell/copy/experience-viewport.ts',
    'content/check.ts': 'kit/check.ts',
    'components/kitchen/analogue-thermometer.tsx': 'kit/analogue-thermometer.tsx',
    'components/kitchen/kitchen-scale.tsx': 'kit/kitchen-scale.tsx',
    'components/kitchen/kitchen-scale-display.ts': 'kit/kitchen-scale-display.ts',
    'components/kitchen/paper.tsx': 'kit/paper.tsx',
    'components/kitchen/log-book.tsx': 'kit/log-book.tsx',
    'components/kitchen/check-feedback.tsx': 'kit/check-feedback.tsx',
    'components/scenes/handover/dial-scale.ts': 'kit/dial-scale.ts',
    'components/scenes/handover/dial-thermometer.tsx': 'kit/dial-thermometer.tsx',
    'pages/close.tsx': 'client/pages/close.tsx',
}

PREFIX = [
    ('hooks/', 'kit/hooks/'),
    ('components/ui/', 'kit/ui/'),
    ('components/kitchen/interact/', 'kit/interact/'),
    ('components/kitchen/', 'shell/frame/'),
    ('components/scenes/', 'client/scenes/'),
    ('pages/tasks/', 'client/pages/tasks/'),
    ('content/', 'client/content/'),
    ('assets/', 'client/assets/'),
    ('lib/', 'client/lib/'),
]

KEEP = {'main.tsx', 'index.css'}

ALIASES = ['shell', 'kit', 'client']
EXTS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css']


def new_path_for(rel: str) -> str | None:
    if rel in KEEP:
        return None
    if rel in EXACT:
        return EXACT[rel]
    for old, new in PREFIX:
        if rel.startswith(old):
            return new + rel[len(old):]
    return None


def list_src_files() -> list[str]:
    out = []
    for dirpath, _dirs, files in os.walk(SRC):
        for f in files:
            out.append(os.path.relpath(os.path.join(dirpath, f), SRC))
    return sorted(out)


def build_mapping() -> dict[str, str]:
    mapping = {}
    for rel in list_src_files():
        # Already moved files map to themselves.
        if rel.split('/')[0] in ALIASES:
            continue
        new = new_path_for(rel)
        if new is None:
            if rel not in KEEP:
                print('UNMAPPED', rel, file=sys.stderr)
            continue
        mapping[rel] = new
    return mapping


def git_mv(mapping: dict[str, str]) -> None:
    for old, new in mapping.items():
        src = os.path.join(SRC, old)
        dst = os.path.join(SRC, new)
        if not os.path.exists(src):
            continue
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        subprocess.run(['git', 'mv', src, dst], check=True, cwd=ROOT)


IMPORT_RE = re.compile(r"""((?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"]))([^'"\n]+)(\2)""")


def strip_ext(p: str) -> tuple[str, str]:
    for e in EXTS:
        if p.endswith(e):
            return p[: -len(e)], e
    return p, ''


class Rewriter:
    def __init__(self, mapping: dict[str, str]):
        # extensionless old path -> extensionless new path (and exact with ext)
        self.by_old: dict[str, str] = {}
        self.exists_new: set[str] = set()
        for old, new in mapping.items():
            self.by_old[old] = new
            o, _ = strip_ext(old)
            n, _ = strip_ext(new)
            self.by_old.setdefault(o, n)
            self.exists_new.add(new)
            self.exists_new.add(n)
        # Everything currently under src/ counts as a valid target too.
        for rel in list_src_files():
            self.exists_new.add(rel)
            self.exists_new.add(strip_ext(rel)[0])

    def resolve_old(self, spec_path: str) -> str | None:
        """spec_path is an old src-relative path (maybe extensionless, maybe a dir)."""
        candidates = [spec_path, spec_path + '/index']
        for c in candidates:
            if c in self.by_old:
                return self.by_old[c]
        # Already-new path?
        for c in candidates:
            if c in self.exists_new:
                return c
        return None

    def rewrite(self, file_abs: str, text: str) -> str:
        file_rel = os.path.relpath(file_abs, SRC)
        in_src = not file_rel.startswith('..')
        new_dir = os.path.dirname(file_rel) if in_src else None

        def target_for(spec: str) -> str | None:
            if spec.startswith('@/'):
                old = spec[2:]
            elif spec.startswith(('@shell/', '@kit/', '@client/')):
                old = spec[1:]
            elif spec.startswith('.'):
                base_dir = self.old_dir_of(file_abs)
                if base_dir is None:
                    absolute = os.path.normpath(os.path.join(os.path.dirname(file_abs), spec))
                    old = os.path.relpath(absolute, SRC)
                else:
                    old = os.path.normpath(os.path.join(base_dir, spec))
                if old.startswith('..'):
                    return None
            else:
                return None
            return self.resolve_old(old)

        def emit(new_target: str) -> str:
            top = new_target.split('/')[0]
            if in_src and new_dir is not None and os.path.dirname(new_target) == new_dir:
                name = os.path.basename(new_target)
                return './' + name
            if in_src and new_dir is not None and new_target.startswith(new_dir + '/') and top not in ALIASES:
                return './' + os.path.relpath(new_target, new_dir)
            if top in ALIASES:
                return '@' + new_target
            # A file left at src/ root (main.tsx) from inside src
            if in_src:
                rel = os.path.relpath(new_target, new_dir or '.')
                return rel if rel.startswith('.') else './' + rel
            rel = os.path.relpath(os.path.join(SRC, new_target), os.path.dirname(file_abs))
            return rel if rel.startswith('.') else './' + rel

        def sub(m: re.Match) -> str:
            spec = m.group(3)
            tgt = target_for(spec)
            if tgt is None:
                return m.group(0)
            # Preserve an explicit extension only when the target was written with one
            _, ext = strip_ext(spec)
            out = emit(tgt)
            if ext and not out.endswith(ext):
                out += ext
            return m.group(1) + out + m.group(4)

        return IMPORT_RE.sub(sub, text)

    def old_dir_of(self, file_abs: str) -> str | None:
        """The directory this file lived in before the move, relative to src/ (or None outside src)."""
        rel = os.path.relpath(file_abs, SRC)
        if rel.startswith('..'):
            return None
        # If this file is at a new location, find which old path mapped to it.
        for old, new in self.by_old.items():
            if new == rel:
                return os.path.dirname(old)
        return os.path.dirname(rel)


def rewrite_tree(rw: Rewriter, dirs: list[str], exts=('.ts', '.tsx', '.mjs', '.js')) -> int:
    changed = 0
    for d in dirs:
        for dirpath, dirnames, files in os.walk(d):
            dirnames[:] = [x for x in dirnames if x not in ('node_modules', 'dist', '.git')]
            for f in files:
                if not f.endswith(exts):
                    continue
                p = os.path.join(dirpath, f)
                with open(p, encoding='utf-8') as fh:
                    text = fh.read()
                out = rw.rewrite(p, text)
                if out != text:
                    with open(p, 'w', encoding='utf-8') as fh:
                        fh.write(out)
                    changed += 1
    return changed


def main() -> None:
    mapping = build_mapping()
    print(f'{len(mapping)} files to move')
    if '--dry' in sys.argv:
        for o, n in mapping.items():
            print(f'{o} -> {n}')
        return
    rw = Rewriter(mapping)
    git_mv(mapping)
    n = rewrite_tree(rw, [SRC, os.path.join(ROOT, 'tests'), os.path.join(ROOT, 'e2e'), os.path.join(ROOT, 'scripts')])
    print(f'rewrote imports in {n} files')


if __name__ == '__main__':
    main()
