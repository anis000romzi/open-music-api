exports.up = (pgm) => {
  pgm.createTable('follower_artist', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    artist_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
  });

  pgm.addConstraint(
    'follower_artist',
    'unique_user_id_and_artist_id',
    'UNIQUE(user_id, artist_id)',
  );

  pgm.addConstraint(
    'follower_artist',
    'fk_follower_artist.user_id_users.id',
    'FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE',
  );
  pgm.addConstraint(
    'follower_artist',
    'fk_follower_artist.artist_id_users.id',
    'FOREIGN KEY(artist_id) REFERENCES users(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('follower_artist');
};
