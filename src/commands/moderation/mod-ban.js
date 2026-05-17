const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod-ban')
    .setDescription('Bannt einen Nutzer permanent')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der zu bannende Nutzer')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('grund')
        .setDescription('Grund für den Ban')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('messages')
        .setDescription('Nachrichten-Anzahl zum Löschen (0-7 Tage)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const grund = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const messages = interaction.options.getInteger('messages') || 0;

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ Du kannst dich nicht selbst bannen!',
        ephemeral: true
      });
    }

    try {
      await interaction.guild.members.ban(target, {
        reason: grund,
        deleteMessageSeconds: messages * 86400
      });

      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚫 Nutzer gebannt')
        .addFields(
          { name: 'Nutzer', value: `<@${target.id}>`, inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Grund', value: grund, inline: false },
          { name: 'Gelöschte Nachrichten', value: `${messages} Tage`, inline: true }
        )
        .setFooter({ text: `ID: ${target.id}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      console.log(`[BAN] ${interaction.user.username} bannt ${target.username} - Grund: ${grund}`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: `❌ Fehler beim Ban: ${error.message}`,
        ephemeral: true
      });
    }
  }
};