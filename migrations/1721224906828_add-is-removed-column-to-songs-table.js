exports.up = (pgm) => {
  pgm.addColumn('songs', {
    is_removed: {
      type: 'BOOLEAN',
      default: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('songs', 'is_removed');
};
