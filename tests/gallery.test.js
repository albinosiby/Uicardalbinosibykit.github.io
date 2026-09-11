import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { animations } from '../js/data.js';
import { prompts } from '../js/prompts.js';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('complete document renders every gallery entry without JavaScript',()=>{
  assert.match(html,/<body>/);
  assert.match(html,/<\/body>\s*<\/html>/);
  assert.equal(animations.length,30);
  assert.equal(new Set(animations.map(entry=>entry.id)).size,30);
  assert.equal((html.match(/<article class="card-item"/g)||[]).length,30);
  for(const entry of animations) {
    assert.ok(html.includes(`data-id="${entry.id}"`));
    assert.ok(entry.description.length>20);
  }
});
test('every local HTML dependency exists for static hosting',()=>{
  const resources=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match=>match[1]);
  for(const resource of resources) assert.ok(existsSync(new URL(`../${resource}`,import.meta.url)),resource);
});
test('all 30 prompts contain specific motion, accessibility and preservation guidance',()=>{
  assert.equal(Object.keys(prompts).length,30);
  assert.equal(new Set(Object.values(prompts)).size,30);
  for(const entry of animations) {
    const prompt=prompts[entry.id];
    assert.ok(prompt.includes(entry.name));
    assert.ok(prompt.includes('Motion behavior and states:'));
    assert.ok(prompt.includes('prefers-reduced-motion'));
    assert.ok(prompt.includes('preserving their current content, dimensions, typography, colors, styling, responsive behavior and functionality'));
    assert.ok(prompt.length>1500);
  }
});
