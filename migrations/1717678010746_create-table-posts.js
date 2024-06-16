exports.up = (pgm) => {
  pgm.createTable('posts', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    artist: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    content: {
      type: 'TEXT',
      notNull: true,
    },
    image: {
      type: 'TEXT',
    },
    song_id: {
      type: 'VARCHAR(50)',
    },
    created_at: {
      type: 'TIMESTAMP',
    },
    updated_at: {
      type: 'TIMESTAMP',
    },
  });

  pgm.addConstraint(
    'posts',
    'fk_posts.artist_users.id',
    'FOREIGN KEY(artist) REFERENCES users(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('posts');
};
