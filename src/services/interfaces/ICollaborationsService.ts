// Minimal contract used by the playlists service. Extend this when the
// collaborations module itself is migrated to TypeScript.
export interface ICollaborationsService {
  verifyCollaborator(playlistId: string, userId: string): Promise<void>;
}
