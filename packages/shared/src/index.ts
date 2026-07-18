// @flagbase/shared — the technical, framework-agnostic toolkit shared across infrastructure,
// composition, and the apps. NOT the domain kernel (that is core/src/shared) and NEVER imported
// by core. Add cross-cutting tools here as modules; each also gets a subpath export.
export * from "./logger";
