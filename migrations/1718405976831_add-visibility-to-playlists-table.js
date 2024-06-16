exports.up = (pgm) => {
  pgm.addColumn('playlists', {
    is_public: {
      type: 'BOOLEAN',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('playlists', 'is_public');
};
