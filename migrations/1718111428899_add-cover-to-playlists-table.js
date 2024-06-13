exports.up = (pgm) => {
  pgm.addColumn('playlists', {
    cover: {
      type: 'TEXT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('playlists', 'cover');
};
