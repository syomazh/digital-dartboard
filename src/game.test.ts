import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoreHit, SEGMENTS } from "./game.ts";

describe("regulation dartboard scoring", () => {
  it("scores the inner bull, outer bull, and a miss", () => {
    assert.equal(scoreHit(0, 0).points, 50);
    assert.equal(scoreHit(0.1, 0).points, 25);
    assert.equal(scoreHit(2, 0).points, 0);
    assert.equal(scoreHit(0, -1.701).points, 0);
  });
  it("scores all twenty numbered segments clockwise from the top", () => {
    SEGMENTS.forEach((value, index) => {
      const angle = (index * Math.PI) / 10;
      assert.equal(
        scoreHit(Math.sin(angle) * 0.7, Math.cos(angle) * 0.7).points,
        value,
      );
      assert.equal(
        scoreHit(Math.sin(angle) * 1.02, Math.cos(angle) * 1.02).points,
        value * 3,
      );
      assert.equal(
        scoreHit(Math.sin(angle) * 1.64, Math.cos(angle) * 1.64).points,
        value * 2,
      );
    });
  });
  it("uses the correct scoring ring at each boundary", () => {
    assert.equal(scoreHit(0, 0.065).points, 50);
    assert.equal(scoreHit(0, 0.066).points, 25);
    assert.equal(scoreHit(0, 0.16).points, 25);
    assert.equal(scoreHit(0, 0.161).points, 20);
    assert.equal(scoreHit(0, 0.959).points, 20);
    assert.equal(scoreHit(0, 0.96).points, 60);
    assert.equal(scoreHit(0, 1.07).points, 60);
    assert.equal(scoreHit(0, 1.071).points, 20);
    assert.equal(scoreHit(0, 1.589).points, 20);
    assert.equal(scoreHit(0, 1.59).points, 40);
    assert.equal(scoreHit(0, 1.7).points, 40);
  });
  it("changes segment on either side of the top wedge", () => {
    const point = (degrees: number) =>
      scoreHit(
        Math.sin((degrees * Math.PI) / 180),
        Math.cos((degrees * Math.PI) / 180),
      );
    assert.equal(point(8.9).points, 60);
    assert.equal(point(9.1).points, 3);
    assert.equal(point(-8.9).points, 60);
    assert.equal(point(-9.1).points, 15);
  });
});
