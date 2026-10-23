# Third-party notices

AI RAMU installs and modifies the following software. Their licenses apply to those
components. The installed engine also ships its own `LICENSE` and
`THIRD_PARTY_NOTICES.md` inside `node_modules/openclaw/`, and they are kept unchanged.

## OpenClaw (engine)

- Source: https://github.com/openclaw/openclaw
- Package: `openclaw` on npm (exact version pinned in `package.json`)
- Modifications: user-facing text, icons and the web manifest are rebranded at install
  time by `scripts/rebrand-engine.mjs`. Integrity metadata is regenerated to match.
- "OpenClaw" and its logos are the upstream project's marks. AI RAMU uses its own name and
  logo and does not claim endorsement.

```
MIT License

Copyright (c) 2026 OpenClaw Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Notices carried by the engine

The following is reproduced from the engine's own `THIRD_PARTY_NOTICES.md`:

## SQLite

macOS standalone builds include SQLite, compiled by `scripts/build-mac-sqlite.sh`
from the source archive pinned in `scripts/lib/sqlite-macos.json`.

- Upstream: https://sqlite.org/
- License: Public domain (https://sqlite.org/copyright.html)

SQLite's source code is in the public domain. No copyright license is required
to use, copy, modify, or distribute it.

## Pi / pi-mono

Portions of OpenClaw were adapted from Pi / pi-mono, and OpenClaw also depends
on `@earendil-works/pi-tui` for terminal UI rendering.

- Upstream: https://github.com/earendil-works/pi-mono
- Package family: `@earendil-works/pi-*`
- License: MIT
- Copyright: Copyright (c) 2025 Mario Zechner

MIT License

Copyright (c) 2025 Mario Zechner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## GitHub Octicons

The Control UI bundles the `issue-opened-16` and `git-pull-request-16` icon paths.

- Upstream: https://github.com/primer/octicons
- License: MIT
- Copyright: Copyright (c) 2026 GitHub Inc.

MIT License

Copyright (c) 2026 GitHub Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Hermes Agent

OpenClaw's live repetition guard adapts the bounded streaming checks, repeated
text detection, and sampled exact-period expansion from Hermes Agent.

- Upstream: https://github.com/NousResearch/hermes-agent
- Source: https://github.com/NousResearch/hermes-agent/blob/acc3cada0da86c81efc8aa6c5a291989549ca900/agent/repetition_guard.py
- OpenClaw source: `packages/agent-core/src/repetition-guard.ts`
- License: MIT
- Copyright: Copyright (c) 2025 Nous Research

MIT License

Copyright (c) 2025 Nous Research

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
