const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod-profil')
    .setDescription('Zeigt das Profil eines Nutzers mit Straf-Log')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der Nutzer dessen Profil angezeigt werden soll')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return interaction.reply({
        content: '❌ Nutzer nicht gefunden!',
        ephemeral: true
      });
    }

    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .map(role => role.toString())
      .join(', ') || 'Keine Rollen';

    const embed = new EmbedBuilder()
      .setColor('#2F3136')
      .setTitle(`📋 Profil von ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: 'Benutzername', value: `${target.username}#${target.discriminator}`, inline: true },
        { name: 'User ID', value: `${target.id}`, inline: true },
        { name: 'Bot', value: target.bot ? 'Ja ✓' : 'Nein', inline: true },
        { name: 'Server beigetreten', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: 'Account erstellt', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Rollen', value: roles, inline: false },
        { name: 'Verwarnungen', value: '0', inline: true },
        { name: 'Timeouts', value: member.communicationDisabledUntilTimestamp > Date.now() ? 'Aktiv' : 'Keine', inline: true }
      )
      .setFooter({ text: `Angefordert von ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};