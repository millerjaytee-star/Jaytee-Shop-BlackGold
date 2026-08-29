import test from 'node:test';
import assert from 'node:assert/strict';
import { americanToDecimal, impliedProbability, devigTwoWay, evPerDollar, analyzeEvent, buildParlayCandidates } from '../logic.mjs';
import { sampleEvents } from '../sample-data.mjs';

test('odds conversions',()=>{assert.equal(americanToDecimal(150),2.5);assert.equal(americanToDecimal(-200),1.5);assert.ok(Math.abs(impliedProbability(100)-0.5)<1e-12)});
test('de-vig sums to one',()=>{const x=devigTwoWay(-110,-110);assert.ok(Math.abs(x.a+x.b-1)<1e-12);assert.ok(x.hold>0)});
test('EV calculation',()=>{assert.ok(Math.abs(evPerDollar(.55,-110)-.05)<.001)});
test('event analyzer returns ranked opportunities',()=>{const x=analyzeEvent(sampleEvents[0]);assert.ok(x.length>=6);for(let i=1;i<x.length;i++) assert.ok(x[i-1].score>=x[i].score)});
test('parlay candidates only use positive filtered legs',()=>{const x=analyzeEvent(sampleEvents[0]);const p=buildParlayCandidates(x);assert.ok(Array.isArray(p));p.forEach(c=>c.legs.forEach(l=>assert.ok(l.estimatedEdge>0)))});
