/**
 * Suzuki Association of Pittsburgh — Admin AI Function
 *
 * Receives a natural-language request from the admin UI,
 * fetches the current website HTML from GitHub, asks Claude
 * to make the requested changes, then commits the result
 * back to GitHub (triggering auto-deploy via GitHub Actions).
 *
 * Required environment variables (set in Netlify dashboard):
 *   ADMIN_PASSWORD   — simple password protecting the admin UI
 *   ANTHROPIC_API_KEY — your Anthropic API key
 *   GITHUB_TOKEN     — GitHub Personal Access Token (repo write access)
 *   GITHUB_REPO      — repo in "owner/repo-name" format, e.g. "manoj/suzukipgh"
 */

const https = require('https');

// ─── CORS headers ───────────────────────────────────────────────────
const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};

// ─── Low-level HTTPS helper ─────────────────────────────────────────
function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

// ─── GitHub API helper ───────────────────────────────────────────────
function github(method, path, body, token) {
    return request(
        {
            hostname: 'api.github.com',
            path,
            method,
            headers: {
                Authorization: `token ${token}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'suzukipgh-admin-bot',
                'Content-Type': 'application/json',
            },
        },
        body
    );
}

// ─── Anthropic API helper ────────────────────────────────────────────
function callClaude(messages, systemPrompt, apiKey) {
    return request(
        {
            hostname: 'api.anthropic.com',
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
        },
        {
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 16000,
            system: systemPrompt,
            messages,
        }
    );
}

// ─── Fetch files from GitHub ─────────────────────────────────────────
async function fetchFiles(repo, token, files) {
    const result = {};
    await Promise.all(
        files.map(async (file) => {
            try {
                const res = await github('GET', `/repos/${repo}/contents/${file}`, null, token);
                if (res.status === 200) {
                    result[file] = {
                        content: Buffer.from(res.body.content, 'base64').toString('utf-8'),
                        sha: res.body.sha,
                    };
                }
            } catch (e) {
                console.error(`Could not fetch ${file}:`, e.message);
            }
        })
    );
    return result;
}

// ─── Commit changed files via Git Trees API ──────────────────────────
async function commitChanges(repo, token, changes, commitMessage) {
    // 1. Get current HEAD commit SHA
    const branchRes = await github('GET', `/repos/${repo}/git/ref/heads/main`, null, token);
    if (branchRes.status !== 200) throw new Error('Could not read main branch');
    const headSha = branchRes.body.object.sha;

    // 2. Get the tree SHA of HEAD
    const commitRes = await github('GET', `/repos/${repo}/git/commits/${headSha}`, null, token);
    const treeSha = commitRes.body.tree.sha;

    // 3. Create blobs for each changed file
    const treeItems = await Promise.all(
        changes.map(async (change) => {
            const blobRes = await github(
                'POST',
                `/repos/${repo}/git/blobs`,
                { content: change.content, encoding: 'utf-8' },
                token
            );
            return {
                path: change.file,
                mode: '100644',
                type: 'blob',
                sha: blobRes.body.sha,
            };
        })
    );

    // 4. Create new tree
    const newTreeRes = await github(
        'POST',
        `/repos/${repo}/git/trees`,
        { base_tree: treeSha, tree: treeItems },
        token
    );

    // 5. Create commit
    const newCommitRes = await github(
        'POST',
        `/repos/${repo}/git/commits`,
        {
            message: `[admin] ${commitMessage}`,
            tree: newTreeRes.body.sha,
            parents: [headSha],
        },
        token
    );

    // 6. Fast-forward main branch
    await github(
        'PATCH',
        `/repos/${repo}/git/refs/heads/main`,
        { sha: newCommitRes.body.sha },
        token
    );

    return newCommitRes.body.sha;
}

// ─── Extract section between markers ────────────────────────────────
function extractSection(content, startMarker, endMarker) {
    const start = content.indexOf(startMarker);
    const end = content.indexOf(endMarker);
    if (start === -1 || end === -1) return null;
    return content.substring(start + startMarker.length, end).trim();
}

// ─── Replace section between markers in a full file ──────────────────
function replaceSection(fullContent, startMarker, endMarker, newSection) {
    const start = fullContent.indexOf(startMarker);
    const end = fullContent.indexOf(endMarker);
    if (start === -1 || end === -1) return fullContent;
    return (
        fullContent.substring(0, start + startMarker.length) +
        '\n' + newSection + '\n            ' +
        fullContent.substring(end)
    );
}

// ─── Split a section's HTML into individual item blocks ──────────────
// Uses div-depth tracking so we can handle nested divs inside each item.
// `itemOpenRegex` matches the opening tag of each item, e.g. /<div class=['"]event-item['"]/
function splitItems(sectionHtml, itemOpenRegex) {
    const items = [];
    let searchFrom = 0;
    while (true) {
        itemOpenRegex.lastIndex = searchFrom;
        const openMatch = itemOpenRegex.exec(sectionHtml);
        if (!openMatch) break;
        const start = openMatch.index;

        // Walk forward tracking div depth. We just entered one div, so depth starts at 1.
        let depth = 1;
        let pos = start + 4; // past '<div'
        const openTag = /<div\b/g;
        const closeTag = /<\/div>/g;
        while (depth > 0) {
            openTag.lastIndex = pos;
            closeTag.lastIndex = pos;
            const nextOpen = openTag.exec(sectionHtml);
            const nextClose = closeTag.exec(sectionHtml);
            if (!nextClose) { pos = sectionHtml.length; break; }
            if (nextOpen && nextOpen.index < nextClose.index) {
                depth++;
                pos = nextOpen.index + 4;
            } else {
                depth--;
                pos = nextClose.index + 6; // past '</div>'
            }
        }
        items.push(sectionHtml.slice(start, pos));
        searchFrom = pos;
    }
    return items;
}

// ─── Extract <h3> text from an item block ────────────────────────────
function itemTitle(itemHtml) {
    const m = itemHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    if (!m) return '';
    return m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
}

// ─── Parse an event-item's date into a comparable number (ms) ────────
function eventDateMs(itemHtml) {
    const monthMap = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
    const monthM = itemHtml.match(/<span class=['"]month['"]>([^<]+)<\/span>/);
    const dayM   = itemHtml.match(/<span class=['"]day['"]>([^<]+)<\/span>/);
    const yearM  = itemHtml.match(/<span class=['"]year['"]>([^<]+)<\/span>/);
    if (!monthM || !dayM || !yearM) return Number.MAX_SAFE_INTEGER; // unknown dates sort last
    const mo = monthMap[monthM[1].trim().slice(0,3)];
    const d = parseInt(dayM[1], 10);
    const y = parseInt(yearM[1], 10);
    if (mo == null || isNaN(d) || isNaN(y)) return Number.MAX_SAFE_INTEGER;
    return new Date(y, mo, d).getTime();
}

// ─── Section config: how to find items + how to sort them ────────────
const SECTION_CONFIG = {
    EVENTS_LIST: {
        file: 'events.html',
        itemOpenRegex: /<div\s+class=['"]event-item['"]/g,
        sort: (items) => items.slice().sort((a, b) => eventDateMs(a) - eventDateMs(b)),
    },
    TEACHERS_LIST: {
        file: 'teachers.html',
        itemOpenRegex: /<div\s+class=['"]teacher-card['"]/g,
        sort: (items) => items, // keep insertion order
    },
};

// ─── Apply an op (add/remove/edit) to an item list ───────────────────
function applyOp(items, change) {
    const op = change.op;
    const matchText = (change.match || '').toLowerCase().trim();
    const matches = (item) => matchText && itemTitle(item).toLowerCase().includes(matchText);

    switch (op) {
        case 'add':
            if (!change.item) throw new Error("'add' op requires an 'item' field");
            return [...items, change.item.trim()];
        case 'remove': {
            if (!matchText) throw new Error("'remove' op requires a 'match' field");
            const kept = items.filter((it) => !matches(it));
            if (kept.length === items.length) throw new Error(`No item matched '${change.match}'`);
            return kept;
        }
        case 'edit': {
            if (!matchText) throw new Error("'edit' op requires a 'match' field");
            if (!change.item) throw new Error("'edit' op requires an 'item' field");
            let replaced = 0;
            const out = items.map((it) => {
                if (matches(it)) { replaced++; return change.item.trim(); }
                return it;
            });
            if (replaced === 0) throw new Error(`No item matched '${change.match}'`);
            return out;
        }
        default:
            throw new Error(`Unknown op: ${op}`);
    }
}

// ─── Build the Claude system prompt ──────────────────────────────────
function buildSystemPrompt(fileContents) {
    // For events and teachers, only show the section between markers (much smaller)
    const sections = [];

    if (fileContents['events.html']) {
        const eventsSection = extractSection(
            fileContents['events.html'].content,
            '<!-- EVENTS_LIST_START -->',
            '<!-- EVENTS_LIST_END -->'
        );
        if (eventsSection) {
            sections.push(`### CURRENT EVENTS (events.html)\nThese are the event items currently between the EVENTS_LIST_START and EVENTS_LIST_END markers:\n\`\`\`html\n${eventsSection}\n\`\`\``);
        }
    }

    if (fileContents['teachers.html']) {
        const teachersSection = extractSection(
            fileContents['teachers.html'].content,
            '<!-- TEACHERS_LIST_START -->',
            '<!-- TEACHERS_LIST_END -->'
        );
        if (teachersSection) {
            sections.push(`### CURRENT TEACHERS (teachers.html)\nThese are the teacher cards currently between the TEACHERS_LIST_START and TEACHERS_LIST_END markers:\n\`\`\`html\n${teachersSection}\n\`\`\``);
        }
    }

    // For other files, include them in full (they're smaller)
    const otherFiles = Object.entries(fileContents)
        .filter(([name]) => name !== 'events.html' && name !== 'teachers.html')
        .map(([name, { content }]) => `### FILE: ${name}\n\`\`\`html\n${content}\n\`\`\``)
        .join('\n\n');

    if (otherFiles) sections.push(otherFiles);

    return `You are the AI website assistant for the Suzuki Association of Pittsburgh, a small nonprofit music education organization in Pittsburgh, PA.

${sections.join('\n\n')}

CRITICAL: You MUST respond with valid JSON only. Never respond with plain text, markdown, or explanations outside of JSON. Every response must start with { and end with }.

RESPONSE FORMAT — emit surgical operations. NEVER re-emit the whole list; the server merges and sorts for you.

ADD an event or teacher — supply ONE item only:
{"message":"Added Spring Recital on Apr 19","changes":[{"file":"events.html","section":"EVENTS_LIST","op":"add","item":"<div class='event-item' data-category='recital'>...</div>"}]}

REMOVE an event or teacher — match case-insensitively against the <h3> title/name:
{"message":"Removed Spring Recital","changes":[{"file":"events.html","section":"EVENTS_LIST","op":"remove","match":"Spring Recital"}]}

EDIT an event or teacher — supply BOTH a match string AND the new item (server will swap it in):
{"message":"Updated the time for Spring Recital","changes":[{"file":"events.html","section":"EVENTS_LIST","op":"edit","match":"Spring Recital","item":"<div class='event-item' data-category='recital'>...</div>"}]}

For questions or clarifications — return JSON with empty changes:
{"message":"I need one more detail: what date is the event?","changes":[]}

VALID sections are "EVENTS_LIST" (file: events.html) and "TEACHERS_LIST" (file: teachers.html).

IMPORTANT: Use SINGLE QUOTES for all HTML attributes in the item field (the server and existing file handle both, but JSON-escaping double quotes is error-prone). Example:
CORRECT: <div class='event-item' data-category='recital'>
WRONG:   <div class="event-item" data-category="recital">

EVENT ITEM TEMPLATE (single quotes only):
<div class='event-item' data-category='recital'>
    <div class='event-date-badge'>
        <span class='month'>Apr</span>
        <span class='day'>19</span>
        <span class='year'>2026</span>
    </div>
    <div class='event-content'>
        <h3>Event Title Here</h3>
        <div class='event-meta'>
            <span class='event-time'>🕐 5:00 PM</span>
            <span class='event-location'>📍 Venue Name</span>
        </div>
        <p>Brief description.</p>
        <div class='event-address'>
            <strong>Location:</strong> Full address here
        </div>
    </div>
</div>

TEACHER CARD TEMPLATE (single quotes only):
<div class='teacher-card'>
    <div class='teacher-header'>
        <div class='teacher-icon'>🎹</div>
        <div>
            <h3>Teacher Name</h3>
            <p class='teacher-instrument'>Instrument</p>
        </div>
    </div>
    <p class='teacher-bio'>Bio here.</p>
    <div class='teacher-contact'>
        <p>📧 <a href='mailto:email@example.com'>email@example.com</a></p>
        <p>📞 (412) 555-0000</p>
    </div>
</div>

RULES:
- ALWAYS return JSON. Never return plain text — not even for questions or clarifications.
- For 'add' and 'edit', emit ONLY the single new item HTML in the 'item' field. Do NOT re-emit the whole list.
- Month abbreviations must be 3 letters: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec. The server uses these to sort events chronologically.
- Do not invent addresses, phone numbers, or details — only use what the admin provides
- Today is ${new Date().toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
- Use single quotes for all HTML attributes to avoid JSON escaping issues`;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────
exports.handler = async (event) => {
    // Preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: CORS, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }

    const { password, message, history = [] } = body;

    // ── Auth ──
    if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid password' }) };
    }

    // ── Handle ping (login validation) ──
    if (message === '__ping__') {
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ message: 'ok', changes: [] }) };
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

    if (!GITHUB_TOKEN || !GITHUB_REPO || !ANTHROPIC_API_KEY) {
        return {
            statusCode: 500,
            headers: CORS,
            body: JSON.stringify({ error: 'Missing environment variables. Check GITHUB_TOKEN, GITHUB_REPO, and ANTHROPIC_API_KEY in Netlify.' }),
        };
    }

    // ── Smart file selection — only load files relevant to the request ──
    const msg = message.toLowerCase();
    const filesToLoad = [];

    // Always include events.html (most commonly updated)
    filesToLoad.push('events.html');

    if (msg.includes('teacher') || msg.includes('contact') || msg.includes('phone') || msg.includes('email') || msg.includes('bio')) {
        filesToLoad.push('teachers.html');
    }
    if (msg.includes('home') || msg.includes('welcome') || msg.includes('announcement') || msg.includes('testimonial') || msg.includes('newsletter') || msg.includes('index')) {
        filesToLoad.push('index.html');
    }
    if (msg.includes('about') || msg.includes('suzuki method') || msg.includes('philosophy')) {
        filesToLoad.push('about.html');
    }
    if (msg.includes('program') || msg.includes('instrument offered') || msg.includes('what instruments')) {
        filesToLoad.push('programs.html');
    }
    if (msg.includes('contact page') || msg.includes('contact form') || msg.includes('google map')) {
        filesToLoad.push('contact.html');
    }

    // Only add index.html if explicitly about homepage content
    if (msg.includes('home') || msg.includes('welcome') || msg.includes('announcement') || msg.includes('testimonial') || msg.includes('newsletter')) {
        if (!filesToLoad.includes('index.html')) filesToLoad.push('index.html');
    }

    console.log('[admin-ai] loading files:', filesToLoad);

    let fileContents;
    try {
        fileContents = await fetchFiles(GITHUB_REPO, GITHUB_TOKEN, filesToLoad);
    } catch (e) {
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: `GitHub fetch failed: ${e.message}` }) };
    }

    // ── Call Claude ──
    const systemPrompt = buildSystemPrompt(fileContents);
    const messages = [
        ...history.slice(-8).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user', content: message },
    ];

    let claudeRes;
    try {
        claudeRes = await callClaude(messages, systemPrompt, ANTHROPIC_API_KEY);
    } catch (e) {
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: `AI request failed: ${e.message}` }) };
    }

    if (claudeRes.status !== 200) {
        return {
            statusCode: 500,
            headers: CORS,
            body: JSON.stringify({ error: 'Claude API error', details: claudeRes.body }),
        };
    }

    // ── Parse Claude's response ──
    let parsed;
    try {
        const rawText = claudeRes.body.content[0].text.trim();
        console.log('[admin-ai] raw Claude response (first 500 chars):', rawText.substring(0, 500));

        // 1. Strip markdown code fences if present
        let jsonStr = rawText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        // 2. If the string doesn't start with '{', try to find a JSON object inside it
        if (!jsonStr.startsWith('{')) {
            const match = jsonStr.match(/\{[\s\S]*\}/);
            if (match) jsonStr = match[0];
        }

        parsed = JSON.parse(jsonStr);
    } catch (e) {
        const rawText = claudeRes.body.content?.[0]?.text || '(no text)';
        console.error('[admin-ai] JSON parse failed. Raw text:', rawText.substring(0, 1000));
        return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'Could not parse AI response', hint: rawText.substring(0, 200) }) };
    }

    // ── Commit to GitHub if there are changes ──
    if (parsed.changes && parsed.changes.length > 0) {
        try {
            // For section-based changes, apply the op to the cached section HTML.
            // We never ask Claude to re-emit the whole list — it emits one item + an op,
            // and we splice/sort on the server. Keeps Claude output small and fast.
            const resolvedChanges = parsed.changes.map((change) => {
                if (change.section) {
                    const cfg = SECTION_CONFIG[change.section];
                    if (!cfg) throw new Error(`Unknown section: ${change.section}`);
                    const cached = fileContents[change.file] || fileContents[cfg.file];
                    if (!cached) throw new Error(`File for section ${change.section} was not loaded`);
                    const startMarker = `<!-- ${change.section}_START -->`;
                    const endMarker = `<!-- ${change.section}_END -->`;
                    const sectionHtml = extractSection(cached.content, startMarker, endMarker) || '';

                    let newBody;
                    if (change.op) {
                        const items = splitItems(sectionHtml, new RegExp(cfg.itemOpenRegex.source, 'g'));
                        const updated = applyOp(items, change);
                        const sorted = cfg.sort(updated);
                        newBody = sorted.join('\n\n            ');
                    } else if (change.content) {
                        // Back-compat: old-style full-section rewrite
                        newBody = change.content;
                    } else {
                        throw new Error("Change must include either 'op' or 'content'");
                    }

                    const newFullContent = replaceSection(cached.content, startMarker, endMarker, newBody);
                    return { file: cfg.file, content: newFullContent };
                }
                return change;
            });

            const commitSha = await commitChanges(
                GITHUB_REPO,
                GITHUB_TOKEN,
                resolvedChanges,
                parsed.message
            );
            parsed.commitUrl = `https://github.com/${GITHUB_REPO}/commit/${commitSha}`;
            parsed.deployUrl = `https://github.com/${GITHUB_REPO}/actions`;
        } catch (e) {
            return {
                statusCode: 500,
                headers: CORS,
                body: JSON.stringify({ error: `GitHub commit failed: ${e.message}` }),
            };
        }
    }

    return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify(parsed),
    };
};
