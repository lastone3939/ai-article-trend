#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY = 'AIzaSyDzMxdeiTPkbpkYNQSmCfWLNsjcBYx4qzA';
const TARGET = new Set(['2026-03-26', '2026-03-27']);

const data = JSON.parse(readFileSync(join(__dirname, 'site_data.json'), 'utf-8'));

const toTrans = data
  .filter(a => TARGET.has(a.date) && a.lang !== 'ja' && !a.translated)
  .sort((a, b) => b.likes - a.likes)
  .slice(0, 10);

console.log(`翻訳対象: ${toTrans.length}件`);

// 1件ずつ翻訳（確実に処理）
for (const article of toTrans) {
  const prompt = `以下のXポスト（英語/多言語）を、AI/テクノロジー記事タイトルとして自然な日本語（20〜40字程度）に翻訳してください。
翻訳結果の文字列のみ返してください（説明・引用符不要）:

${article.title}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 200 }
        })
      }
    );
    if (!res.ok) {
      console.warn(`  ⚠ ${res.status}`);
      continue;
    }
    const resp = await res.json();
    const translated = resp.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (translated && translated.length > 0) {
      article.original_title = article.title;
      article.title = translated;
      article.translated = true;
      console.log(`  ✅ ${article.title.substring(0,60)}`);
    }
  } catch(e) {
    console.warn(`  ⚠ error: ${e.message}`);
  }

  await new Promise(r => setTimeout(r, 300));
}

writeFileSync(join(__dirname, 'site_data.json'), JSON.stringify(data, null, 2), 'utf-8');
console.log('\n✅ 翻訳・保存完了');

// 最終サマリー
const byDate = {};
for (const a of data) {
  const d = a.date || a.collected_at || 'unknown';
  if (!byDate[d]) byDate[d] = [];
  byDate[d].push(a);
}
for (const d of ['2026-03-26', '2026-03-27']) {
  const arts = (byDate[d] || []).sort((a,b) => b.likes - a.likes);
  console.log(`\n${d} (${arts.length}件):`);
  arts.forEach((a, i) => {
    const flag = a.lang === 'ja' ? '🇯🇵' : '🌍';
    const tr = a.translated ? '[翻]' : '';
    console.log(`  ${i+1}. ${flag}${tr} [${a.likes}♡] ${a.title.substring(0,55)}`);
  });
}
console.log(`\n総件数: ${data.length}件`);
