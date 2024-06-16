exports.up = (pgm) => {
  pgm.addColumn('songs', {
    cover: {
      type: 'TEXT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('songs', 'cover');
};
