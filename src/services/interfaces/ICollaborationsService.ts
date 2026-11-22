export interface CollaborationPayload {
  playlistId: string;
  userId: string;
}

export interface ICollaborationsService {
  addCollaboration(playlistId: string, userId: string): Promise<string>;
  deleteCollaboration(playlistId: string, userId: string): Promise<void>;
  verifyCollaborator(playlistId: string, userId: string): Promise<void>;
}
