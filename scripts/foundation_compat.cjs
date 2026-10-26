'use strict';
// Shadow adapter only: no writes, no runtime import, no title-based identity matching.
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
function readGenerated(file, name, root = ROOT) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const marker = `const ${name} = `;
  if (!text.includes(marker) || !text.endsWith(';\n')) throw new Error(`Invalid generated ${file}`);
  return JSON.parse(text.split(marker)[1].slice(0, -2));
}
function resolveAlias(bundle, input) {
  const direct = bundle.registry.aliases.find(a => a.alias === input);
  if (direct?.kind === 'legacy-id') return {target: direct.target, state: {}};
  let url;
  try { url = new URL(input, 'https://ysfmyfpvwb-afk.github.io/the-kingverse/'); } catch { return null; }
  if (!['https://ysfmyfpvwb-afk.github.io', 'http://127.0.0.1:8765', 'http://localhost:8765'].includes(url.origin)) return null;
  if (!['/', '/index.html', '/the-kingverse/', '/the-kingverse/index.html'].includes(url.pathname)) return null;
  const [view, query = ''] = url.hash.slice(1).split('?');
  if (!['books', 'stories', 'films', 'tower'].includes(view)) return null;
  const params = new URLSearchParams(query);
  const alias = bundle.registry.aliases.find(a => a.kind === 'legacy-id' && a.alias === params.get('item'));
  if (!alias) return null;
  // A book identity must never accidentally resolve from the films view.
  if (!alias.alias.startsWith(view+':')) return null;
  if (view==='books'&&!['work','collection'].includes(alias.target.type))return null;
  if (view==='stories'&&alias.target.type!=='work')return null;
  return {target: alias.target, state: {view, q: params.get('q') || '', filter: params.get('filter') || '', sort: params.get('sort') || '', language: ['en','nl'].includes(url.searchParams.get('lang')) ? url.searchParams.get('lang') : null}};
}
function projectLegacyRecord(bundle, legacyWorkId) {
  const match = resolveAlias(bundle, legacyWorkId);
  if (!match || match.target.type !== 'work') throw new Error(`Unmapped work ${legacyWorkId}`);
  const work = bundle.works.find(w => w.id === match.target.id);
  const publication = bundle.publicationEvents.find(p => p.subject.id === work.id);
  const editions = bundle.editions.filter(e => e.publicationOf.id === work.id);
  const people = new Map(bundle.people.map(p => [p.id, p]));
  const authors = bundle.credits.filter(c => c.subject.id === work.id && ['author','coauthor'].includes(c.role)).map(c => people.get(c.personId).name);
  return {title: work.originalTitle, kind: work.kind, year: Number(publication.date.value.slice(0, 4)), reportedDate: publication.date.value, publisher: publication.publisher, authors, editions};
}
module.exports = {ROOT, readGenerated, resolveAlias, projectLegacyRecord};
