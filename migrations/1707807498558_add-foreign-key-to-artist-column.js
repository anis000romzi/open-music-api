exports.up = (pgm) => {
  pgm.addConstraint(
    'songs',
    'fk_songs.artist_users.id',
    'FOREIGN KEY(artist) REFERENCES users(id) ON DELETE CASCADE',
  );

  pgm.addConstraint(
    'albums',
    'fk_albums.artist_users.id',
    'FOREIGN KEY(artist) REFERENCES users(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint('songs', 'fk_songs.artist_users.id');

  pgm.dropConstraint('albums', 'fk_albums.artist_users.id');
};
