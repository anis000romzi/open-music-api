exports.up = (pgm) => {
  pgm.createTable('albums', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    name: {
      type: 'TEXT',
      notNull: true,
    },
    year: {
      type: 'INT',
      notNull: true,
    },
    artist: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    cover: {
      type: 'TEXT',
    },
    created_at: {
      type: 'TIMESTAMP',
    },
    updated_at: {
      type: 'TIMESTAMP',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('albums');
};
