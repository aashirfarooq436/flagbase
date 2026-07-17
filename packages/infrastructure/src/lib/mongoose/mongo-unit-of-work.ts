import type { IUnitOfWork, TransactionalRepositories } from "@flagbase/core";
import mongoose from "mongoose";

import { MongoFlagRepository } from "../../persistence/flag/mongo-flag.repository";
import { MongoInvitationRepository } from "../../persistence/invitation/mongo-invitation.repository";
import { MongoMemberRepository } from "../../persistence/member/mongo-member.repository";
import { MongoOrganizationRepository } from "../../persistence/organization/mongo-organization.repository";
import { MongoProjectRepository } from "../../persistence/project/mongo-project.repository";
import { MongoUserRepository } from "../../persistence/user/mongo-user.repository";

/**
 * The Mongo implementation of IUnitOfWork.
 *
 * Opens a session, runs the work inside a transaction with session-bound repositories,
 * and commits — or aborts if the work throws. `session.withTransaction` also retries the
 * whole callback on a transient write conflict, which is what makes two concurrent
 * AcceptInvitations resolve correctly (the loser re-reads the now-accepted invitation and
 * `invitation.accept()` throws).
 *
 * Requires a replica set — MongoDB only supports multi-document transactions there. Atlas
 * (even the free M0) is a replica set; tests use a 1-node MongoMemoryReplSet.
 */
export class MongoUnitOfWork implements IUnitOfWork {
  async run<T>(
    work: (repos: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    const session = await mongoose.startSession();

    try {
      // `let ... !` because withTransaction may run the callback more than once (retry);
      // the final assignment is the committed result.
      let result!: T;

      await session.withTransaction(async () => {
        result = await work({
          organizations: new MongoOrganizationRepository(session),
          members: new MongoMemberRepository(session),
          invitations: new MongoInvitationRepository(session),
          users: new MongoUserRepository(session),
          projects: new MongoProjectRepository(session),
          flags: new MongoFlagRepository(session),
        });
      });

      return result;
    } finally {
      await session.endSession();
    }
  }
}
