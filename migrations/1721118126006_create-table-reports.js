exports.up = (pgm) => {
  pgm.createType('report_status', ['pending', 'reviewed', 'resolved']);

  pgm.createTable('reports', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    reporter: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    song_id: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    report_reason: {
      type: 'TEXT',
      notNull: true,
    },
    report_detail: {
      type: 'TEXT',
      notNull: true,
    },
    status: {
      type: 'report_status',
      notNull: true,
      default: 'pending',
    },
    created_at: {
      type: 'TIMESTAMP',
    },
    updated_at: {
      type: 'TIMESTAMP',
    },
  });

  pgm.addConstraint(
    'reports',
    'fk_reports.reporter_users.id',
    'FOREIGN KEY(reporter) REFERENCES users(id) ON DELETE CASCADE',
  );

  pgm.addConstraint(
    'reports',
    'fk_reports.song_id_songs.id',
    'FOREIGN KEY(song_id) REFERENCES songs(id) ON DELETE CASCADE',
  );
};

exports.down = (pgm) => {
  pgm.dropTable('reports');
  pgm.dropType('report_status');
};
