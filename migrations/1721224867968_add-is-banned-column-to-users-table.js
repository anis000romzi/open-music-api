exports.up = (pgm) => {
  pgm.addColumn('users', {
    is_banned: {
      type: 'BOOLEAN',
      default: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'is_banned');
};
