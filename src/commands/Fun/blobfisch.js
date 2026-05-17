import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getGuildConfig, setGuildConfig } from '../../services/guildConfig.js';

const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export default {
    data: new SlashCommandBuilder()
        .setName('blobfisch')
        .setDescription('Fange einen Blobfisch! (Cooldown: 7 Tage)'),
    category: 'Fun',

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction, true);

            const guildConfig = await getGuildConfig(client, interaction.guild.id);
            
            if (!guildConfig.blobfisch) {
                guildConfig.blobfisch = {};
            }

            const userId = interaction.user.id;
            const lastCatch = guildConfig.blobfisch[userId] || 0;
            const now = Date.now();
            const timeRemaining = lastCatch + COOLDOWN_MS - now;

            if (timeRemaining > 0) {
                const days = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
                const hours = Math.ceil((timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const embed = warningEmbed(
                    `😭 Du hast bereits einen Blobfisch gefangen!\n\n⏳ Komm in **${days}d ${hours}h** zurück um einen weiteren zu fangen.`,
                    'Blobfisch Cooldown'
                );
                return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
            }

            // Erfolgreicher Fang!
            guildConfig.blobfisch[userId] = now;
            await setGuildConfig(client, interaction.guild.id, guildConfig);

            const funMessages = [
                `🐟 Wow! Du hast einen BLOBFISCH gefangen! Der arme Kerl sieht so traurig aus...`,
                `🫧 SPLASH! Ein riesiger Blobfisch ist dir ins Netz gegangen! So ein Glückstag!`,
                `🐡 Ein puffy Blobfisch hat sich für 7 Tage versteckt... aber DU hast ihn gefunden!`,
                `😢 Congratulations! Du hast den seltenen Blobfisch gefangen! Nächstes Mal in 7 Tagen...`,
            ];

            const randomMessage = funMessages[Math.floor(Math.random() * funMessages.length)];

            const embed = new EmbedBuilder()
                .setColor(0x00A8FF)
                .setTitle('🐟 Blobfisch gefangen!')
                .setDescription(randomMessage)
                .setImage('https://media.tenor.com/MwKaBK3NPq0AAAAC/blobfish-sad.gif')
                .setFooter({ text: `Nächster Fang in 7 Tagen verfügbar! | ${interaction.user.username}` });

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        } catch (error) {
            logger.error('Error in blobfisch command:', error);
            const embed = warningEmbed('Ein Fehler beim Fangen des Blobfisches ist aufgetreten!');
            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }
    }
};
