import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createEmbed, successEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { getGuildConfig, setGuildConfig } from '../../services/guildConfig.js';

export default {
    data: new SlashCommandBuilder()
        .setName('team-list')
        .setDescription('Zeige alle Team-Mitglieder'),
    category: 'Utility',

    async execute(interaction, config, client) {
        try {
            await InteractionHelper.safeDefer(interaction);

            const guildConfig = await getGuildConfig(client, interaction.guild.id);
            const teamMembers = guildConfig.teamMembers || [];

            if (teamMembers.length === 0) {
                const embed = createEmbed({ title: '👥 Team-Mitglieder' })
                    .setDescription('Keine Team-Mitglieder definiert.');
                return await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
            }

            const members = [];
            for (const memberId of teamMembers) {
                try {
                    const user = await client.users.fetch(memberId);
                    members.push(`• **${user.username}** (${user.id})`);
                } catch (err) {
                    members.push(`• Unbekannter Nutzer (${memberId})`);
                }
            }

            const embed = createEmbed({ 
                title: '👥 Team-Mitglieder',
                color: 0x5865F2
            })
                .setDescription(`**Insgesamt: ${teamMembers.length}**\n\n${members.join('\n')}`);

            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        } catch (error) {
            logger.error('Error in team-list command:', error);
            const embed = errorEmbed('Ein Fehler ist aufgetreten!');
            await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
        }
    }
};
