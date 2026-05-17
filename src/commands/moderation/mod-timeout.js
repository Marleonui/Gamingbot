const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod-timeout')
    .setDescription('Timeoutet einen Nutzer für 1 Tag')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der zu timeoutende Nutzer')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('grund')
        .setDescription('Grund für den Timeout')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const grund = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({
        content: '❌ Nutzer nicht gefunden!',
        ephemeral: true
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        content: '❌ Ich kann diesen Nutzer nicht timeout!',
        ephemeral: true
      });
    }

    try {
      await member.timeout(86400000, grund); // 1 Tag in Millisekunden

      const embed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('⏱️ Timeout ausgelöst')
        .addFields(
          { name: 'Nutzer', value: `<@${target.id}>`, inline: true },
          { name: 'Dauer', value: '1 Tag', inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Grund', value: grund }
        )
        .setFooter({ text: `ID: ${target.id}` })
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
      console.log(`[TIMEOUT] ${interaction.user.username} timeoutet ${target.username} - Grund: ${grund}`);
    } catch (error) {
      console.error('Timeout-Fehler:', error);
      interaction.reply({
        content: '❌ Fehler beim Timeout!',
        ephemeral: true
      });
    }
  }
};