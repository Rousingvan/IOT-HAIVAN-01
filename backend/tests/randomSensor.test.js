import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  RANDOM_SENSOR_CONFIG,
  isOverHalf,
  clampSensorValue,
  buildRandomSensorPoint,
} from '../src/utils/randomSensor.js';

describe('Random Sensor Logic (De 3)', () => {
  test('RANDOM_SENSOR_CONFIG has correct max ranges', () => {
    assert.equal(RANDOM_SENSOR_CONFIG.s1.max, 11);
    assert.equal(RANDOM_SENSOR_CONFIG.s2.max, 101);
    assert.equal(RANDOM_SENSOR_CONFIG.s3.max, 1001);
  });

  describe('isOverHalf', () => {
    test('Sensor 1 (0-11): threshold is 5.5 (> 50%)', () => {
      assert.equal(isOverHalf(0, 11), false);
      assert.equal(isOverHalf(5, 11), false);
      assert.equal(isOverHalf(6, 11), true);
      assert.equal(isOverHalf(11, 11), true);
    });

    test('Sensor 2 (0-101): threshold is 50.5 (> 50%)', () => {
      assert.equal(isOverHalf(0, 101), false);
      assert.equal(isOverHalf(50, 101), false);
      assert.equal(isOverHalf(51, 101), true);
      assert.equal(isOverHalf(101, 101), true);
    });

    test('Sensor 3 (0-1001): threshold is 500.5 (> 50%)', () => {
      assert.equal(isOverHalf(0, 1001), false);
      assert.equal(isOverHalf(500, 1001), false);
      assert.equal(isOverHalf(501, 1001), true);
      assert.equal(isOverHalf(1001, 1001), true);
    });
  });

  describe('clampSensorValue', () => {
    test('clamps negative values to 0', () => {
      assert.equal(clampSensorValue(-5, 11), 0);
    });

    test('clamps values exceeding max to max', () => {
      assert.equal(clampSensorValue(20, 11), 11);
      assert.equal(clampSensorValue(150, 101), 101);
      assert.equal(clampSensorValue(2000, 1001), 1001);
    });

    test('rounds floats to nearest integer', () => {
      assert.equal(clampSensorValue(7.4, 11), 7);
      assert.equal(clampSensorValue(7.8, 11), 8);
    });
  });

  describe('buildRandomSensorPoint', () => {
    test('builds valid sensor data point with alerts', () => {
      const fixedDate = new Date('2026-11-05T08:00:00.000Z');
      const payload = {
        s1: 8,    // > 5.5 => alert
        s2: 40,   // <= 50.5 => safe
        s3: 750,  // > 500.5 => alert
        timestamp: fixedDate.toISOString(),
      };

      const point = buildRandomSensorPoint(payload, fixedDate);
      assert.equal(point.s1, 8);
      assert.equal(point.s2, 40);
      assert.equal(point.s3, 750);
      assert.equal(point.alert_s1, true);
      assert.equal(point.alert_s2, false);
      assert.equal(point.alert_s3, true);
      assert.equal(point.measured_at.toISOString(), fixedDate.toISOString());
    });

    test('handles fallback when payload has null or undefined', () => {
      const point = buildRandomSensorPoint({});
      assert.equal(typeof point.s1, 'number');
      assert.equal(typeof point.s2, 'number');
      assert.equal(typeof point.s3, 'number');
      assert.equal(typeof point.alert_s1, 'boolean');
      assert.ok(point.measured_at instanceof Date);
    });
  });
});

