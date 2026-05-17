const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('count-stats')
    .setDescription('Zeigt die Counting-Spiel Statistiken'),

  async execute(interaction) {
    // TODO: Aus Datenbank abrufen
    const stats = {
      aktuelleZahl: 42,
      höchstzahl: 1253,
      gespielteRunden: 156,
      aktiveSpieler: 28,
      topSpieler: [
        { name: 'Player1', counts: 542 },
        { name: 'Player2', counts: 438 },
        { name: 'Player3', counts: 365 }
      ]
    };

    const topList = stats.topSpieler
      .map((p, i) => `${i + 1}. **${p.name}** - ${p.counts} Zählungen`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎮 Counting-Spiel Statistiken')
      .addFields(
        { name: 'Aktuelle Zahl', value: `${stats.aktuelleZahl}`, inline: true },
        { name: 'Höchstzahl', value: `${stats.höchstzahl}`, inline: true },
        { name: 'Gespielte Runden', value: `${stats.gespielteRunden}`, inline: true },
        { name: 'Aktive Spieler', value: `${stats.aktiveSpieler}`, inline: true },
        { name: '🏆 Top Spieler', value: topList }
      )
      .setFooter({ text: 'Aktualisiert am' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};