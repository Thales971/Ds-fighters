#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const profileSource = fs.readFileSync(path.join(ROOT, 'js/core/profile.js'), 'utf8');
const audioSource = fs.readFileSync(path.join(ROOT, 'js/engine/audio.js'), 'utf8');

class MockGain {
  constructor() {
    this.gain = { value: 0 };
  }

  connect(target) {
    return target;
  }
}

class MockBufferSource {
  constructor(context) {
    this.context = context;
    this.buffer = null;
    this.loop = false;
    this.playbackRate = { value: 1 };
    this.onended = null;
    this.started = false;
    this.ended = false;
  }

  connect(target) {
    return target;
  }

  start() {
    this.started = true;
    this.context.sources.push(this);
  }

  emitEnded() {
    if (this.ended) return;
    this.ended = true;
    if (typeof this.onended === 'function') this.onended();
  }
}

class MockAudioContext {
  constructor() {
    this.destination = {};
    this.state = 'running';
    this.sampleRate = 48000;
    this.currentTime = 0;
    this.sources = [];
  }

  createGain() {
    return new MockGain();
  }

  createBufferSource() {
    return new MockBufferSource(this);
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }
}

class MockAudio {
  static instances = [];

  constructor(file) {
    this.src = file;
    this.loop = false;
    this.volume = 1;
    this.paused = true;
    this.onerror = null;
    MockAudio.instances.push(this);
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }

  removeAttribute(name) {
    if (name === 'src') this.src = '';
  }
}

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    setItem(key, value) { values.set(String(key), String(value)); },
    removeItem(key) { values.delete(String(key)); },
  };
}

function boot() {
  MockAudio.instances = [];
  let now = 0;
  let randomValues = [];
  const testMath = Object.create(Math);
  testMath.random = () => (randomValues.length ? randomValues.shift() : 0);
  const storage = makeStorage();
  const window = {
    localStorage: storage,
    matchMedia: () => ({ matches: false }),
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
  };
  const context = vm.createContext({
    console,
    Array,
    Audio: MockAudio,
    JSON,
    Math: testMath,
    Number,
    Object,
    Promise,
    Set,
    String,
    window,
    localStorage: storage,
    fetch: () => Promise.reject(new Error('playlist fetch is intentionally mocked out')),
    performance: { now: () => ++now },
  });
  vm.runInContext(profileSource, context, { filename: 'profile.js' });
  context.Profile = vm.runInContext('Profile', context);
  vm.runInContext(audioSource, context, { filename: 'audio.js' });
  const audio = vm.runInContext('AudioSys', context);
  const webAudio = new MockAudioContext();
  audio.ctx = webAudio;
  audio.buses = { sfx: webAudio.createGain(), voice: webAudio.createGain() };
  audio.enabled = true;
  audio.unlocked = true;
  audio.buffers = {};
  audio.music = null;
  audio.musicKind = null;
  audio.lastTrack = null;
  audio.voiceActive = 0;
  audio._voicePlaying = Object.create(null);
  audio._lastPlay = {};
  audio.loops = {};
  audio.pending = null;
  audio.playlist = { tracks: [], fallback: [], menu: null };
  return {
    context,
    audio,
    profile: context.Profile,
    webAudio,
    setRandom(values) { randomValues = values.slice(); },
  };
}

function closeTo(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, got ${actual}`);
}

function testDefaultBaseAndPlayContract() {
  const { audio, profile, webAudio } = boot();
  assert.equal(profile.defaults().settings.music, 0.35, 'profile default music is moderate');
  audio.playlist.fallback = [{ title: 'Fallback', file: 'fallback-a' }];
  audio.buffers.sfx = { duration: 0.1 };
  audio.playMusic('battle');
  closeTo(audio.music.volume, 0.35 * audio.musicMixFactor, 'normal music uses the moderate mix factor');
  assert.equal(audio.play('sfx'), true, 'play keeps returning true for available SFX');
  assert.equal(audio.play('missing'), false, 'play keeps returning false for missing buffers');
  assert.equal(webAudio.sources.length, 1, 'the available SFX creates one buffer source');
}

function testOverlappingVoicesDuckAndResume() {
  const { audio, webAudio } = boot();
  audio.playlist.fallback = [{ file: 'fallback-a' }];
  audio.buffers.v_a = { duration: 1 };
  audio.buffers.v_b = { duration: 2 };
  audio.playMusic('battle');
  const first = audio.voice('a');
  const duplicate = audio.voice('a');
  const second = audio.voice('b');
  assert.equal(first, true, 'first narrator starts');
  assert.equal(duplicate, true, 'duplicate narrator request is handled without stacking');
  assert.equal(second, true, 'a new narrator is allowed despite the play gap');
  assert.equal(webAudio.sources.length, 2, 'only distinct overlapping narrator buffers start');
  assert.equal(audio.voiceActive, 2, 'overlapping voices increment the active counter');
  closeTo(audio.music.volume, 0.35 * audio.musicMixFactor * 0.25, 'music ducks to one quarter while voices play');
  webAudio.sources[0].emitEnded();
  assert.equal(audio.voiceActive, 1, 'the first ended narrator decrements the counter');
  closeTo(audio.music.volume, 0.35 * audio.musicMixFactor * 0.25, 'music remains ducked until the last narrator ends');
  webAudio.sources[1].emitEnded();
  assert.equal(audio.voiceActive, 0, 'the last ended narrator clears the counter');
  closeTo(audio.music.volume, 0.35 * audio.musicMixFactor, 'music resumes after the last narrator ends');
}

function testMuteAndSafeVolumeClamping() {
  const { audio, profile } = boot();
  audio.playlist.fallback = [{ file: 'fallback-a' }];
  audio.buffers.v_a = { duration: 1 };
  audio.playMusic('battle');
  profile.data.settings.mute = true;
  audio.applyVolumes();
  assert.equal(audio.music.volume, 0, 'mute keeps music silent before and during narration');
  audio.voice('a');
  assert.equal(audio.music.volume, 0, 'narrator ducking does not unmute a muted mix');
  audio.applyVolumes();
  assert.equal(audio.music.volume, 0, 'reapplying volumes during narration remains muted');
  audio.ctx.sources[0].emitEnded();
  assert.equal(audio.music.volume, 0, 'ending narration does not unmute the mix');

  profile.data.settings.mute = false;
  profile.data.settings.music = 5;
  profile.data.settings.sfx = -4;
  profile.data.settings.voice = Number.NaN;
  audio.applyVolumes();
  closeTo(audio.music.volume, audio.musicMixFactor, 'finite high music settings clamp before mixing');
  assert.equal(audio.buses.sfx.gain.value, 0, 'negative SFX volume clamps to zero');
  assert.equal(audio.buses.voice.gain.value, 0.9, 'non-finite voice volume falls back safely');
  profile.data.settings.music = Number.NaN;
  closeTo(audio.vol('music'), 0.35, 'non-finite music volume uses the moderate default');
}

function testMissingVoiceAndMusicReplacement() {
  const { audio, webAudio } = boot();
  audio.playlist.fallback = [{ file: 'fallback-a' }, { file: 'fallback-b' }];
  audio.buffers.v_a = { duration: 1 };
  audio.playMusic('battle');
  const before = audio.music.volume;
  assert.equal(audio.voice('missing'), false, 'missing narrator buffers do not start or duck');
  assert.equal(audio.voiceActive, 0, 'missing narrator buffers leave no active voice');
  closeTo(audio.music.volume, before, 'missing narrator leaves music unchanged');
  audio.voice('a');
  const oldMusic = audio.music;
  audio.playMusic('battle');
  assert.notEqual(audio.music, oldMusic, 'replacing music creates a new HTMLAudio element');
  assert.equal(oldMusic.paused, true, 'replaced music is stopped');
  closeTo(audio.music.volume, 0.35 * audio.musicMixFactor * 0.25, 'replacement inherits active voice ducking');
  webAudio.sources[0].emitEnded();
  closeTo(audio.music.volume, 0.35 * audio.musicMixFactor, 'replacement restores after the active voice ends');
}

function testDeterministicSelectionAndFallback() {
  const { audio, setRandom } = boot();
  audio.playlist = {
    tracks: [
      { title: 'Own A', file: 'own-a' },
      { title: 'Own A duplicate', file: 'own-a' },
      { title: 'Own B', file: 'own-b' },
    ],
    fallback: [{ file: 'fallback-a' }],
  };
  setRandom([0, 0, 0]);
  const first = audio.pickBattleTrack();
  const second = audio.pickBattleTrack();
  const third = audio.pickBattleTrack();
  assert.equal(first.file, 'own-a', 'own tracks are preferred and deterministic');
  assert.equal(second.file, 'own-b', 'the immediate previous track is excluded');
  assert.equal(third.file, 'own-a', 'selection continues to avoid an immediate repeat');

  audio.playlist.tracks = [];
  setRandom([0]);
  assert.equal(audio.pickBattleTrack().file, 'fallback-a', 'fallback tracks are used when own tracks are absent');

  audio.playlist.tracks = [{ file: 'missing-own' }];
  audio.playlist.fallback = [{ file: 'fallback-after-error' }];
  audio.lastTrack = null;
  setRandom([0, 0]);
  audio.playMusic('battle');
  const missing = audio.music;
  assert.equal(missing.src, 'missing-own', 'own music still gets the first opportunity');
  missing.onerror();
  assert.deepEqual(audio.playlist.tracks, [], 'failed own tracks are removed from the retry pool');
  assert.equal(audio.music.src, 'fallback-after-error', 'missing own music falls back to the original playlist');
}

function testVoicePlayGapIsForced() {
  const { audio, webAudio } = boot();
  audio.buffers.v_a = { duration: 1 };
  audio._lastPlay['v_a'] = 1;
  assert.equal(audio.voice('a'), true, 'voice bypasses the generic short play gap');
  assert.equal(webAudio.sources.length, 1, 'voice starts even when the generic gap is active');
}

function testEndOfTrackAdvancesWithoutStaleCallbacks() {
  const { audio, setRandom } = boot();
  audio.playlist = { tracks: [{ file: 'own-a' }, { file: 'own-b' }], fallback: [], menu: { file: 'menu' } };
  audio.buffers.v_a = { duration: 2 };
  setRandom([0, 0]);
  audio.playMusic('battle');
  const first = audio.music;
  assert.equal(first.loop, false, 'battle tracks advance rather than loop one file');
  audio.voice('a');
  first.onended();
  assert.equal(audio.music.src, 'own-b', 'ending a track chooses a different next track');
  closeTo(audio.music.volume, 0.35 * audio.musicMixFactor * 0.25, 'new track remains ducked during narration');
  audio.playMusic('menu');
  const menu = audio.music;
  assert.equal(menu.loop, true, 'the menu keeps its own loop');
  first.onended();
  assert.equal(audio.music, menu, 'stale music callback cannot replace the menu');
}

testDefaultBaseAndPlayContract();
testOverlappingVoicesDuckAndResume();
testMuteAndSafeVolumeClamping();
testMissingVoiceAndMusicReplacement();
testDeterministicSelectionAndFallback();
testVoicePlayGapIsForced();
testEndOfTrackAdvancesWithoutStaleCallbacks();
console.log('audio_mix_test: PASS (base, ducking, overlap, mute, clamps, replacement, selection, fallback, track end)');
