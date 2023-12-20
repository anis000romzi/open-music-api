exports.up = (pgm) => {
  pgm.sql(
    "INSERT INTO albums(id, name, year) VALUES ('old_albums', 'old_songs', '2022')",
  );

  pgm.sql("UPDATE songs SET album_id = 'old_albums' WHERE album_id IS NULL");

  pgm.addConstraint(
    'songs',
    'fk_songs.album_id_albums.id',
    'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint('songs', 'fk_songs.album_id_albums.id');

  pgm.sql("UPDATE songs SET album_id = NULL WHERE album_id = 'old_albums'");

  pgm.sql("DELETE FROM albums WHERE id = 'old_albums'");
};
