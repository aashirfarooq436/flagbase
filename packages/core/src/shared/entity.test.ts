import { describe, expect, it } from "vitest";

import { Entity } from "./entity";

class Foo extends Entity {
  constructor(id: string) {
    super(id);
  }
}

class Bar extends Entity {
  constructor(id: string) {
    super(id);
  }
}

describe("Entity", () => {
  it("treats same-type entities with the same id as equal", () => {
    expect(new Foo("1").equals(new Foo("1"))).toBe(true);
  });

  it("treats same-type entities with different ids as unequal", () => {
    expect(new Foo("1").equals(new Foo("2"))).toBe(false);
  });

  it("treats different types sharing an id as unequal", () => {
    // A Foo and a Bar that happen to share an id string are not the same thing.
    expect(new Foo("1").equals(new Bar("1"))).toBe(false);
  });
});
