import {
  ConflictError,
  type Flag,
  type FlagKey,
  type IFlagRepository,
} from "@flagbase/core";

import { isDuplicateKeyError } from "../../lib/mongoose/mongo-errors";
import { FlagMapper } from "./flag.mapper";
import { FlagModel } from "./flag.model";

/**
 * The Mongo-backed IFlagRepository.
 *
 * Reads use .lean() to get plain documents rather than hydrated Mongoose objects —
 * faster, and the mapper wants plain fields anyway. Every read funnels through the
 * mapper so nothing above this layer ever touches a document.
 */
export class MongoFlagRepository implements IFlagRepository {
  async findById(id: string): Promise<Flag | null> {
    const document = await FlagModel.findById(id).lean();
    return document ? FlagMapper.toDomain(document) : null;
  }

  async findByProjectAndKey(
    projectId: string,
    key: FlagKey,
  ): Promise<Flag | null> {
    const document = await FlagModel.findOne({
      projectId,
      key: key.value,
    }).lean();
    return document ? FlagMapper.toDomain(document) : null;
  }

  async findByProjectId(projectId: string): Promise<Flag[]> {
    const documents = await FlagModel.find({ projectId }).lean();
    return documents.map(FlagMapper.toDomain);
  }

  /**
   * Upserts the whole document — the entity is the source of truth, so save replaces
   * rather than patches. A unique-index collision (a duplicate project+key from a
   * racing request) is translated into a domain ConflictError so callers above don't
   * have to know Mongo error codes.
   */
  async save(flag: Flag): Promise<void> {
    const document = FlagMapper.toDocument(flag);

    try {
      await FlagModel.replaceOne({ _id: document._id }, document, {
        upsert: true,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError(
          `A flag with key "${flag.key.value}" already exists in this project`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    await FlagModel.deleteOne({ _id: id });
  }
}
