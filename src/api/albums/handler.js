const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(albumsService, songsService, storageService, albumsValidator, uploadsValidator) {
    this._albumsService = albumsService;
    this._songsService = songsService;
    this._storageService = storageService;
    this._albumsValidator = albumsValidator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._albumsValidator.validateAlbumPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;

    const albumId = await this._albumsService.addAlbum(request.payload, credentialId);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const {
      id: albumId, name, year, artist_id: artistId, artist, cover: coverUrl,
    } = await this._albumsService.getAlbumById(id);

    const albumLikes = await this._albumsService.getAlbumLikes(id);
    const mappedAlbumLikes = albumLikes.result.map((like) => like.id);

    const songs = await this._songsService.getSongsByAlbum(id);
    const mappedSongs = await Promise.all(songs.map(async (song) => {
      const likes = await this._songsService.getSongLikes(song.id);
      const mappedLikes = likes.result.map((like) => like.id);

      return {
        ...song,
        likes: mappedLikes,
      };
    }));

    return {
      status: 'success',
      data: {
        album: {
          id: albumId,
          name,
          year,
          artistId,
          artist,
          coverUrl,
          likes: mappedAlbumLikes,
          songs: mappedSongs,
        },
      },
    };
  }

  async getAlbumsByArtistHandler(request) {
    const { id } = request.params;
    const albums = await this._albumsService.getAlbumsByArtist(id);

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getOwnedAlbumsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const albums = await this._albumsService.getAlbumsByArtist(credentialId);

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getLikedAlbumsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const albums = await this._albumsService.getLikedAlbums(credentialId);

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getPopularAlbumsHandler() {
    const albums = await this._albumsService.getPopularAlbums();

    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._albumsValidator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.verifyAlbumArtist(id, credentialId);
    await this._albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.verifyAlbumArtist(id, credentialId);
    await this._albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumLikeHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.getAlbumById(albumId);
    await this._albumsService.addLikeToAlbum(credentialId, albumId);

    const response = h.response({
      status: 'success',
      message: 'Like berhasil ditambahkan ke album',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeHandler(request) {
    const { id: albumId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.deleteLikeFromAlbum(credentialId, albumId);

    return {
      status: 'success',
      message: 'Like berhasil dihapus dari album',
    };
  }

  async getAlbumLikeHandler(request, h) {
    const { id } = request.params;

    const likes = await this._albumsService.getAlbumLikes(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: likes.result.length,
      },
    });

    if (likes.cache) {
      response.header('X-Data-Source', 'cache');
    }

    return response;
  }

  async postUploadCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    await this._albumsService.getAlbumById(id);
    await this._albumsService.verifyAlbumArtist(id, credentialId);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const fileLocation = `http://${process.env.HOST}:${process.env.PORT}/albums/cover/${filename}`;

    await this._albumsService.addCoverToAlbum(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
      data: {
        fileLocation,
      },
    });

    response.code(201);
    return response;
  }
}

module.exports = AlbumsHandler;
