exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    email: {
      type: 'TEXT',
      unique: true,
      notNull: true,
    },
    username: {
      type: 'VARCHAR(50)',
      unique: true,
      notNull: true,
    },
    password: {
      type: 'TEXT',
      notNull: true,
    },
    fullname: {
      type: 'TEXT',
      notNull: true,
    },
    is_active: {
      type: 'BOOLEAN',
      notNull: true,
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
  pgm.dropTable('users');
};
