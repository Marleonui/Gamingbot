const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod-warnings')
    .setDescription('Zeigt alle Verwarnungen eines Nutzers')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der Nutzer dessen Verwarnungen angezeigt werden sollen')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');

    // Placeholder: Datenbank-Integration erforderlich
    const warnings = [
      { datum: '2026-05-15', grund: 'Spam', moderator: 'Admin#0001' },
      { datum: '2026-05-10', grund: 'Unangemessenes Verhalten', moderator: 'Mod#0002' }
    ];

    const warningsList = warnings.length > 0
      ? warnings.map((w, i) => `${i + 1}. [${w.datum}] **${w.grund}** - von ${w.moderator}`).join('\n')
      : 'Keine Verwarnungen';

    const embed = new EmbedBuilder()
      .setColor(warnings.length > 0 ? '#FFA500' : '#00FF00')
      .setTitle(`⚠️ Verwarnungen von ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Nutzer', value: `<@${target.id}>`, inline: true },
        { name: 'Verwarnungen', value: `${warnings.length}`, inline: true },
        { name: 'Status', value: warnings.length >= 3 ? '🔴 Kritisch' : warnings.length > 0 ? '🟡 Gewarnt' : '🟢 Sauber', inline: true },
        { name: 'Verwarnungs-History', value: warningsList }
      )
      .setFooter({ text: `Angefordert von ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};