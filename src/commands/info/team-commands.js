const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team-commands')
    .setDescription('Zeigt alle verfügbaren Moderator-Commands'),

  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setColor('#2F3136')
        .setTitle('📋 Moderator Commands')
        .setDescription('Alle verfügbaren Commands für Test Mods, Mods und Admins')
        .addFields(
          {
            name: '🔨 Moderation',
            value: '`/mod-timeout` - Timeoutet Nutzer für 1 Tag\n`/mod-ban` - Bannt Nutzer permanent\n`/mod-profil` - Zeigt Nutzer-Profil mit Infos\n`/mod-warnings` - Zeigt Verwarnungen',
            inline: false
          },
          {
            name: '🎮 Counting-Spiel',
            value: '`/count-blacklist` - Schließt Nutzer aus\n`/count-blacklist-remove` - Hebt Ausschluss auf\n`/count-stats` - Zeigt Statistiken',
            inline: false
          },
          {
            name: '🎉 Fun',
            value: '`/blobfisch` - Belegt jemanden mit Blobfisch (Cooldown: 7 Tage)',
            inline: false
          },
          {
            name: '👥 Info',
            value: '`/team-list` - Zeigt Team-Mitglieder\n`/team-commands` - Zeigt diese Übersicht',
            inline: false
          }
        )
        .setFooter({ text: 'Für Test Mods, Mods und Admins sichtbar' })
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