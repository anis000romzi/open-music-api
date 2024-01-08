exports.up = (pgm) => {
  pgm.addColumn('songs', {
    audio: {
      type: 'TEXT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('songs', 'audio');
};
