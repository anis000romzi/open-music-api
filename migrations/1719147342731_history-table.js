exports.up = (pgm) => {
  pgm.createTable('history', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    time: {
      type: 'TEXT',
      notNull: true,
    },
  });

  pgm.addConstraint(
    'history',
    'unique_user_id_and_song_id_history',
    'UNIQUE(user_id, song_id)',
  );

  pgm.addConstraint(
    'history',
    'fk_history.user_id_users.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  );

  pgm.addConstraint(
    'history',
    'fk_history.song_id_songs.id',
    'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('history');
};
