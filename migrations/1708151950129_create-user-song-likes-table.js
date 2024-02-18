exports.up = (pgm) => {
  pgm.createTable('user_song_likes', {
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
  });

  pgm.addConstraint(
    'user_song_likes',
    'unique_user_id_and_song_id',
    'UNIQUE(user_id, song_id)',
  );

  pgm.addConstraint(
    'user_song_likes',
    'fk_user_song_likes.user_id_users.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
  pgm.addConstraint(
    'user_song_likes',
    'fk_user_song_likes.song_id_songs.id',
    'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('user_song_likes');
};
