const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const cooldowns = new Map();
const COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 Tage

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blobfisch')
    .setDescription('Belegt jemanden mit einem Blobfisch (Cooldown: 7 Tage)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der Nutzer der mit Blobfisch belegt werden soll')
        .setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const userId = interaction.user.id;

    if (target.id === interaction.user.id) {
      return interaction.reply({
        content: '❌ Du kannst dich nicht selbst mit einem Blobfisch belegen!',
        ephemeral: true
      });
    }

    // Cooldown Check
    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + COOLDOWN;
      if (Date.now() < expirationTime) {
        const remaining = Math.ceil((expirationTime - Date.now()) / 1000 / 60 / 60 / 24);
        return interaction.reply({
          content: `⏰ Du kannst diesen Command erst in **${remaining} Tagen** wieder verwenden!`,
          ephemeral: true
        });
      }
    }

    cooldowns.set(userId, Date.now());

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('🐟 Blobfisch-Attacke!')
      .setDescription(`${target} wurde von ${interaction.user} mit einem großen **Blobfisch** belegt! 💥`)
      .addFields(
        { name: 'Angegriffen von', value: `${interaction.user.username}`, inline: true },
        { name: 'Nächster Angriff möglich in', value: '7 Tagen', inline: true }
      )
      .setImage('https://media.giphy.com/media/3o7TKU2VUhWrwgktAI/giphy.gif')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};