/**
 * External identity providers a user can sign in with.
 *
 * Google only in v1. GitHub and Apple slot in here as new members — that's the point
 * of modelling OAuth accounts as their own entity rather than as nullable columns on
 * User: a new provider is a new row, not a schema change.
 */
export enum OAuthProvider {
  Google = "google",
}
