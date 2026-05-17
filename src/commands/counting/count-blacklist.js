const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('count-blacklist')
    .setDescription('Schließt einen Nutzer vom Counting-Spiel aus')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der Nutzer der ausgeschlossen werden soll')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('grund')
        .setDescription('Grund für den Ausschluss')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const grund = interaction.options.getString('grund') || 'Kein Grund angegeben';

    // TODO: In Datenbank speichern
    console.log(`[COUNT-BLACKLIST] ${target.username} wurde ausgeschlossen - Grund: ${grund}`);

    const embed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🚫 Vom Counting-Spiel ausgeschlossen')
      .addFields(
        { name: 'Nutzer', value: `<@${target.id}>`, inline: true },
        { name: 'Grund', value: grund, inline: false },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};