import { z } from "zod";

const MAX_NAME = 100;

export const createProjectRequestSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
});
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;

export const renameProjectRequestSchema = z.object({
  name: z.string().min(1).max(MAX_NAME),
});
export type RenameProjectRequest = z.infer<typeof renameProjectRequestSchema>;
