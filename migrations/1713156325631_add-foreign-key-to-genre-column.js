exports.up = (pgm) => {
  pgm.addConstraint(
    'songs',
    'fk_songs.genre_genres.id',
    'FOREIGN KEY(genre) REFERENCES genres(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint('songs', 'fk_songs.genre_genres.id');
};
