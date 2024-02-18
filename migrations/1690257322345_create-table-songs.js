exports.up = (pgm) => {
  pgm.createTable('songs', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    title: {
      type: 'TEXT',
      notNull: true,
    },
    year: {
      type: 'INT',
      notNull: true,
    },
    genre: {
      type: 'TEXT',
      notNull: true,
    },
    artist: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    duration: {
      type: 'INT',
      notNull: true,
    },
    album_id: {
      type: 'VARCHAR(50)',
    },
    audio: {
      type: 'TEXT',
    },
    created_at: {
      type: 'TIMESTAMP',
    },
    updated_at: {
      type: 'TIMESTAMP',
    },
  });

  pgm.addConstraint(
    'songs',
    'fk_songs.album_id_albums.id',
    'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('songs');
};
