#!/usr/bin/env node
// Article collection script for 2026-03-26 and 2026-03-27
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SOCIALDATA_KEY = '6002|5AVYyg0Jn90fUHip030H2tXbPaGiyCLVcD54X8Siadee750d';
const GEMINI_KEY = 'AIzaSyDzMxdeiTPkbpkYNQSmCfWLNsjcBYx4qzA';

const TARGET_DATES = ['2026-03-26', '2026-03-27'];

// Queries: [query, isJapanese]
const QUERIES = [
  // English/World
  ['Claude AI min_faves:50', false],
  ['ChatGPT min_faves:50', false],
  ['Gemini AI min_faves:50', false],
  ['Anthropic min_faves:50', false],
  ['LLM agent min_faves:50', false],
  ['github stars AI min_faves:50', false],
  ['AI coding tool min_faves:50', false],
  // Japanese
  ['Claude OR ChatGPT lang:ja min_faves:50', true],
  ['AI 活用 lang:ja min_faves:50', true],
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getDateFromCreatedAt(createdAt) {
  if (!createdAt) return '2026-03-19';
  // created_at is like "2026-03-27T10:30:00.000000Z"
  return createdAt.substring(0, 10);
}

function isTargetDate(createdAt) {
  const dateStr = getDateFromCreatedAt(createdAt);
  return TARGET_DATES.includes(dateStr);
}

function getCategory(title, body, tags) {
  const text = (title + ' ' + (body || '') + ' ' + (tags || []).join(' ')).toLowerCase();
  const githubKeywords = ['github', 'oss', 'open source', 'repository', 'repo', 'star', 'starred', 'commit', 'pull request', 'open-source'];
  const skillKeywords = ['prompt', 'プロンプト', '自動化', 'automation', 'automate', 'workflow', 'zapier', 'make.com', 'n8n'];
  
  for (const kw of githubKeywords) {
    if (text.includes(kw)) return 'GitHub/OSS';
  }
  for (const kw of skillKeywords) {
    if (text.includes(kw)) return 'スキル系';
  }
  return 'AI系';
}

function getRegion(lang) {
  return lang === 'ja' ? '🇯🇵 日本' : '🌍 海外';
}

// Detect language heuristically for tweets without lang
function detectLang(text) {
  // Simple check: if contains Japanese characters, it's ja
  if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)) return 'ja';
  return 'en';
}

async function searchSocialData(query) {
  const url = `https://api.socialdata.tools/twitter/search?query=${encodeURIComponent(query + ' since:2026-03-26 until:2026-03-28')}&type=Latest`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${SOCIALDATA_KEY}`,
        'Accept': 'application/json',
      }
    });
    
    if (!res.ok) {
      console.error(`API error for query "${query}": ${res.status} ${res.statusText}`);
      return [];
    }
    
    const data = await res.json();
    return data.tweets || data.data || [];
  } catch (e) {
    console.error(`Fetch error for query "${query}":`, e.message);
    return [];
  }
}

async function translateWithGemini(titles) {
  if (!titles.length) return {};
  
  const prompt = `以下の英語タイトルを自然な日本語に翻訳してください。JSONオブジェクトで返してください。
キーは元の英語タイトル、値は日本語訳です。
タイトルが日本語らしくなるよう、AI/技術系の文脈で翻訳してください。

${titles.map((t, i) => `${i+1}. ${t}`).join('\n')}

JSONのみを返してください（コードブロックなし）:`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
        })
      }
    );
    
    if (!res.ok) {
      console.error('Gemini API error:', res.status, await res.text());
      return {};
    }
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Gemini translation error:', e.message);
    return {};
  }
}

function tweetToArticle(tweet, isJapanese) {
  const id = tweet.id_str || tweet.id || String(Math.random());
  const text = tweet.full_text || tweet.text || '';
  const user = tweet.user || {};
  
  // Determine language
  let lang = tweet.lang || (isJapanese ? 'ja' : 'en');
  if (!isJapanese && lang === 'ja') lang = 'ja';
  
  // Create title from first line or first 80 chars
  const firstLine = text.split('\n')[0];
  const title = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
  
  // Extract cover image
  const media = tweet.entities?.media || tweet.extended_entities?.media || [];
  const cover_url = media.find(m => m.type === 'photo')?.media_url_https || 
                    media.find(m => m.type === 'photo')?.media_url || '';
  
  const createdAt = tweet.created_at;
  // Convert Twitter date format if needed: "Thu Mar 27 10:00:00 +0000 2026"
  let isoDate = createdAt;
  if (createdAt && !createdAt.includes('T')) {
    try {
      isoDate = new Date(createdAt).toISOString().replace('Z', '.000000Z');
    } catch(e) {
      isoDate = '2026-03-27T00:00:00.000000Z';
    }
  }
  
  const dateStr = getDateFromCreatedAt(isoDate || '');
  const likes = tweet.favorite_count || tweet.favourites_count || 0;
  const retweets = tweet.retweet_count || 0;
  const bookmarks = tweet.bookmark_count || 0;
  const views = tweet.views?.count || tweet.view_count || 0;
  
  // Tags from hashtags
  const hashtags = (tweet.entities?.hashtags || []).map(h => h.text);
  const tags = extractTags(title + ' ' + text, hashtags, lang);
  
  return {
    id,
    title,
    body: text,
    preview: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
    cover_url,
    url: `https://x.com/${user.screen_name || 'unknown'}/status/${id}`,
    author_name: user.name || '',
    author_screen_name: user.screen_name || '',
    author_followers: user.followers_count || 0,
    likes,
    retweets,
    bookmarks,
    views,
    created_at: isoDate || `${dateStr}T00:00:00.000000Z`,
    collected_at: dateStr || '2026-03-27',
    is_today: dateStr === '2026-03-27',
    is_yesterday: dateStr === '2026-03-26',
    translated: false,
    original_title: '',
    lang,
    tags,
    // New fields
    date: dateStr || '2026-03-27',
    region: getRegion(lang),
    category: getCategory(title, text, tags),
  };
}

function extractTags(text, hashtags, lang) {
  const tags = new Set();
  const lower = text.toLowerCase();
  
  const keywords = ['Claude', 'ChatGPT', 'Gemini', 'OpenClaw', 'Cursor', 'Anthropic', 'GPT'];
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) tags.add(kw);
  }
  
  if (lower.includes('生成ai') || lower.includes('generative ai')) tags.add('生成AI');
  if (tags.size === 0 || lower.includes(' ai ') || lower.includes('\nai\n') || text.toLowerCase().endsWith(' ai')) {
    tags.add('AI');
  } else {
    tags.add('AI');
  }
  
  return [...tags].slice(0, 5);
}

// Add new fields to existing articles
function enrichExistingArticle(article) {
  const date = getDateFromCreatedAt(article.created_at) || article.collected_at || '2026-03-19';
  const lang = article.lang || detectLang(article.title + ' ' + (article.body || ''));
  
  return {
    ...article,
    date: article.date || date,
    region: article.region || getRegion(lang),
    category: article.category || getCategory(article.title, article.body, article.tags),
    is_today: article.is_today || false,
    is_yesterday: article.is_yesterday || false,
  };
}

async function main() {
  console.log('📚 既存データ読み込み中...');
  const existingData = JSON.parse(readFileSync(join(__dirname, 'site_data.json'), 'utf-8'));
  const existingIds = new Set(existingData.map(a => a.id));
  
  console.log(`既存: ${existingData.length}件`);
  
  // Enrich existing articles with new fields
  const enrichedExisting = existingData.map(enrichExistingArticle);
  
  // Collect new articles
  console.log('\n🌐 SocialData APIで記事収集中...');
  const newArticles = [];
  const seenIds = new Set(existingIds);
  
  for (const [query, isJapanese] of QUERIES) {
    console.log(`  🔍 "${query}" を検索中...`);
    const tweets = await searchSocialData(query);
    console.log(`     → ${tweets.length}件取得`);
    
    for (const tweet of tweets) {
      const likes = tweet.favorite_count || tweet.favourites_count || 0;
      if (likes < 50) continue;
      
      const id = tweet.id_str || tweet.id;
      if (seenIds.has(id)) continue;
      
      // Check if it's within target dates
      const createdAt = tweet.created_at;
      let isoDate = createdAt;
      if (createdAt && !createdAt.includes('T')) {
        try {
          isoDate = new Date(createdAt).toISOString();
        } catch(e) {}
      }
      
      if (!isTargetDate(isoDate)) continue;
      
      seenIds.add(id);
      const article = tweetToArticle(tweet, isJapanese);
      newArticles.push(article);
    }
    
    await sleep(500); // Rate limit
  }
  
  console.log(`\n新規収集: ${newArticles.length}件`);
  
  // Separate by language
  const jaArticles = newArticles.filter(a => a.lang === 'ja');
  const enArticles = newArticles.filter(a => a.lang !== 'ja');
  
  console.log(`  日本語: ${jaArticles.length}件`);
  console.log(`  英語/その他: ${enArticles.length}件`);
  
  // Sort by likes
  enArticles.sort((a, b) => b.likes - a.likes);
  jaArticles.sort((a, b) => b.likes - a.likes);
  
  // Translate top 10 English articles
  const toTranslate = enArticles.slice(0, 10);
  if (toTranslate.length > 0) {
    console.log(`\n🌐 Geminiで上位${toTranslate.length}件を翻訳中...`);
    const titles = toTranslate.map(a => a.title);
    const translations = await translateWithGemini(titles);
    
    for (const article of toTranslate) {
      if (translations[article.title]) {
        article.original_title = article.title;
        article.title = translations[article.title];
        article.translated = true;
      }
    }
    console.log('翻訳完了');
  }
  
  // Adjust ratio: 世界8:日本2
  // We want roughly 8:2 ratio, but respect the max 20 Japanese articles
  const totalNew = newArticles.length;
  
  // Limit Japanese to max 20
  const finalJa = jaArticles.slice(0, 20);
  
  // For world articles, take all of them (or limit to keep ratio)
  // Target: finalJa.length * 4 (to get 8:2 = 4:1 ratio) world articles
  const worldTarget = Math.max(enArticles.length, finalJa.length * 4);
  const finalEn = enArticles.slice(0, worldTarget);
  
  const finalNew = [...finalEn, ...finalJa];
  
  console.log(`\n最終新規記事: ${finalNew.length}件 (海外: ${finalEn.length}, 日本: ${finalJa.length})`);
  
  // Merge all articles
  const allArticles = [...enrichedExisting, ...finalNew];
  
  // Sort by likes for final output
  allArticles.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  
  // Save
  writeFileSync(
    join(__dirname, 'site_data.json'),
    JSON.stringify(allArticles, null, 2),
    'utf-8'
  );
  
  console.log(`\n✅ site_data.json 更新完了: ${allArticles.length}件`);
  
  // Stats
  const byDate = {};
  for (const a of allArticles) {
    const d = a.date || a.collected_at || 'unknown';
    byDate[d] = (byDate[d] || 0) + 1;
  }
  
  console.log('\n📊 日付別件数:');
  for (const [date, count] of Object.entries(byDate).sort()) {
    console.log(`  ${date}: ${count}件`);
  }
  
  return {
    total: allArticles.length,
    new: finalNew.length,
    byDate,
  };
}

main().catch(console.error);
