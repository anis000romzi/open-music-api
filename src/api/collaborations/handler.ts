import Hapi from '@hapi/hapi';
import autoBind from 'auto-bind';
import {
  CollaborationPayload,
  ICollaborationsService,
} from '../../services/interfaces/ICollaborationsService';
import { IPlaylistsService } from '../../services/interfaces/IPlaylistsService';
import { IUsersService } from '../../services/interfaces/IUsersService';
import { ICollaborationsValidator } from '../../validator/collaborations';

export class CollaborationsHandler {
  private _collaborationsService: ICollaborationsService;
  private _playlistsService: IPlaylistsService;
  private _usersService: IUsersService;
  private _validator: ICollaborationsValidator;

  constructor(
    collaborationsService: ICollaborationsService,
    playlistsService: IPlaylistsService,
    usersService: IUsersService,
    validator: ICollaborationsValidator,
  ) {
    this._collaborationsService = collaborationsService;
    this._playlistsService = playlistsService;
    this._usersService = usersService;
    this._validator = validator;

    autoBind(this);
  }

  async postCollaborationHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    const payload = request.payload as CollaborationPayload;
    this._validator.validateCollaborationPayload(payload);
    const { id } = request.auth.credentials as { id: string };
    const { playlistId, userId } = payload;

    await this._playlistsService.verifyPlaylistOwner(playlistId, id);
    await this._usersService.getUserById(userId);
    const collaborationId = await this._collaborationsService.addCollaboration(playlistId, userId);

    const response = h.response({
      status: 'success',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request: Hapi.Request) {
    const payload = request.payload as CollaborationPayload;
    this._validator.validateCollaborationPayload(payload);
    const { id } = request.auth.credentials as { id: string };
    const { playlistId, userId } = payload;

    await this._playlistsService.verifyPlaylistOwner(playlistId, id);
    await this._collaborationsService.deleteCollaboration(playlistId, userId);

    return {
      status: 'success',
      message: 'Collaboration deleted successfully',
    };
  }
}
