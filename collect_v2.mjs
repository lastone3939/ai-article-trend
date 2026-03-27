#!/usr/bin/env node
/**
 * 記事収集スクリプト v2
 * - 2026-03-26・2026-03-27の記事を収集
 * - いいね50以上
 * - 日付ごとに上位10件のみ保存
 * - 英語上位10件をGemini翻訳
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOCIALDATA_KEY = '6002|5AVYyg0Jn90fUHip030H2tXbPaGiyCLVcD54X8Siadee750d';
const GEMINI_KEY    = 'AIzaSyDzMxdeiTPkbpkYNQSmCfWLNsjcBYx4qzA';
const TARGET_DATES  = new Set(['2026-03-26', '2026-03-27']);
const MAX_PER_DAY   = 10;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ─── 日付パース ─── */
function parseDate(createdAt) {
  if (!createdAt) return null;
  // ISO形式 "2026-03-27T10:00:00.000000Z"
  if (createdAt.includes('T')) return createdAt.substring(0, 10);
  // Twitter形式 "Thu Mar 27 10:00:00 +0000 2026"
  try {
    const d = new Date(createdAt);
    if (!isNaN(d)) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch(e){}
  return null;
}

function toIso(createdAt) {
  if (!createdAt) return '2026-03-27T00:00:00.000000Z';
  if (createdAt.includes('T')) return createdAt;
  try {
    return new Date(createdAt).toISOString().replace('Z', '.000000Z');
  } catch(e){ return '2026-03-27T00:00:00.000000Z'; }
}

/* ─── SocialData 検索 ─── */
async function socialSearch(query, sinceDate, untilDate) {
  const q = encodeURIComponent(`${query} since:${sinceDate} until:${untilDate}`);
  const url = `https://api.socialdata.tools/twitter/search?query=${q}&type=Latest`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${SOCIALDATA_KEY}`, Accept: 'application/json' }
    });
    if (!res.ok) {
      const txt = await res.text();
      console.warn(`  ⚠ API ${res.status}: ${txt.substring(0, 120)}`);
      return [];
    }
    const data = await res.json();
    const tweets = data.tweets || data.data || [];
    return tweets;
  } catch(e) {
    console.warn(`  ⚠ fetch error: ${e.message}`);
    return [];
  }
}

/* ─── タグ抽出 ─── */
function extractTags(text, lang) {
  const tags = new Set();
  const lower = text.toLowerCase();
  const kws = { Claude:'claude', ChatGPT:'chatgpt', Gemini:'gemini',
                OpenClaw:'openclaw', Cursor:'cursor', Anthropic:'anthropic',
                Copilot:'copilot', '生成AI':'生成ai', GPT:'gpt-' };
  for (const [tag, kw] of Object.entries(kws)) {
    if (lower.includes(kw)) tags.add(tag);
  }
  if (lower.includes('llm') || lower.includes('language model')) tags.add('AI');
  tags.add('AI');
  return [...tags].slice(0, 5);
}

/* ─── カテゴリ判定 ─── */
function getCategory(text) {
  const lower = text.toLowerCase();
  if (/github|open.?source|oss|repository|repo|starred|commit/.test(lower)) return 'GitHub/OSS';
  if (/prompt|プロンプト|自動化|automat|workflow|zapier|n8n/.test(lower)) return 'スキル系';
  return 'AI系';
}

/* ─── ツイート→記事 ─── */
function tweetToArticle(tweet, forceDate) {
  const id   = String(tweet.id_str || tweet.id || Math.random());
  const text = tweet.full_text || tweet.text || '';
  const user = tweet.user || {};
  const likes = tweet.favorite_count || tweet.favourites_count || 0;
  const retweets = tweet.retweet_count || 0;
  const bookmarks = tweet.bookmark_count || tweet.quote_count || 0;
  const views = tweet.views?.count || tweet.view_count || 0;

  // 言語
  let lang = tweet.lang || 'en';
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) lang = 'ja';

  // 日付
  const rawDate = parseDate(tweet.created_at);
  const date = rawDate && TARGET_DATES.has(rawDate) ? rawDate : forceDate;
  const isoDate = toIso(tweet.created_at);

  // タイトル = 最初の改行まで or 100文字
  const firstLine = text.split('\n')[0].trim();
  const title = firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;

  // カバー画像
  const media = tweet.entities?.media || tweet.extended_entities?.media || [];
  const cover_url = media.find(m => m.type === 'photo')?.media_url_https || '';

  const tags = extractTags(text, lang);

  return {
    id,
    title,
    body: text,
    preview: text.substring(0, 200).replace(/\n/g, ' '),
    cover_url,
    url: `https://x.com/${user.screen_name || 'i'}/status/${id}`,
    author_name: user.name || '',
    author_screen_name: user.screen_name || '',
    author_followers: user.followers_count || 0,
    likes,
    retweets,
    bookmarks,
    views,
    created_at: isoDate,
    collected_at: date,
    is_today: date === '2026-03-27',
    is_yesterday: date === '2026-03-26',
    translated: false,
    original_title: '',
    lang,
    tags,
    // 新フィールド
    date,
    region: lang === 'ja' ? '🇯🇵 日本' : '🌍 海外',
    category: getCategory(text),
  };
}

/* ─── Gemini翻訳 ─── */
async function translateTitles(articles) {
  if (!articles.length) return;
  const titles = articles.map(a => a.title);
  const prompt = `以下の英語/中国語タイトルを自然な日本語AI記事タイトルに翻訳してください。
JSON形式 { "元タイトル": "和訳" } で返してください（コードブロック不要）:
${titles.map((t,i)=>`${i+1}. ${t}`).join('\n')}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}],
          generationConfig:{temperature:0.2, maxOutputTokens:2048} }) }
    );
    if (!res.ok) { console.warn('  ⚠ Gemini:', res.status); return; }
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const json = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const map  = JSON.parse(json);
    for (const a of articles) {
      if (map[a.title]) {
        a.original_title = a.title;
        a.title = map[a.title];
        a.translated = true;
      }
    }
    console.log(`  ✅ 翻訳完了 ${Object.keys(map).length}件`);
  } catch(e) {
    console.warn('  ⚠ 翻訳失敗:', e.message);
  }
}

/* ─── 既存記事にフィールド追加 ─── */
function enrichOld(a) {
  const rawDate = a.date || parseDate(a.created_at) || a.collected_at || '2026-03-19';
  const lang = a.lang || 'ja';
  return {
    ...a,
    date: rawDate,
    region: a.region || (lang === 'ja' ? '🇯🇵 日本' : '🌍 海外'),
    category: a.category || getCategory((a.title||'') + ' ' + (a.body||'')),
  };
}

/* ─── メイン ─── */
async function main() {
  // 既存データ
  const existing = JSON.parse(readFileSync(join(__dirname,'site_data.json'),'utf-8'));
  const existingIds = new Set(existing.map(a => a.id));
  console.log(`📂 既存: ${existing.length}件`);

  // クエリ一覧
  const QUERIES = [
    // 英語系
    {q:'Claude AI min_faves:50',            ja:false},
    {q:'ChatGPT min_faves:50',              ja:false},
    {q:'Gemini AI min_faves:50',            ja:false},
    {q:'Anthropic min_faves:50',            ja:false},
    {q:'LLM agent min_faves:50',            ja:false},
    {q:'github stars AI min_faves:50',      ja:false},
    {q:'AI coding tool min_faves:50',       ja:false},
    // 日本語
    {q:'Claude OR ChatGPT lang:ja min_faves:50', ja:true},
    {q:'AI 活用 lang:ja min_faves:50',           ja:true},
  ];

  // 収集バケツ: date -> [ article ]
  const bucket = { '2026-03-26': [], '2026-03-27': [] };
  const seenIds = new Set(existingIds);

  for (const {q, ja} of QUERIES) {
    console.log(`\n🔍 "${q}"`);
    // 26日分と27日分を別々に取得
    for (const [since, until, forceDate] of [
      ['2026-03-26','2026-03-27','2026-03-26'],
      ['2026-03-27','2026-03-28','2026-03-27'],
    ]) {
      const tweets = await socialSearch(q, since, until);
      let added = 0;
      for (const tw of tweets) {
        const likes = tw.favorite_count || tw.favourites_count || 0;
        if (likes < 50) continue;
        const id = String(tw.id_str || tw.id);
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        const article = tweetToArticle(tw, forceDate);
        bucket[forceDate].push(article);
        added++;
      }
      console.log(`  ${since}: ${tweets.length}件取得, いいね50以上の新規: ${added}件`);
      await sleep(400);
    }
  }

  // 各日付で上位10件（いいね順）を選ぶ
  const selected = [];
  for (const [date, articles] of Object.entries(bucket)) {
    articles.sort((a,b) => b.likes - a.likes);
    // 世界8:日本2の比率
    const ja  = articles.filter(a => a.lang === 'ja');
    const en  = articles.filter(a => a.lang !== 'ja');
    // 上位を組み合わせ
    const pick = [];
    let ei = 0, ji = 0;
    while (pick.length < MAX_PER_DAY && (ei < en.length || ji < ja.length)) {
      // 8:2比率 → 最初8件はenから、残り2件はjaから
      if (pick.length < 8 && ei < en.length) {
        pick.push(en[ei++]);
      } else if (ji < ja.length) {
        pick.push(ja[ji++]);
      } else if (ei < en.length) {
        pick.push(en[ei++]);
      } else break;
    }
    selected.push(...pick);
    console.log(`\n📅 ${date}: en=${en.length}件, ja=${ja.length}件 → ${pick.length}件選定`);
  }

  // 英語上位10件を翻訳
  const toTranslate = selected
    .filter(a => a.lang !== 'ja' && !a.translated)
    .sort((a,b) => b.likes - a.likes)
    .slice(0, 10);

  if (toTranslate.length) {
    console.log(`\n🌐 Gemini翻訳: ${toTranslate.length}件`);
    await translateTitles(toTranslate);
  }

  // 既存記事をenrichして、対象日付以外のものだけ残す
  // （26日・27日は新規収集分で上書き）
  const oldKept = existing
    .filter(a => {
      const d = a.date || parseDate(a.created_at) || a.collected_at || '';
      return !TARGET_DATES.has(d);
    })
    .map(enrichOld);

  // 古い記事も日付ごとに上位10件に絞る
  const oldByDate = {};
  for (const a of oldKept) {
    const d = a.date || a.collected_at || 'unknown';
    if (!oldByDate[d]) oldByDate[d] = [];
    oldByDate[d].push(a);
  }
  const oldFiltered = [];
  for (const [d, arts] of Object.entries(oldByDate)) {
    arts.sort((a,b) => (b.likes||0) - (a.likes||0));
    oldFiltered.push(...arts.slice(0, MAX_PER_DAY));
  }

  // マージ
  const allArticles = [...oldFiltered, ...selected];
  allArticles.sort((a,b) => (b.likes||0) - (a.likes||0));

  writeFileSync(
    join(__dirname, 'site_data.json'),
    JSON.stringify(allArticles, null, 2),
    'utf-8'
  );

  // サマリー
  const byDate = {};
  for (const a of allArticles) {
    const d = a.date || a.collected_at || 'unknown';
    byDate[d] = (byDate[d] || 0) + 1;
  }

  console.log(`\n✅ site_data.json 保存完了: ${allArticles.length}件`);
  console.log('\n📊 日付別件数:');
  for (const [d, n] of Object.entries(byDate).sort()) console.log(`  ${d}: ${n}件`);

  console.log('\n🆕 新規追加:');
  console.log(`  2026-03-26: ${bucket['2026-03-26'].length}件収集 → ${selected.filter(a=>a.date==='2026-03-26').length}件採用`);
  console.log(`  2026-03-27: ${bucket['2026-03-27'].length}件収集 → ${selected.filter(a=>a.date==='2026-03-27').length}件採用`);
}

main().catch(e => { console.error(e); process.exit(1); });
