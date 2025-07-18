module.exports = {
  dependsOn: [],
  run: async (client) => {
    await client.query(`
      INSERT INTO users (name, email)
      VALUES 
        ('Alice', 'alice@example.com'),
        ('Bob', 'bob@example.com')
      ON CONFLICT (email) DO NOTHING;
    `);
  },
};
