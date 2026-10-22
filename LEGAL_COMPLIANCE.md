# AI RAMU — Legal Compliance & Licensing Audit Report

**Date:** October 2026  
**Product:** AI RAMU  
**Owner:** `ganguydhrubo`  
**Upstream Reference:** OpenClaw / Moltbot / Clawdbot (`github.com/openclaw/openclaw`)  
**Upstream Maintainer:** OpenClaw Foundation & Peter Steinberger  

---

## 1. Upstream License Analysis

The primary upstream source code is licensed under the standard **MIT License**:

```text
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
```

### Commercial & Rebranding Evaluation

| Question | Assessment | Legal Basis |
| :--- | :--- | :--- |
| **Is commercial redistribution permitted?** | **YES** | MIT grants unconditional rights to "sell copies of the Software". |
| **Is modification and rebranding permitted?** | **YES** | MIT permits "use, copy, modify, merge, publish, distribute, sublicense". |
| **Are closed-source/proprietary extensions allowed?** | **YES** | MIT is a permissive license without copyleft obligations (unlike GPL/AGPL). |
| **Are upstream trademarks protected?** | **YES (Reserved)** | Trademarks (*OpenClaw*, *Clawdbot*, *Moltbot*, logos) are not granted for confusingly similar endorsements. AI RAMU must use 100% original branding. |
| **What are the mandatory conditions?** | **Attribution & Notice** | The original copyright notice (`Copyright (c) 2026 OpenClaw Foundation`) and MIT license text must be preserved in third-party notices. |

---

## 2. Third-Party Dependencies & Incorporated Components

1. **SQLite (`scripts/lib/sqlite-macos.json`)**:
   - License: **Public Domain**
   - Obligation: None; public domain code requires no license fee or restriction.

2. **Pi / pi-mono (`@earendil-works/pi-*`)**:
   - Copyright (c) 2025 Mario Zechner
   - License: **MIT License**
   - Obligation: Attribution preserved in `THIRD_PARTY_NOTICES.md`.

3. **Primer Octicons (`@primer/octicons`)**:
   - Copyright (c) 2026 GitHub Inc.
   - License: **MIT License**
   - Obligation: Attribution preserved in `THIRD_PARTY_NOTICES.md`.

4. **Hermes Agent Repetition Guard**:
   - Copyright (c) 2025 Nous Research
   - License: **MIT License**
   - Obligation: Attribution preserved in `THIRD_PARTY_NOTICES.md`.

---

## 3. Mandatory Compliance Checklist for AI RAMU

- [x] **Original Branding**: All customer-facing surfaces use **AI RAMU** ("Bolo Ramu, Kaam Shuru.").
- [x] **No False Affiliation**: Explicitly state that AI RAMU is an independent product and is not affiliated with or endorsed by Anthropic, OpenAI, or the OpenClaw Foundation.
- [x] **Attribution Preserved**: Upstream authors and contributors credited in `THIRD_PARTY_NOTICES.md` and `LICENSE`.
- [x] **Asset Cleansing**: Replaced all lobster/claw mascots, logos, and upstream marketing copy with original Indian-themed AI Ramu iconography and brand colors (Saffron, White, Deep Green, Charcoal).
- [x] **Commercial Foundation**: Established dual-distribution compatibility (open-source community foundation with commercial capability).
