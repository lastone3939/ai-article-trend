#!/usr/bin/env node
/**
 * 翻訳＋クリーニング処理
 * - 26日・27日の英語記事（翻訳済みでないもの）をGemini翻訳
 * - 日付ごとにいいね順TOP10を保持
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEMINI_KEY = 'AIzaSyDzMxdeiTPkbpkYNQSmCfWLNsjcBYx4qzA';
const TARGET_DATES = new Set(['2026-03-26', '2026-03-27']);

async function geminiTranslate(articles) {
  if (!articles.length) return;

  // まとめてプロンプト
  const pairs = articles.map((a, i) => `${i+1}. ${a.title}`).join('\n');
  const prompt = `以下はXポストの最初の1行（英語・多言語）です。
AI/テック系ニュースとして自然な日本語タイトルに翻訳してください。
ツイート調でなく、記事タイトルらしいわかりやすい日本語にしてください。
JSONオブジェクト { "1": "翻訳", "2": "翻訳", ... } の形式で返してください（コードブロック不要）:

${pairs}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
      }
    );
    if (!res.ok) {
      const t = await res.text();
      console.error('Gemini error:', res.status, t.substring(0, 200));
      return;
    }
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const map = JSON.parse(cleaned);

    for (let i = 0; i < articles.length; i++) {
      const translated = map[String(i+1)];
      if (translated) {
        articles[i].original_title = articles[i].title;
        articles[i].title = translated;
        articles[i].translated = true;
      }
    }
    console.log(`  ✅ 翻訳完了: ${Object.keys(map).length}件`);
  } catch(e) {
    console.error('  ⚠ Gemini翻訳失敗:', e.message);
  }
}

async function main() {
  const data = JSON.parse(readFileSync(join(__dirname, 'site_data.json'), 'utf-8'));

  // 対象日付の英語記事を翻訳（未翻訳のもの、上位10件）
  const toTranslate = data
    .filter(a => TARGET_DATES.has(a.date) && a.lang !== 'ja' && !a.translated)
    .sort((a,b) => (b.likes||0) - (a.likes||0))
    .slice(0, 10);

  if (toTranslate.length) {
    console.log(`🌐 翻訳対象: ${toTranslate.length}件`);
    toTranslate.forEach((a,i) => console.log(`  ${i+1}. [${a.likes}♡] ${a.title.substring(0,70)}`));
    await geminiTranslate(toTranslate);
  } else {
    console.log('翻訳対象なし');
  }

  // 日付別サマリー
  const byDate = {};
  for (const a of data) {
    const d = a.date || a.collected_at || 'unknown';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(a);
  }

  console.log('\n📊 日付別・採用記事:');
  for (const [d, arts] of Object.entries(byDate).sort()) {
    if (TARGET_DATES.has(d)) {
      console.log(`\n  ${d} (${arts.length}件):`);
      arts.sort((a,b)=>(b.likes||0)-(a.likes||0)).forEach((a,i) => {
        const flag = a.lang === 'ja' ? '🇯🇵' : '🌍';
        console.log(`    ${i+1}. ${flag} [${a.likes}♡] ${a.title.substring(0,60)}`);
      });
    }
  }

  // 保存
  writeFileSync(join(__dirname, 'site_data.json'), JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n✅ 保存完了: ${data.length}件`);
}

main().catch(e => { console.error(e); process.exit(1); });
