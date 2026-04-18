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
            model: 'claude-sonnet-4-6',
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

// ─── Build the Claude system prompt ──────────────────────────────────
function buildSystemPrompt(fileContents) {
    const files = Object.entries(fileContents)
        .map(([name, { content }]) => `### FILE: ${name}\n\`\`\`html\n${content}\n\`\`\``)
        .join('\n\n');

    return `You are the AI website assistant for the Suzuki Association of Pittsburgh, a small nonprofit music education organization in Pittsburgh, PA.

You have access to the full HTML source of the website. When the admin asks you to make a change, produce a JSON response describing what to update.

${files}

RESPONSE FORMAT — always respond with valid JSON, nothing else:

If changes are needed:
{
  "message": "Plain English summary of what you changed (1-2 sentences)",
  "changes": [
    { "file": "filename.html", "content": "COMPLETE new content of that file" }
  ]
}

If no file changes are needed (answering a question, asking for clarification, etc.):
{
  "message": "Your answer here",
  "changes": []
}

RULES:
- Return the COMPLETE file content for any file you modify — never partial content or diffs
- Preserve all navigation, footer, CSS links, JS scripts, and existing structure exactly
- For event cards, use the existing .event-item HTML structure
- For teacher cards, use the existing .teacher-card HTML structure
- Keep events sorted chronologically (earliest first)
- Do not invent addresses, phone numbers, or details — only use what the admin provides
- If the request is ambiguous, ask a clarifying question (with empty changes array)
- Be concise in your message — the admin just needs to know what changed`;
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

    // ── Fetch current website files ──
    const filesToLoad = ['events.html', 'teachers.html', 'index.html', 'about.html', 'contact.html', 'programs.html'];
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
            const commitSha = await commitChanges(
                GITHUB_REPO,
                GITHUB_TOKEN,
                parsed.changes,
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
