exports.up = (pgm) => {
  pgm.addColumn('songs', {
    listened: {
      type: 'INT',
      default: 0,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('songs', 'listened');
};
