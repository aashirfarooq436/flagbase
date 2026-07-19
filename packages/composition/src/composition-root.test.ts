import { CreateFlagUseCase, SignUpUseCase } from "@flagbase/core";

import { describe, expect, it } from "vitest";

import { composition } from "./composition-root";

/**
 * The composition root has no logic to unit-test — but constructing the graph exercises
 * every wiring line, so a wrong constructor order or a missing dependency fails on import.
 * This also asserts each group exposes executable use-cases.
 */
describe("composition", () => {
  it("wires concrete use-cases", () => {
    expect(composition.flag.create).toBeInstanceOf(CreateFlagUseCase);
    expect(composition.user.signUp).toBeInstanceOf(SignUpUseCase);
  });

  it("exposes an executable use-case for every action in every feature", () => {
    const groups = [
      composition.user,
      composition.organization,
      composition.member,
      composition.invitation,
      composition.project,
      composition.flag,
    ];

    for (const group of groups) {
      for (const useCase of Object.values(group)) {
        expect(typeof useCase.execute).toBe("function");
      }
    }
  });
});
