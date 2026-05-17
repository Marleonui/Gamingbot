const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team-list')
    .setDescription('Zeigt alle Team-Mitglieder'),

  async execute(interaction) {
    try {
      const guild = interaction.guild;
      const members = await guild.members.fetch();

      // Rollen-Namen (anpassen an euer System)
      const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'admin');
      const modRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'mod');
      const testModRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'test mod');

      const admins = members
        .filter(m => adminRole && m.roles.cache.has(adminRole.id))
        .map(m => `• ${m.user.username}`)
        .join('\n') || 'Keine';

      const mods = members
        .filter(m => modRole && m.roles.cache.has(modRole.id))
        .map(m => `• ${m.user.username}`)
        .join('\n') || 'Keine';

      const testMods = members
        .filter(m => testModRole && m.roles.cache.has(testModRole.id))
        .map(m => `• ${m.user.username}`)
        .join('\n') || 'Keine';

      const totalTeam = members.filter(m => 
        (adminRole && m.roles.cache.has(adminRole.id)) ||
        (modRole && m.roles.cache.has(modRole.id)) ||
        (testModRole && m.roles.cache.has(testModRole.id))
      ).size;

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('👥 Team-Mitglieder')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '👑 Admins', value: admins, inline: false },
          { name: '🛡️ Moderatoren', value: mods, inline: false },
          { name: '🧪 Test Mods', value: testMods, inline: false }
        )
        .setFooter({ text: `Gesamt Team-Mitglieder: ${totalTeam}` })
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