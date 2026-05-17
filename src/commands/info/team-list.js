const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team-list')
    .setDescription('Zeigt alle Team-Mitglieder'),

  async execute(interaction) {
    try {
      const guild = interaction.guild;
      const members = await guild.members.fetch();

      // Rollen-IDs (anpassen an euer System)
      const adminRole = guild.roles.cache.find(r => r.name === 'Admin');
      const modRole = guild.roles.cache.find(r => r.name === 'Mod');
      const testModRole = guild.roles.cache.find(r => r.name === 'Test Mod');

      const admins = members.filter(m => m.roles.cache.has(adminRole?.id)).map(m => `• ${m.user.username}`).join('\n') || 'Keine';
      const mods = members.filter(m => m.roles.cache.has(modRole?.id)).map(m => `• ${m.user.username}`).join('\n') || 'Keine';
      const testMods = members.filter(m => m.roles.cache.has(testModRole?.id)).map(m => `• ${m.user.username}`).join('\n') || 'Keine';

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('👥 Team-Mitglieder')
        .addFields(
          { name: '👑 Admins', value: admins, inline: false },
          { name: '🛡️ Moderatoren', value: mods, inline: false },
          { name: '🧪 Test Mods', value: testMods, inline: false }
        )
        .setFooter({ text: `Gesamt Team-Mitglieder: ${members.filter(m => m.roles.cache.has(adminRole?.id) || m.roles.cache.has(modRole?.id) || m.roles.cache.has(testModRole?.id)).size}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: `❌ Fehler: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
