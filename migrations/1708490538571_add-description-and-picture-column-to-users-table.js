exports.up = (pgm) => {
  pgm.addColumn('users', {
    description: {
      type: 'TEXT',
    },
    picture: {
      type: 'TEXT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'description');
  pgm.dropColumn('users', 'picture');
};
