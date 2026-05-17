const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('count-blacklist-remove')
    .setDescription('Hebt den Ausschluss eines Nutzers vom Counting-Spiel auf')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der Nutzer dessen Ausschluss aufgehoben werden soll')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');

    // TODO: Aus Datenbank entfernen
    console.log(`[COUNT-BLACKLIST-REMOVE] ${target.username} wurde wieder freigegeben`);

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Zum Counting-Spiel freigegeben')
      .addFields(
        { name: 'Nutzer', value: `<@${target.id}>`, inline: true },
        { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};