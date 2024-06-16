exports.up = (pgm) => {
  pgm.createTable('user_playlist_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    playlist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint(
    'user_playlist_likes',
    'unique_user_id_and_playlist_id',
    'UNIQUE(user_id, playlist_id)',
  );

  pgm.addConstraint(
    'user_playlist_likes',
    'fk_user_playlist_likes.user_id_users.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
  pgm.addConstraint(
    'user_playlist_likes',
    'fk_user_playlist_likes.playlist_id_playlists.id',
    'FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('user_playlist_likes');
};
