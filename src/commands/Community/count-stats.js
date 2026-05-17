import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getGuildConfig } from '../../services/guildConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('count-stats')
        .setDescription('Zeige Counting-Spiel Statistiken'),
    category: 'Community',

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction);

            const guildConfig = await getGuildConfig(client, interaction.guild.id);

            if (!guildConfig.counting?.enabled) {
                const embed = errorEmbed('Das Counting-Spiel ist nicht aktiviert!');
                return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
            }

            const currentNumber = guildConfig.counting.currentNumber || 0;
            const record = guildConfig.counting.record || 0;
            const blacklist = guildConfig.counting.blacklist?.length || 0;
            const channel = interaction.guild.channels.cache.get(guildConfig.counting.channelId);

            const embed = successEmbed(
                `**Aktuelle Zahl:** ${currentNumber}\n🏆 **Rekord:** ${record}\n🚫 **Blacklistete Nutzer:** ${blacklist}\n📍 **Kanal:** ${channel ? channel.toString() : 'Nicht gefunden'}`,
                '📊 Counting Statistiken'
            );

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        } catch (error) {
            logger.error('Error in count-stats command:', error);
            const embed = errorEmbed('Ein Fehler ist aufgetreten!');
            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }
    }
};
