#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const profileSource = fs.readFileSync(path.join(ROOT, 'js/core/profile.js'), 'utf8');
const petsSource = fs.readFileSync(path.join(ROOT, 'js/data/pets.js'), 'utf8');
const spriteSource = fs.readFileSync(path.join(ROOT, 'js/engine/sprites.js'), 'utf8');

function makeStorage(initial) {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
  };
}

function bootProfile(initial) {
  const storage = makeStorage(initial);
  const context = vm.createContext({
    console,
    JSON,
    Math,
    Number,
    Object,
    Promise,
    String,
    Array,
    encodeURIComponent,
    window: { localStorage: storage, matchMedia: () => ({ matches: false }) },
    localStorage: storage,
    PETS: vm.runInNewContext(petsSource + '\nPETS', { console }),
  });
  vm.runInContext(profileSource, context, { filename: 'js/core/profile.js' });
  return { Profile: vm.runInContext('Profile', context), storage };
}

function testProfileShapeAndCloudMerge() {
  const legacy = JSON.stringify({
    unlocked: ['du'],
    pets: ['mistral', 'none'],
    stats: { fights: 3, wins: 2, bestArcade: 1, maxCombo: 4 },
  });
  const { Profile } = bootProfile({ 'dsfighters.profile.v2': legacy });
  assert.equal(JSON.stringify(Profile.data.skins), '{}', 'legacy profiles receive an empty skins map');
  assert.equal(Profile.data.stats.bestSurvival, undefined, 'legacy profile stats shape stays compatible');

  Profile.applyCloud({
    updatedAt: 10,
    profile: { skins: { stack: 210 }, stats: { bestSurvival: 7 } },
  });
  assert.equal(Profile.data.skins.stack, 210, 'newer cloud skin is preserved');
  assert.equal(Profile.skinFor('stack'), 0, 'disabled skins never change the fighter');
  assert.equal(Profile.setSkin('stack', 55), false, 'disabled skins cannot be saved');
  assert.equal(Profile.data.skins.stack, 210, 'old preferences are not erased');
  assert.equal(Profile.data.stats.bestSurvival, 7, 'newer cloud survival record is merged');

  Profile.SKINS_ENABLED = true; // Validate normalization independently of the disabled UI.
  Profile.setSkin('stack', 55);
  assert.equal(Profile.skinFor('stack'), 55, 'local skin update remains readable after save normalization');
  assert.equal(Profile.petFor(0).id, 'mistral', 'existing/new pet save IDs remain usable');
}

function makeCanvasContext() {
  const stack = [];
  const draws = [];
  return {
    filter: 'none',
    imageSmoothingEnabled: true,
    draws,
    save() { stack.push(this.filter); },
    restore() { this.filter = stack.pop(); },
    translate() {},
    scale() {},
    rotate() {},
    drawImage() { draws.push(this.filter); },
  };
}

function testSpriteFilterIsolation() {
  const context = vm.createContext({
    console,
    document: {},
    SPRITE_LAYOUT: {
      files: {},
      poses: ['idle'],
      frames: { idle: 1 },
      perFighter: {},
      drawScale: 1,
      frameW: 1,
      frameH: 1,
      baseline: 0,
    },
  });
  vm.runInContext(spriteSource, context, { filename: 'js/engine/sprites.js' });
  const sprite = vm.runInContext('SpriteGen', context);
  sprite.images.test = {};
  const canvas = makeCanvasContext();
  sprite.blit(canvas, 'test', 'idle', 0, 1, 0, 0, false, null, null, 120);
  assert.deepEqual(canvas.draws, ['hue-rotate(120deg)'], 'skin hue is applied while drawing');
  assert.equal(canvas.filter, 'none', 'skin hue does not leak into the caller canvas state');
}

testProfileShapeAndCloudMerge();
testSpriteFilterIsolation();
console.log('mistral_regressions_test: PASS');
